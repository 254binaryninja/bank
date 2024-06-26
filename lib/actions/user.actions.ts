'use server';

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { encryptId, extractCustomerIdFromUrl, parseStringify } from "../utils";
import { CountryCode, ProcessorTokenCreateRequest, ProcessorTokenCreateRequestProcessorEnum, Products } from "plaid";
import { plaidClient } from "../plaid";
import { revalidatePath } from "next/cache";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";
import { User } from "lucide-react";


const {
  APPWRITE_BANK_ID:DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID:COLLECTION_ID,
  APPWRITE_BANKS_ID:BANKS_ID
} = process.env;

export const getUserInfo = async ({userId}:getUserInfoProps) =>{
   try{
      
    const {database} = await createAdminClient();

    const user = await database.listDocuments(
     DATABASE_ID!,
     COLLECTION_ID!,
     [Query.equal('userId',[userId])]
    );

    return parseStringify(user.documents[0]);

   }catch(error){

   }
}

export const signIn = async ({email, password}: signInProps) => {
    try{
      const { account } = await createAdminClient();
      const session = await account.createEmailPasswordSession(email, password);
      
      cookies().set("appwrite-session", session.secret, {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        secure: true,
      });

      
      const user = await getUserInfo({
        userId : session.userId
      });
      return parseStringify(user);
    }catch(error){
        console.log(error)
    }
}

export const signUp = async ({password , ...userData }: SignUpParams) => {
    const {email , firstName, lastName} = userData;

    let newUserAccount;

   try{
       const { account, database } = await createAdminClient();
      newUserAccount = await account.create(
            ID.unique(), 
            email,
            password,
            `${firstName} ${lastName}`
        );

         if(!newUserAccount) throw Error("Error creating user") 
          
          const dwollaCustomerUrl = await createDwollaCustomer({
            ...userData,
            type: 'personal',
            postalCode: "00000"
          })

          if(!dwollaCustomerUrl) throw new Error("Error creating dwolla customer")

           const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl) 

           const newUser = await database.createDocument(
            DATABASE_ID!,
            COLLECTION_ID!,
            ID.unique(),
            {
              ...userData,
              userId: newUserAccount.$id,
              dwollaCustomerId,
              dwollaCustomerUrl,
            }
           )

         const session = await account.createEmailPasswordSession(email, password);
      
        cookies().set("appwrite-session", session.secret, {
          path: "/",
          httpOnly: true,
          sameSite: "strict",
          secure: true,
        });

        return parseStringify(newUser);
      

    }catch(error){
        console.log(error)
    }
}



export async function getLoggedInUser() {
    try {
      const { account } = await createSessionClient();
      const result =  await account.get();

      const user = await getUserInfo({userId:result.$id})
       
      return parseStringify(user)
    } catch (error) {
      return null;
    }
  }
  

  export const logoutAccount = async () =>{
    try{

      const {account} = await createSessionClient();
      cookies().delete('appwrite-session');

      await account.deleteSession('current');

    }catch(error){
      return null;
    }
 
  }


  export const createLinkToken = async (user:User)=>{
    try{
     
        const tokenParams = {
          user:{
            client_user_id : user.$id
          },
          client_name:`${user.firstName} ${user.lastName}`,
          products:['auth'] as Products[],
          language:'en',
          country_codes:['US'] as unknown as CountryCode[],
        }

        const response = await plaidClient.linkTokenCreate(tokenParams);
        return parseStringify({linkToken : response.data.link_token});
    
    }catch(error){
      console.log(error)
    }
  }

  export const createBankAccount = async ({
    userId,bankId,accountId,accessToken,fundingSourceUrl,shareableId
  }:createBankAccountProps) =>{
    try{
      const {database} = await createAdminClient();
      const bankAccount = await database.createDocument(
       DATABASE_ID!,
       BANKS_ID!,
       ID.unique(),
       {
        userId,
        bankId,
        accountId,
        accessToken,
        fundingSourceUrl,
        shareableId
       }
      )

      return parseStringify(bankAccount)

    }catch(error){

    }
  }

  export const exchangePublicToken = async ({
    publicToken,
    user
  }:exchangePublicTokenProps)=>{
    try{
      // Exchange public token for access token and item ID
      const response  =  await plaidClient.itemPublicTokenExchange({
        public_token:publicToken
      });

      const accessToken = response.data.access_token;
      const itemId = response.data.item_id;

     // Get account information from Plaid using the access token

     const accountsResponse = await plaidClient.accountsGet({
      access_token:accessToken,
     })

     const accountData = accountsResponse.data.accounts[0]

     //create a processor token for dwolla using the access Token and account Id
     
     const request: ProcessorTokenCreateRequest = {
      access_token : accessToken,
      account_id : accountData.account_id,
      processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum
     }

     const ProcessorTokenResponse = await plaidClient.processorTokenCreate(request);
     const processorToken = ProcessorTokenResponse.data.processor_token;

     // Create a funding source URL for the account using the Dwolla customer Id , processor Token , and bank name

     const fundingSourceUrl = await addFundingSource({
      dwollaCustomerId:user.dwollaCustomerId,
      processorToken,
      bankName:accountData.name,
     })
     // If funding source is not created throw an error
     if(!fundingSourceUrl) throw Error

     // Create a bank account  using the userID , itemId , accountId , accessToken , fundingsourceUrl  and sharable ID
     
     await createBankAccount({
      userId:user.$id,
      bankId:itemId,
      accountId:accountData.account_id,
      accessToken,
      fundingSourceUrl,
      shareableId:encryptId(accountData.account_id),
     })
     // revalidate path to reflect changes 
     revalidatePath('/')
     // Return a success message
     return parseStringify({
      publicTokenExchange:"Complete",
     })
    }catch(error){
     console.log("An error occured while creating exchanging token:",error)
    }
}

export const getBanks = async ({userId}:getBanksProps) =>{
  try{
     const {database} = await createAdminClient();

     const banks = await database.listDocuments(
      DATABASE_ID!,
      BANKS_ID!,
      [Query.equal('userId',[userId])]
     );

     return parseStringify(banks.documents);
  }catch(error){
    console.log(error)
  }
}


export const getBank = async ({documentId}:getBankProps) =>{
  try{
     const {database} = await createAdminClient();

     const bank = await database.listDocuments(
      DATABASE_ID!,
      BANKS_ID!,
      [Query.equal('$id',[documentId])]
     );

     return parseStringify(bank.documents[0]);
  }catch(error){
    console.log(error)
  }
}

export const getBankByAccountId = async ({ accountId }: getBankByAccountIdProps) => {
  try {
    const { database } = await createAdminClient();

    const bank = await database.listDocuments(
      DATABASE_ID!,
      BANKS_ID!,
      [Query.equal('accountId', [accountId])]
    )

    if(bank.total !== 1) return null;

    return parseStringify(bank.documents[0]);
  } catch (error) {
    console.log(error)
  }
}
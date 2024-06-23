'use client'
import Link from 'next/link'
import { useState } from 'react'
import Image from "next/image"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
 import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import CustomInput from './CustomInput'
import { authFormSchema } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { signIn, signUp } from '@/lib/actions/user.actions'
import { useRouter } from 'next/navigation'



const AuthForm = ({type} : {type:string}) => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const formSchema = authFormSchema(type);
      // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password:'',
    },
  })
 
  // 2. Define a submit handler.
  const  onSubmit = async (data: z.infer<typeof formSchema>)=> {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    setIsLoading(true)
    try{
       // sign up with appwrite and create a plaid token

       if(type === 'sign-up'){
          // await signup function
          const newUser = await signUp(data);
          
          setUser(newUser);
       }

       if(type === 'sign-in'){
         // await sign in function
        const response = await signIn({
          email : data.email,
          password : data.password,
        })

        if(response) router.push('/')

       }
    }catch(error){
       console.log(error)
    }finally{
      setIsLoading(false)
    }
  }
  
  return (
    <section className='auth-form'>
      <header className='flex flex-col gap-5 md:gap-8'>
      <Link href='#' className=' cursor-pointer flex items-center gap-1 p-4'>
            <Image src='/icons/logo.svg' alt='logo' width={34} height={34} />
            <h1 className='text-26 font-ibm-plex-serif text-black-1 font-bold m-2'>Horizon</h1>
            </Link>

          <div className='flex flex-col gap-1 md:gap-3'>
            <h1 className='text-24 lg:text-36 font-semibold text-gray-900'>
              {user ? 'Link an account' : type === 'sign-in' ? 'Sign-In' : 'Sign-Up'}
              <p className='text-16 font-normal text-gray-600'>
                 {user ? 'Link your account to get started' : 'Please enter your details to get started'}
              </p>
              </h1>
         </div>  
      </header>
      {
        user ? (
            <div>
                {/* PlaidLink */}
            </div>
        ) : (
            <>
              <Form {...form}>
     <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
         {type === 'sign-up' && (
            <>
            <div className='flex gap-4'>
            <CustomInput
             control={form.control}
             name='firstname'
             label='First Name'
             placeholder='Enter your First name'
            />
             <CustomInput
             control={form.control}
             name='lastname'
             label='Last Name'
             placeholder='Enter your Last name'
            />
            </div>
           
            <CustomInput
             control={form.control}
             name='address1'
             label='Address'
             placeholder='Enter your specific address'
            />
            <div className='flex gap-4'>
            <CustomInput
             control={form.control}
             name='county'
             label='County'
             placeholder='Example Nairobi'
            />
            <CustomInput
             control={form.control}
             name='postalCode'
             label='Postal Code'
             placeholder='Example : 0000'
            />
            </div>
            
            <div className='flex gap-4'>
            <CustomInput
             control={form.control}
             name='dateOfBirth'
             label='Date of Birth'
             placeholder='yyyy-mm-dd'
            />
            <CustomInput
             control={form.control}
             name='ssn'
             label='SSN'
             placeholder='Example : 1234'
            />
            </div>
          
            </>
         )}
     <CustomInput
         control={form.control}
          name='email'
          label='Email'
          placeholder='Enter your email'
        />
        <CustomInput
         control={form.control}
          name='password'
          label='password'
          placeholder='Enter your password'
        />
        <div className='flex flex-col gap-4'>
        <Button type="submit" disabled={isLoading} className='form-btn'>
            {isLoading ? (
                <>
                <Loader2 size={20} className='animate-spin'/> &nbsp;
                  Loading...
                </>
            ) : type === 'sign-in' ? 'Sign In' : 'Sign Up' 
            }
        </Button>
        </div>
        
      </form>
    </Form>
    <footer className='flex justify-center gap-1'>
        <p className='text-14 font-normal text-gray-600'>
            {type === 'sign-in' ? " Don't have an account ? " : "Already have an account ? "}
        </p>
        <Link href={type === 'sign-in' ? '/sign-up' : '/sign-in'} className='form-link'>
        {type === 'sign-in' ? 'Sign Up' : 'Sign In'}
         </Link>
    </footer>
            </>
        )
      }
    </section>
  )
}

export default AuthForm
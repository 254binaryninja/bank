import HeaderBox from '@/components/HeaderBox'
import RightSideBar from '@/components/RightSideBar'
import TotalBalanceBox from '@/components/TotalBalanceBox'
import React from 'react'

const Home = () => {

    const loggedIn = { firstName: 'Arnold', lastName:'Chemist',email:'arnoldmusandu@gmail.com'}
  return (
    <section className='home'>
        <div className='home-content'>
          <div className='home-header font-semibold text-4xl font-inter'>
            <HeaderBox
             type='greeting'
             title='Welcome'
             user={loggedIn?.firstName || 'Guest'}
             subtext="Access and manage your account and transactions efficiently."
            />
            <TotalBalanceBox
             accounts={[]}
             totalBanks={1}
             totalCurrentBalance={1250.35}
            />
          </div>
          RECENT TRANSACTONS
        </div>
        <RightSideBar
        user={loggedIn}
        transactions={[]}
        banks={[{currentBalance:3450.44},{currentBalance:234.44}]}
        />
    </section>
  )
}

export default Home
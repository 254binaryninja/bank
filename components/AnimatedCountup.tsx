'use client'
import CountUp from 'react-countup'

const AnimatedCountup = ({amount}:{amount: number}) => {
  return (
    <span className='w-full'>
     <CountUp
     duration={1.75}
     decimals={2}
      decimal='.'
      prefix='$'
     end={amount}/>
    </span>
  )
}

export default AnimatedCountup
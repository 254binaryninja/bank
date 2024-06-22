import React from 'react'

const HeaderBox = ({type='title',title ,subtext, user}: HeaderBoxProps) => {
  return (
    <div className='header-box'>
      <h1 className='header-box-tiltle'>
         {title}
         {type === 'greeting' && (
            <span className='text-bankGradient font-semibold font-inter'>
                &nbsp; {user}
            </span>
         )}
      </h1>
      <p className='header-box-subtext font-inter'>{subtext}</p>
    </div>
  )
}

export default HeaderBox
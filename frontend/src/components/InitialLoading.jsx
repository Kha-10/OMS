import React from 'react'
import logo from '@/assets/logo.png'

const InitialLoading = () => {
  return (
    <div className='h-screen flex items-center justify-center'>
        <img src={logo} alt="logo" className='w-[200px] animate-bounce'/>
    </div>
  )
}

export default InitialLoading
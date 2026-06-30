import RepositoriesList from '@/module/setting/components/RepositoriesList'
import UserProfileForm from '@/module/setting/components/UserProfileForm'
import React from 'react'

const SettingPage = () => {
  return (
   <div className='space-x-6'>
      <div className="">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account setting and connected repositories</p>
      </div>

      <UserProfileForm/>
      <RepositoriesList/>

    </div>
  )
}

export default SettingPage

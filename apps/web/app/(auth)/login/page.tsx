import GithubLoginUI from '@/features/auth/components/GithubLoginUI'
import { requireUnAuth } from '@/lib/auth/require-unauth'
import React from 'react'

const LoginPage = async () => {
  await requireUnAuth()
  return (
    <div>
      <GithubLoginUI/>      
    </div>
  )
}

export default LoginPage

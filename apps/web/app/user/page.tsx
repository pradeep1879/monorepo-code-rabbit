"use client"

import { getUser } from "../actions/user"

const Page = () => {

  const handleClick = async () => {
    const users = await getUser()

    console.log(users)
  }

  return (
    <div>
      <button onClick={handleClick}>
        Get Users
      </button>
    </div>
  )
}

export default Page 
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export default async function HomePage() {
  // Check if user is authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session?.session) {
    // User is logged in, redirect to studio
    redirect('/studio')
  } else {
    // User is not logged in, show welcome page
    redirect('/welcome')
  }
  
  return null
}
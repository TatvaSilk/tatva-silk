import LoginPanel from '@/components/LoginPanel'
import AccountProfile from '@/components/AccountProfile'

export const revalidate = 0

export default function AccountPage() {
  return (
    <main style={{ padding: '40px', maxWidth: 1080, margin: '0 auto' }}>
      <h1>Account</h1>
      <LoginPanel />
      <AccountProfile />
    </main>
  )
}

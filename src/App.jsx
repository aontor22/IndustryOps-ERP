import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { ensureProfileAndOrg } from './lib/authService'
import Layout from './components/Layout.jsx'
import AuthPage from './pages/Auth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Products from './pages/Products.jsx'
import Customers from './pages/Customers.jsx'
import Suppliers from './pages/Suppliers.jsx'
import Sales from './pages/Sales.jsx'
import Purchases from './pages/Purchases.jsx'
import Expenses from './pages/Expenses.jsx'
import Reports from './pages/Reports.jsx'
import Settings from './pages/Settings.jsx'

const pages = {
  dashboard: Dashboard,
  products: Products,
  customers: Customers,
  suppliers: Suppliers,
  sales: Sales,
  purchases: Purchases,
  expenses: Expenses,
  reports: Reports,
  settings: Settings
}

export default function App() {
  const [session, setSession] = useState(null)
  const [orgId, setOrgId] = useState(localStorage.getItem('active_org_id'))
  const [page, setPage] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [bootError, setBootError] = useState('')

  useEffect(() => {
    let mounted = true

    async function boot() {
      setLoading(true)
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(data.session)

      if (data.session?.user) {
        try {
          const nextOrg = await ensureProfileAndOrg(data.session.user)
          localStorage.setItem('active_org_id', nextOrg)
          setOrgId(nextOrg)
        } catch (error) {
          setBootError(error.message)
        }
      }
      setLoading(false)
    }

    boot()
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)
      if (nextSession?.user) {
        try {
          const nextOrg = await ensureProfileAndOrg(nextSession.user)
          localStorage.setItem('active_org_id', nextOrg)
          setOrgId(nextOrg)
        } catch (error) {
          setBootError(error.message)
        }
      } else {
        setOrgId(null)
      }
    })

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  const ActivePage = useMemo(() => pages[page] || Dashboard, [page])

  if (loading) {
    return <div className="boot-screen">Loading IndustryOps...</div>
  }

  if (!session) {
    return <AuthPage />
  }

  return (
    <Layout user={session.user} page={page} setPage={setPage}>
      {bootError ? <div className="alert danger">Setup error: {bootError}</div> : null}
      {!orgId ? <div className="alert">Preparing your company workspace...</div> : <ActivePage orgId={orgId} />}
    </Layout>
  )
}

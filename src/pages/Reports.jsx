import { useEffect, useState } from 'react'
import { getSession } from '../lib/authService'
import { getLocalDashboard } from '../lib/dataService'

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0))
}

export default function Reports({ orgId }) {
  const [summary, setSummary] = useState(null)
  const [apiSummary, setApiSummary] = useState(null)
  const [apiError, setApiError] = useState('')

  async function load() {
    const local = await getLocalDashboard(orgId)
    setSummary(local)
    try {
      const session = await getSession()
      const res = await fetch(`/api/org-summary?org_id=${orgId}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Backend report failed')
      setApiSummary(json)
      setApiError('')
    } catch (error) {
      setApiError(error.message)
    }
  }

  useEffect(() => { load() }, [orgId])

  if (!summary) return <div className="loading-line">Loading reports...</div>

  return (
    <div className="page-stack">
      <div className="section-heading"><div><p className="eyebrow">Backend + local analytics</p><h2>Reports</h2></div><button className="primary-button compact" onClick={load}>Refresh</button></div>
      {apiError ? <div className="alert">Backend API unavailable, showing local report: {apiError}</div> : <div className="alert success">Backend API connected. Server report loaded securely with your Supabase session.</div>}
      <div className="stats-grid compact-grid">
        <div className="stat-card"><p>Revenue</p><h3>{money(apiSummary?.revenue ?? summary.revenue)}</h3></div>
        <div className="stat-card"><p>Purchases</p><h3>{money(apiSummary?.purchase_cost ?? summary.purchaseCost)}</h3></div>
        <div className="stat-card"><p>Expenses</p><h3>{money(apiSummary?.expenses ?? summary.expenseTotal)}</h3></div>
        <div className="stat-card"><p>Estimated profit</p><h3>{money((apiSummary?.profit) ?? summary.profit)}</h3></div>
      </div>
      <div className="panel">
        <div className="panel-title">Operational counts</div>
        <table><thead><tr><th>Area</th><th>Count</th></tr></thead><tbody>
          <tr><td>Products</td><td>{apiSummary?.counts?.products ?? summary.products.length}</td></tr>
          <tr><td>Customers</td><td>{apiSummary?.counts?.customers ?? summary.customers.length}</td></tr>
          <tr><td>Suppliers</td><td>{apiSummary?.counts?.suppliers ?? summary.suppliers.length}</td></tr>
          <tr><td>Sales orders</td><td>{apiSummary?.counts?.sales ?? summary.sales.length}</td></tr>
          <tr><td>Purchase orders</td><td>{apiSummary?.counts?.purchases ?? summary.purchases.length}</td></tr>
        </tbody></table>
      </div>
    </div>
  )
}

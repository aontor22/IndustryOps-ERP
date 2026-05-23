import { useEffect, useState } from 'react'
import { AlertTriangle, Boxes, DollarSign, Receipt, ShoppingCart, TrendingUp, Users } from 'lucide-react'
import { getLocalDashboard, syncPending } from '../lib/dataService'
import StatusPill from '../components/StatusPill.jsx'

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0))
}

function Stat({ icon: Icon, label, value, hint }) {
  return (
    <div className="stat-card">
      <div className="stat-icon"><Icon size={20} /></div>
      <div>
        <p>{label}</p>
        <h3>{value}</h3>
        {hint ? <span>{hint}</span> : null}
      </div>
    </div>
  )
}

export default function Dashboard({ orgId }) {
  const [summary, setSummary] = useState(null)
  const [syncInfo, setSyncInfo] = useState('')

  async function load() {
    setSummary(await getLocalDashboard(orgId))
  }

  async function syncNow() {
    const result = await syncPending(orgId)
    setSyncInfo(`${result.message}. Synced: ${result.synced}, Failed: ${result.failed}`)
    await load()
  }

  useEffect(() => {
    load()
  }, [orgId])

  if (!summary) return <div className="loading-line">Loading dashboard...</div>

  return (
    <div className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Business overview</p>
          <h2>Command center</h2>
        </div>
        <button className="primary-button compact" onClick={syncNow}>Sync pending data</button>
      </div>
      {syncInfo ? <div className="alert success">{syncInfo}</div> : null}

      <div className="stats-grid">
        <Stat icon={DollarSign} label="Revenue" value={money(summary.revenue)} hint="Completed sales" />
        <Stat icon={Receipt} label="Expenses" value={money(summary.expenseTotal)} hint="Recorded costs" />
        <Stat icon={TrendingUp} label="Estimated profit" value={money(summary.profit)} hint="Revenue minus costs" />
        <Stat icon={Boxes} label="Inventory value" value={money(summary.inventoryValue)} hint="Cost based" />
        <Stat icon={Users} label="Customers" value={summary.counts.customers} hint="Saved profiles" />
        <Stat icon={ShoppingCart} label="Sales orders" value={summary.sales.length} hint="All time" />
      </div>

      <div className="two-column">
        <div className="panel">
          <div className="panel-title"><AlertTriangle size={18} /> Low stock alerts</div>
          {summary.lowStock.length === 0 ? <p className="muted">No low-stock items.</p> : (
            <table>
              <thead><tr><th>Product</th><th>Stock</th><th>Status</th></tr></thead>
              <tbody>
                {summary.lowStock.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.stock_qty} {item.unit}</td>
                    <td><StatusPill tone="warning">Reorder</StatusPill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="panel">
          <div className="panel-title"><ShoppingCart size={18} /> Recent sales</div>
          {summary.recentSales.length === 0 ? <p className="muted">No sales yet.</p> : (
            <table>
              <thead><tr><th>Date</th><th>Amount</th><th>Sync</th></tr></thead>
              <tbody>
                {summary.recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{new Date(sale.sold_at).toLocaleDateString()}</td>
                    <td>{money(sale.total_amount)}</td>
                    <td>{sale.pending_sync ? <StatusPill tone="warning">Pending</StatusPill> : <StatusPill tone="success">Synced</StatusPill>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { createRecord, deleteRecord, listRecords } from '../lib/dataService'
import StatusPill from '../components/StatusPill.jsx'
import EmptyState from '../components/EmptyState.jsx'

const blank = { title: '', category: 'General', amount: '', expense_date: new Date().toISOString().slice(0, 10), payment_method: 'Cash', note: '' }

export default function Expenses({ orgId }) {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(blank)
  async function load() { setRows(await listRecords('expenses', orgId)) }
  useEffect(() => { load() }, [orgId])

  async function submit(e) {
    e.preventDefault()
    await createRecord('expenses', { ...form, amount: Number(form.amount), expense_date: new Date(form.expense_date).toISOString() }, orgId)
    setForm(blank)
    await load()
  }

  return (
    <div className="page-stack">
      <div className="section-heading"><div><p className="eyebrow">Cost control</p><h2>Expenses</h2></div></div>
      <form className="grid-form" onSubmit={submit}>
        {Object.keys(blank).map((key) => <label key={key}>{key.replaceAll('_', ' ')}<input type={key === 'amount' ? 'number' : key === 'expense_date' ? 'date' : 'text'} min="0" step="0.01" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={['title','amount'].includes(key)} /></label>)}
        <button className="primary-button">Add expense</button>
      </form>
      {rows.length === 0 ? <EmptyState title="No expenses yet" text="Record rent, salary, delivery, utility, and operational costs." /> : (
        <table><thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Amount</th><th>Payment</th><th>Sync</th><th></th></tr></thead><tbody>
          {rows.map((row) => <tr key={row.id}><td>{new Date(row.expense_date).toLocaleDateString()}</td><td>{row.title}</td><td>{row.category}</td><td>${Number(row.amount || 0).toFixed(2)}</td><td>{row.payment_method}</td><td>{row.pending_sync ? <StatusPill tone="warning">Pending</StatusPill> : <StatusPill tone="success">Synced</StatusPill>}</td><td><button className="danger-button" onClick={() => deleteRecord('expenses', row.id).then(load)}>Delete</button></td></tr>)}
        </tbody></table>
      )}
    </div>
  )
}

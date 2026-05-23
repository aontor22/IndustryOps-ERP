import { useEffect, useState } from 'react'
import { createRecord, deleteRecord, listRecords } from '../lib/dataService'
import StatusPill from '../components/StatusPill.jsx'
import EmptyState from '../components/EmptyState.jsx'

const blank = { name: '', phone: '', email: '', address: '' }

export default function Suppliers({ orgId }) {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(blank)

  async function load() { setRows(await listRecords('suppliers', orgId)) }
  useEffect(() => { load() }, [orgId])

  async function submit(e) {
    e.preventDefault()
    await createRecord('suppliers', form, orgId)
    setForm(blank)
    await load()
  }

  return (
    <div className="page-stack">
      <div className="section-heading"><div><p className="eyebrow">Procurement</p><h2>Suppliers</h2></div></div>
      <form className="grid-form" onSubmit={submit}>
        {Object.keys(blank).map((key) => <label key={key}>{key}<input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={key === 'name'} /></label>)}
        <button className="primary-button">Add supplier</button>
      </form>
      {rows.length === 0 ? <EmptyState title="No suppliers yet" text="Add vendors, wholesalers, factories, or service providers." /> : (
        <table><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Address</th><th>Sync</th><th></th></tr></thead><tbody>
          {rows.map((row) => <tr key={row.id}><td>{row.name}</td><td>{row.phone || '-'}</td><td>{row.email || '-'}</td><td>{row.address || '-'}</td><td>{row.pending_sync ? <StatusPill tone="warning">Pending</StatusPill> : <StatusPill tone="success">Synced</StatusPill>}</td><td><button className="danger-button" onClick={() => deleteRecord('suppliers', row.id).then(load)}>Delete</button></td></tr>)}
        </tbody></table>
      )}
    </div>
  )
}

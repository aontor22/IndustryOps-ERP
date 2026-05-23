import { useEffect, useState } from 'react'
import { deleteRecord, listRecords, createRecord } from '../lib/dataService'
import StatusPill from '../components/StatusPill.jsx'
import EmptyState from '../components/EmptyState.jsx'

const blank = { sku: '', name: '', category: '', unit: 'pcs', cost_price: '', selling_price: '', stock_qty: '', low_stock_qty: '5' }

export default function Products({ orgId }) {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(blank)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setRows(await listRecords('products', orgId))
    setLoading(false)
  }

  useEffect(() => { load() }, [orgId])

  async function submit(event) {
    event.preventDefault()
    await createRecord('products', {
      ...form,
      cost_price: Number(form.cost_price || 0),
      selling_price: Number(form.selling_price || 0),
      stock_qty: Number(form.stock_qty || 0),
      low_stock_qty: Number(form.low_stock_qty || 0),
      is_active: true
    }, orgId)
    setForm(blank)
    await load()
  }

  return (
    <div className="page-stack">
      <div className="section-heading"><div><p className="eyebrow">Catalog</p><h2>Products & inventory</h2></div></div>
      <form className="grid-form" onSubmit={submit}>
        {['sku','name','category','unit','cost_price','selling_price','stock_qty','low_stock_qty'].map((key) => (
          <label key={key}>{key.replaceAll('_', ' ')}
            <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={key === 'name'} />
          </label>
        ))}
        <button className="primary-button">Add product</button>
      </form>

      {loading ? <div className="loading-line">Loading...</div> : rows.length === 0 ? <EmptyState title="No products yet" text="Add your first product to start stock tracking." /> : (
        <table>
          <thead><tr><th>SKU</th><th>Name</th><th>Category</th><th>Stock</th><th>Cost</th><th>Selling</th><th>Sync</th><th></th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.sku || '-'}</td>
                <td>{row.name}</td>
                <td>{row.category || '-'}</td>
                <td>{row.stock_qty} {row.unit}</td>
                <td>${Number(row.cost_price || 0).toFixed(2)}</td>
                <td>${Number(row.selling_price || 0).toFixed(2)}</td>
                <td>{row.pending_sync ? <StatusPill tone="warning">Pending</StatusPill> : <StatusPill tone="success">Synced</StatusPill>}</td>
                <td><button className="danger-button" onClick={() => deleteRecord('products', row.id).then(load)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

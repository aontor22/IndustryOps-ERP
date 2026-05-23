import { useEffect, useMemo, useState } from 'react'
import { createSale, listRecords } from '../lib/dataService'
import StatusPill from '../components/StatusPill.jsx'
import EmptyState from '../components/EmptyState.jsx'

export default function Sales({ orgId }) {
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState({ product_id: '', customer_id: '', quantity: 1, unit_price: '', sold_at: new Date().toISOString().slice(0, 10), note: '' })

  async function load() {
    const [s, p, c] = await Promise.all([
      listRecords('sales', orgId),
      listRecords('products', orgId),
      listRecords('customers', orgId)
    ])
    setSales(s); setProducts(p); setCustomers(c)
  }
  useEffect(() => { load() }, [orgId])

  const selectedProduct = useMemo(() => products.find((p) => p.id === form.product_id), [products, form.product_id])

  useEffect(() => {
    if (selectedProduct) setForm((current) => ({ ...current, unit_price: current.unit_price || selectedProduct.selling_price || '' }))
  }, [selectedProduct])

  async function submit(e) {
    e.preventDefault()
    await createSale({ ...form, quantity: Number(form.quantity), unit_price: Number(form.unit_price), sold_at: new Date(form.sold_at).toISOString() }, orgId)
    setForm({ product_id: '', customer_id: '', quantity: 1, unit_price: '', sold_at: new Date().toISOString().slice(0, 10), note: '' })
    await load()
  }

  return (
    <div className="page-stack">
      <div className="section-heading"><div><p className="eyebrow">Revenue</p><h2>Sales orders</h2></div></div>
      <form className="grid-form" onSubmit={submit}>
        <label>Product<select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value, unit_price: products.find((p) => p.id === e.target.value)?.selling_price || '' })} required><option value="">Select product</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name} | stock {p.stock_qty}</option>)}</select></label>
        <label>Customer<select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}><option value="">Walk-in customer</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Quantity<input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /></label>
        <label>Unit price<input type="number" min="0" step="0.01" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} required /></label>
        <label>Sold date<input type="date" value={form.sold_at} onChange={(e) => setForm({ ...form, sold_at: e.target.value })} required /></label>
        <label>Note<input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
        <button className="primary-button">Create sale</button>
      </form>
      {sales.length === 0 ? <EmptyState title="No sales yet" text="Create sales to reduce inventory and track revenue." /> : (
        <table><thead><tr><th>Date</th><th>Product</th><th>Qty</th><th>Amount</th><th>Status</th><th>Sync</th></tr></thead><tbody>
          {sales.map((row) => <tr key={row.id}><td>{new Date(row.sold_at).toLocaleDateString()}</td><td>{products.find((p) => p.id === row.product_id)?.name || 'Product'}</td><td>{row.quantity}</td><td>${Number(row.total_amount || 0).toFixed(2)}</td><td><StatusPill tone="success">{row.status}</StatusPill></td><td>{row.pending_sync ? <StatusPill tone="warning">Pending</StatusPill> : <StatusPill tone="success">Synced</StatusPill>}</td></tr>)}
        </tbody></table>
      )}
    </div>
  )
}

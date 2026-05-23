import { useEffect, useState } from 'react'
import { createPurchase, listRecords } from '../lib/dataService'
import StatusPill from '../components/StatusPill.jsx'
import EmptyState from '../components/EmptyState.jsx'

export default function Purchases({ orgId }) {
  const [purchases, setPurchases] = useState([])
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [form, setForm] = useState({ product_id: '', supplier_id: '', quantity: 1, unit_cost: '', purchased_at: new Date().toISOString().slice(0, 10), invoice_no: '' })

  async function load() {
    const [pur, pro, sup] = await Promise.all([
      listRecords('purchases', orgId),
      listRecords('products', orgId),
      listRecords('suppliers', orgId)
    ])
    setPurchases(pur); setProducts(pro); setSuppliers(sup)
  }
  useEffect(() => { load() }, [orgId])

  async function submit(e) {
    e.preventDefault()
    await createPurchase({ ...form, quantity: Number(form.quantity), unit_cost: Number(form.unit_cost), purchased_at: new Date(form.purchased_at).toISOString() }, orgId)
    setForm({ product_id: '', supplier_id: '', quantity: 1, unit_cost: '', purchased_at: new Date().toISOString().slice(0, 10), invoice_no: '' })
    await load()
  }

  return (
    <div className="page-stack">
      <div className="section-heading"><div><p className="eyebrow">Procurement</p><h2>Purchase orders</h2></div></div>
      <form className="grid-form" onSubmit={submit}>
        <label>Product<select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value, unit_cost: products.find((p) => p.id === e.target.value)?.cost_price || '' })} required><option value="">Select product</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label>Supplier<select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}><option value="">No supplier</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label>Quantity<input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /></label>
        <label>Unit cost<input type="number" min="0" step="0.01" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} required /></label>
        <label>Purchase date<input type="date" value={form.purchased_at} onChange={(e) => setForm({ ...form, purchased_at: e.target.value })} required /></label>
        <label>Invoice no<input value={form.invoice_no} onChange={(e) => setForm({ ...form, invoice_no: e.target.value })} /></label>
        <button className="primary-button">Receive purchase</button>
      </form>
      {purchases.length === 0 ? <EmptyState title="No purchases yet" text="Receive purchases to increase stock and track buying cost." /> : (
        <table><thead><tr><th>Date</th><th>Product</th><th>Qty</th><th>Amount</th><th>Status</th><th>Sync</th></tr></thead><tbody>
          {purchases.map((row) => <tr key={row.id}><td>{new Date(row.purchased_at).toLocaleDateString()}</td><td>{products.find((p) => p.id === row.product_id)?.name || 'Product'}</td><td>{row.quantity}</td><td>${Number(row.total_amount || 0).toFixed(2)}</td><td><StatusPill tone="success">{row.status}</StatusPill></td><td>{row.pending_sync ? <StatusPill tone="warning">Pending</StatusPill> : <StatusPill tone="success">Synced</StatusPill>}</td></tr>)}
        </tbody></table>
      )}
    </div>
  )
}

import { supabase } from './supabaseClient'
import { db, ENTITY_STORE } from './offlineDb'

export const TABLES = {
  products: 'products',
  customers: 'customers',
  suppliers: 'suppliers',
  sales: 'sales',
  purchases: 'purchases',
  expenses: 'expenses'
}

function now() {
  return new Date().toISOString()
}

function uuid() {
  return crypto.randomUUID()
}

function stripLocalMeta(record) {
  const clean = { ...record }
  delete clean.pending_sync
  delete clean.deleted
  delete clean.synced_at
  delete clean.error_message
  return clean
}

async function queue(entity, operation, recordId) {
  await db.syncQueue.add({ entity, operation, record_id: recordId, created_at: now() })
}

async function listLocal(entity, orgId) {
  return ENTITY_STORE[entity]
    .where('org_id')
    .equals(orgId)
    .filter((item) => !item.deleted)
    .toArray()
}

function sortRows(entity, rows) {
  const copy = [...rows]
  if (entity === 'products') return copy.sort((a, b) => a.name.localeCompare(b.name))
  if (entity === 'sales') return copy.sort((a, b) => new Date(b.sold_at || b.created_at) - new Date(a.sold_at || a.created_at))
  if (entity === 'purchases') return copy.sort((a, b) => new Date(b.purchased_at || b.created_at) - new Date(a.purchased_at || a.created_at))
  if (entity === 'expenses') return copy.sort((a, b) => new Date(b.expense_date || b.created_at) - new Date(a.expense_date || a.created_at))
  return copy.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
}

export async function listRecords(entity, orgId, { forceRemote = false } = {}) {
  const store = ENTITY_STORE[entity]
  if (!store) throw new Error(`Unknown entity: ${entity}`)

  const canUseRemote = navigator.onLine || forceRemote
  if (canUseRemote) {
    const { data, error } = await supabase
      .from(TABLES[entity])
      .select('*')
      .eq('org_id', orgId)
      .order('updated_at', { ascending: false })

    if (!error && data) {
      const withMeta = data.map((row) => ({ ...row, pending_sync: false, deleted: false, synced_at: now() }))
      await store.bulkPut(withMeta)
    }
  }

  return sortRows(entity, await listLocal(entity, orgId))
}

export async function createRecord(entity, payload, orgId) {
  const store = ENTITY_STORE[entity]
  const record = {
    id: payload.id || uuid(),
    ...payload,
    org_id: orgId,
    created_at: payload.created_at || now(),
    updated_at: now(),
    pending_sync: true,
    deleted: false
  }

  if (navigator.onLine) {
    const { data, error } = await supabase
      .from(TABLES[entity])
      .insert(stripLocalMeta(record))
      .select()
      .single()

    if (!error && data) {
      await store.put({ ...data, pending_sync: false, deleted: false, synced_at: now() })
      return data
    }
  }

  await store.put(record)
  await queue(entity, 'upsert', record.id)
  return record
}

export async function updateRecord(entity, id, patch) {
  const store = ENTITY_STORE[entity]
  const existing = await store.get(id)
  if (!existing) throw new Error('Record not found')

  const record = {
    ...existing,
    ...patch,
    updated_at: now(),
    pending_sync: true
  }

  if (navigator.onLine) {
    const { data, error } = await supabase
      .from(TABLES[entity])
      .update(stripLocalMeta(record))
      .eq('id', id)
      .select()
      .single()

    if (!error && data) {
      await store.put({ ...data, pending_sync: false, deleted: false, synced_at: now() })
      return data
    }
  }

  await store.put(record)
  await queue(entity, 'upsert', id)
  return record
}

export async function deleteRecord(entity, id) {
  const store = ENTITY_STORE[entity]
  const existing = await store.get(id)
  if (!existing) return

  if (navigator.onLine) {
    const { error } = await supabase.from(TABLES[entity]).delete().eq('id', id)
    if (!error) {
      await store.delete(id)
      return
    }
  }

  await store.put({ ...existing, deleted: true, pending_sync: true, updated_at: now() })
  await queue(entity, 'delete', id)
}

export async function createSale(payload, orgId) {
  const total = Number(payload.quantity) * Number(payload.unit_price)
  const sale = await createRecord('sales', { ...payload, total_amount: total, status: 'completed' }, orgId)
  const product = await db.products.get(payload.product_id)
  if (product) {
    const nextQty = Number(product.stock_qty || 0) - Number(payload.quantity || 0)
    await updateRecord('products', product.id, { stock_qty: nextQty })
  }
  return sale
}

export async function createPurchase(payload, orgId) {
  const total = Number(payload.quantity) * Number(payload.unit_cost)
  const purchase = await createRecord('purchases', { ...payload, total_amount: total, status: 'received' }, orgId)
  const product = await db.products.get(payload.product_id)
  if (product) {
    const nextQty = Number(product.stock_qty || 0) + Number(payload.quantity || 0)
    await updateRecord('products', product.id, { stock_qty: nextQty })
  }
  return purchase
}

export async function syncPending(orgId) {
  if (!navigator.onLine) return { synced: 0, failed: 0, message: 'Offline' }

  const items = await db.syncQueue.orderBy('created_at').toArray()
  let synced = 0
  let failed = 0

  for (const item of items) {
    try {
      const store = ENTITY_STORE[item.entity]
      const record = await store.get(item.record_id)

      if (item.operation === 'delete') {
        const { error } = await supabase.from(TABLES[item.entity]).delete().eq('id', item.record_id)
        if (error) throw error
        await store.delete(item.record_id)
      } else if (record && record.org_id === orgId && !record.deleted) {
        const { data, error } = await supabase
          .from(TABLES[item.entity])
          .upsert(stripLocalMeta(record))
          .select()
          .single()
        if (error) throw error
        await store.put({ ...data, pending_sync: false, deleted: false, synced_at: now() })
      }

      await db.syncQueue.delete(item.queue_id)
      synced += 1
    } catch (error) {
      console.error('Sync failed', error)
      failed += 1
    }
  }

  return { synced, failed, message: failed ? 'Some items failed to sync' : 'Sync completed' }
}

export async function getLocalDashboard(orgId) {
  const [products, customers, suppliers, sales, purchases, expenses] = await Promise.all([
    listRecords('products', orgId),
    listRecords('customers', orgId),
    listRecords('suppliers', orgId),
    listRecords('sales', orgId),
    listRecords('purchases', orgId),
    listRecords('expenses', orgId)
  ])

  const revenue = sales.reduce((sum, row) => sum + Number(row.total_amount || 0), 0)
  const purchaseCost = purchases.reduce((sum, row) => sum + Number(row.total_amount || 0), 0)
  const expenseTotal = expenses.reduce((sum, row) => sum + Number(row.amount || 0), 0)
  const inventoryValue = products.reduce((sum, row) => sum + Number(row.stock_qty || 0) * Number(row.cost_price || 0), 0)
  const lowStock = products.filter((p) => Number(p.stock_qty || 0) <= Number(p.low_stock_qty || 0))

  return {
    counts: { products: products.length, customers: customers.length, suppliers: suppliers.length },
    revenue,
    purchaseCost,
    expenseTotal,
    profit: revenue - purchaseCost - expenseTotal,
    inventoryValue,
    lowStock,
    recentSales: sales.slice(0, 5),
    products,
    customers,
    suppliers,
    sales,
    purchases,
    expenses
  }
}

import Dexie from 'dexie'

export const db = new Dexie('industryops_erp_lite')

db.version(1).stores({
  products: 'id, org_id, sku, name, category, updated_at, pending_sync, deleted',
  customers: 'id, org_id, name, phone, email, updated_at, pending_sync, deleted',
  suppliers: 'id, org_id, name, phone, email, updated_at, pending_sync, deleted',
  sales: 'id, org_id, product_id, customer_id, sold_at, updated_at, pending_sync, deleted',
  purchases: 'id, org_id, product_id, supplier_id, purchased_at, updated_at, pending_sync, deleted',
  expenses: 'id, org_id, expense_date, category, updated_at, pending_sync, deleted',
  settings: 'key',
  syncQueue: '++queue_id, entity, operation, record_id, created_at'
})

export const ENTITY_STORE = {
  products: db.products,
  customers: db.customers,
  suppliers: db.suppliers,
  sales: db.sales,
  purchases: db.purchases,
  expenses: db.expenses
}

export async function clearOrgCache(orgId) {
  await Promise.all(
    Object.values(ENTITY_STORE).map((store) => store.where('org_id').equals(orgId).delete())
  )
}

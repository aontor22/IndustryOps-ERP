import { createClient } from '@supabase/supabase-js'

function sum(rows, key) {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0)
}

export default async function handler(req, res) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '')
    const orgId = req.query.org_id

    if (!token) return res.status(401).json({ error: 'Missing Authorization bearer token' })
    if (!orgId) return res.status(400).json({ error: 'Missing org_id' })

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) return res.status(500).json({ error: 'Missing backend Supabase env variables' })

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const { data: userResult, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userResult?.user) return res.status(401).json({ error: 'Invalid user session' })

    const [products, customers, suppliers, sales, purchases, expenses] = await Promise.all([
      supabase.from('products').select('id,cost_price,stock_qty').eq('org_id', orgId),
      supabase.from('customers').select('id').eq('org_id', orgId),
      supabase.from('suppliers').select('id').eq('org_id', orgId),
      supabase.from('sales').select('id,total_amount').eq('org_id', orgId),
      supabase.from('purchases').select('id,total_amount').eq('org_id', orgId),
      supabase.from('expenses').select('id,amount').eq('org_id', orgId)
    ])

    const errors = [products, customers, suppliers, sales, purchases, expenses].filter((result) => result.error)
    if (errors.length) return res.status(500).json({ error: errors[0].error.message })

    const revenue = sum(sales.data, 'total_amount')
    const purchaseCost = sum(purchases.data, 'total_amount')
    const expenseTotal = sum(expenses.data, 'amount')
    const inventoryValue = products.data.reduce((total, row) => total + Number(row.cost_price || 0) * Number(row.stock_qty || 0), 0)

    return res.status(200).json({
      org_id: orgId,
      user_id: userResult.user.id,
      revenue,
      purchase_cost: purchaseCost,
      expenses: expenseTotal,
      profit: revenue - purchaseCost - expenseTotal,
      inventory_value: inventoryValue,
      counts: {
        products: products.data.length,
        customers: customers.data.length,
        suppliers: suppliers.data.length,
        sales: sales.data.length,
        purchases: purchases.data.length,
        expenses: expenses.data.length
      }
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

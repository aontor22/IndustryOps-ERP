import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { syncPending } from '../lib/dataService'
import { clearOrgCache, db } from '../lib/offlineDb'

export default function Settings({ orgId }) {
  const [org, setOrg] = useState(null)
  const [message, setMessage] = useState('')

  async function load() {
    const { data } = await supabase.from('organizations').select('*').eq('id', orgId).single()
    setOrg(data)
  }
  useEffect(() => { load() }, [orgId])

  async function updateOrg(e) {
    e.preventDefault()
    const { error } = await supabase.from('organizations').update({ name: org.name, updated_at: new Date().toISOString() }).eq('id', orgId)
    setMessage(error ? error.message : 'Company settings updated')
  }

  async function syncNow() {
    const result = await syncPending(orgId)
    setMessage(`${result.message}. Synced ${result.synced}, failed ${result.failed}.`)
  }

  async function clearCache() {
    await clearOrgCache(orgId)
    await db.syncQueue.clear()
    setMessage('Local offline cache cleared')
  }

  return (
    <div className="page-stack narrow">
      <div className="section-heading"><div><p className="eyebrow">Workspace</p><h2>Settings</h2></div></div>
      {message ? <div className="alert success">{message}</div> : null}
      <form className="panel form-panel" onSubmit={updateOrg}>
        <label>Company name<input value={org?.name || ''} onChange={(e) => setOrg({ ...org, name: e.target.value })} /></label>
        <button className="primary-button">Save company</button>
      </form>
      <div className="panel action-panel">
        <h3>Data tools</h3>
        <p className="muted">Use sync after working offline. Cache clearing only removes browser-local copies, not Supabase data.</p>
        <div className="button-row">
          <button className="primary-button compact" onClick={syncNow}>Sync now</button>
          <button className="ghost-button" onClick={clearCache}>Clear offline cache</button>
          <button className="danger-button" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>
    </div>
  )
}

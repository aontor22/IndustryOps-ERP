import { supabase } from './supabaseClient'

export function isEmail(value) {
  return /.+@.+\..+/.test(value)
}

export function normalizeLogin(value) {
  const trimmed = value.trim()
  if (isEmail(trimmed)) return trimmed.toLowerCase()
  return trimmed.replace(/\s+/g, '')
}

export async function sendOtp(login) {
  const destination = normalizeLogin(login)
  const payload = isEmail(destination)
    ? { email: destination, options: { shouldCreateUser: true } }
    : { phone: destination, options: { shouldCreateUser: true } }

  const { error } = await supabase.auth.signInWithOtp(payload)
  if (error) throw error
  return destination
}

export async function verifyOtp(login, token) {
  const destination = normalizeLogin(login)
  const payload = isEmail(destination)
    ? { email: destination, token, type: 'email' }
    : { phone: destination, token, type: 'sms' }

  const { data, error } = await supabase.auth.verifyOtp(payload)
  if (error) throw error
  return data
}

export async function ensureProfileAndOrg(user) {
  if (!user) throw new Error('No logged in user found')

  const fullName = user.user_metadata?.full_name || user.email || user.phone || 'Business User'

  await supabase.from('profiles').upsert({
    id: user.id,
    full_name: fullName,
    updated_at: new Date().toISOString()
  })

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, active_org_id')
    .eq('id', user.id)
    .single()

  if (profileError) throw profileError
  if (profile.active_org_id) return profile.active_org_id

  const fallbackName = fullName.includes('@') ? 'My Company' : `${fullName}'s Company`
  const { data: orgId, error: rpcError } = await supabase.rpc('create_default_organization', {
    org_name: fallbackName
  })

  if (rpcError) throw rpcError
  return orgId
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

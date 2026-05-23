import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '../lib/useOnlineStatus'

export default function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <div className="offline-banner">
      <WifiOff size={18} /> You are offline. New records will be saved locally and synced when internet returns.
    </div>
  )
}

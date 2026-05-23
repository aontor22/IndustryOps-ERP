import { BarChart3, Boxes, Building2, CreditCard, Home, LogOut, PackagePlus, Receipt, Settings, ShoppingCart, Truck, Users } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useOnlineStatus } from '../lib/useOnlineStatus'
import OfflineBanner from './OfflineBanner.jsx'

const nav = [
  { key: 'dashboard', label: 'Dashboard', icon: Home },
  { key: 'products', label: 'Products', icon: Boxes },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'suppliers', label: 'Suppliers', icon: Truck },
  { key: 'sales', label: 'Sales', icon: ShoppingCart },
  { key: 'purchases', label: 'Purchases', icon: PackagePlus },
  { key: 'expenses', label: 'Expenses', icon: CreditCard },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: Settings }
]

export default function Layout({ children, user, page, setPage }) {
  const online = useOnlineStatus()
  const identity = user?.email || user?.phone || 'Logged in user'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Building2 size={22} /></div>
          <div>
            <h1>IndustryOps</h1>
            <p>ERP Lite</p>
          </div>
        </div>

        <nav className="nav-list">
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                className={`nav-item ${page === item.key ? 'active' : ''}`}
                onClick={() => setPage(item.key)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <span className={`status-dot ${online ? 'online' : 'offline'}`}></span>
          <span>{online ? 'Online sync ready' : 'Offline mode'}</span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operations workspace</p>
            <h2>{nav.find((item) => item.key === page)?.label || 'Dashboard'}</h2>
          </div>
          <div className="topbar-actions">
            <span className="user-chip">{identity}</span>
            <button className="ghost-button" onClick={() => supabase.auth.signOut()}>
              <LogOut size={17} /> Sign out
            </button>
          </div>
        </header>
        <OfflineBanner />
        <section className="content-card">{children}</section>
      </main>
    </div>
  )
}

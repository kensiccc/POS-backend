export default function Header({ darkMode, onToggleDark, onOpenAdmin, onOpenDashboard, onLogout, currentUser }) {
  return (
    <header className="header">
      <div className="logo">
        <img src="/house-blend-logo.png" alt="House Blend" className="logo-img" />
        <div>
          <h1>☕ House Blend POS</h1>
          <p>Quality Coffee. Fresh Drinks. Your Choice.</p>
        </div>
      </div>
      <div className="header-right">
        <div className="user-info">
          <span>{currentUser?.name || 'Guest'}</span>
          <small>{currentUser?.role === 'admin' ? 'Manager' : 'Cashier'}</small>
        </div>
        <button className="admin-btn" onClick={onOpenDashboard} title="Sales Dashboard">📊 Dashboard</button>
        {currentUser?.role === 'admin' && (
          <button className="admin-btn" onClick={onOpenAdmin}>⚙️ Manage</button>
        )}
        <button className="admin-btn" onClick={onLogout}>🚪 Logout</button>
        <div className={`toggle ${darkMode ? 'on' : ''}`} onClick={onToggleDark}>
          <div className="toggle-knob"></div>
          <span className="toggle-icon">☀️</span>
        </div>
      </div>
    </header>
  )
}



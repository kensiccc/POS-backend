import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { PieChart, Pie, Legend } from 'recharts'
import { fetchAnalytics, fetchOrders } from '../services/api'

const RANGE_LABELS = {
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
  all: 'All Time',
}

function getRangeDates(range) {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  if (range === 'week') {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay() + 1)
    return { from: start.toISOString().slice(0, 10), to: today }
  }
  if (range === 'month') {
    return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, to: today }
  }
  if (range === 'year') {
    return { from: `${now.getFullYear()}-01-01`, to: today }
  }
  return { from: '2000-01-01', to: today }
}

export default function DashboardPage({ darkMode, onToggleDark, token, currentUser }) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('week')
  const [summary, setSummary] = useState({ totalRevenue: 0, totalOrders: 0, avgOrder: 0 })
  const [barData, setBarData] = useState([])
  const [pieData, setPieData] = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, token])

  async function loadAnalytics() {
    setLoading(true)
    setError(null)
    try {
      const summaryData = await fetchAnalytics(token, `summary?range=${filter}`)
      const trend = await fetchAnalytics(token, `revenue-trend?range=${filter}`)
      const category = await fetchAnalytics(token, `category-breakdown?range=${filter}`)
      const sellers = await fetchAnalytics(token, `bestsellers?range=${filter}`)
      const { from, to } = getRangeDates(filter)
      const ordersData = await fetchOrders(token, `?limit=8&from=${from}&to=${to}`)

      setSummary(summaryData)
      setBestSellers(sellers)
      setOrders(ordersData.orders || [])

      const dayMap = trend.reduce((acc, item) => {
        const date = new Date(item.day)
        const label = date.toLocaleDateString('en-PH', { weekday: 'short' })
        acc[label] = { day: label, revenue: item.revenue || 0 }
        return acc
      }, {})
      setBarData(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day) => dayMap[day] || { day, revenue: 0 }))
      setPieData(category.map((item) => ({ name: item.category || 'Other', value: item.revenue || 0 })))
    } catch (err) {
      console.error('Dashboard load error', err)
      // Fallback to localStorage
      try {
        const localHistory = JSON.parse(localStorage.getItem('hb_history') || '[]')
        const filtered = localHistory.filter(o => {
          const d = new Date(o.date)
          const now = new Date()
          if (filter === 'week') {
            const start = new Date(now)
            start.setDate(now.getDate() - now.getDay() + 1)
            start.setHours(0,0,0,0)
            return d >= start
          } else if (filter === 'month') {
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          } else if (filter === 'year') {
            return d.getFullYear() === now.getFullYear()
          }
          return true
        })

        const totalRevenue = filtered.reduce((s, o) => s + o.total, 0)
        const totalOrders = filtered.length
        const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0

        setSummary({ totalRevenue, totalOrders, avgOrder })

        // Bar chart
        const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
        const barData = days.map((day, i) => {
          const total = filtered
            .filter(o => new Date(o.date).getDay() === (i + 1) % 7)
            .reduce((s, o) => s + o.total, 0)
          return { day, revenue: total }
        })
        setBarData(barData)

        // Pie chart
        const catMap = {}
        filtered.forEach(o => o.items.forEach(item => {
          const cat = item.cat || 'other'
          catMap[cat] = (catMap[cat] || 0) + item.unitPrice * item.qty
        }))
        const pieData = Object.entries(catMap).map(([name, value]) => ({ name, value }))
        setPieData(pieData)

        // Best sellers
        const productMap = {}
        filtered.forEach(o => o.items.forEach(item => {
          if (!productMap[item.name]) productMap[item.name] = { qty: 0, revenue: 0 }
          productMap[item.name].qty += item.qty
          productMap[item.name].revenue += item.unitPrice * item.qty
        }))
        const bestSellers = Object.entries(productMap)
          .sort((a, b) => b[1].qty - a[1].qty)
          .slice(0, 6)
          .map(([name, data]) => ({ name, qty: data.qty, revenue: data.revenue }))
        setBestSellers(bestSellers)

        setOrders(filtered.slice(0, 8))
      } catch (localErr) {
        console.error('Local fallback error', localErr)
        setError('Unable to load analytics. Please refresh.')
      }
    } finally {
      setLoading(false)
    }
  }

  const totalRevenue = summary.totalRevenue || 0
  const totalOrders = summary.totalOrders || 0
  const avgOrder = summary.avgOrder || 0
  const drinksSold = orders.reduce((sum, o) => sum + (o.items?.reduce((a, item) => a + (item.qty || 0), 0) || 0), 0)

  const totalSoldSeries = barData

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Back to POS
          </button>
          <div>
            <h1>☕ Sales Dashboard</h1>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
              <p className="dashboard-subtitle">Updated {new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              <p className="dashboard-user">Logged in as {currentUser?.name || 'User'} ({currentUser?.role || 'cashier'})</p>
            </div>
          </div>
        </div>
        <div className="dashboard-actions">
          <button className="dark-toggle" onClick={onToggleDark}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button className="admin-btn" onClick={() => navigate('/')}>Go to POS</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="filter-tabs">
          {Object.entries(RANGE_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`filter-btn ${filter === value ? 'active' : ''}`}
            >{label}</button>
          ))}
        </div>

        {loading && <div className="page-banner">Loading analytics…</div>}
        {error && <div className="page-banner error">{error}</div>}

        <div className="kpi-grid">
          {[
            { label: 'TOTAL REVENUE', value: `₱${totalRevenue.toFixed(2)}`, color: '#2563eb', icon: '💰' },
            { label: 'TOTAL ORDERS', value: totalOrders, color: '#10b981', icon: '🧾' },
            { label: 'DRINKS SOLD', value: drinksSold, color: '#f59e0b', icon: '🧋' },
            { label: 'AVG. ORDER VALUE', value: `₱${avgOrder.toFixed(2)}`, color: '#8b5cf6', icon: '📈' },
          ].map((k, i) => (
            <div key={i} className="kpi-card">
              <div className="kpi-icon">{k.icon}</div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        <div className="charts-row">
          <div className="chart-box full-width">
            <h3>Revenue Trend</h3>
            <p>Sales by day for {RANGE_LABELS[filter].toLowerCase()}</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={totalSoldSeries}>
                <XAxis dataKey="day" stroke="var(--muted)" />
                <YAxis stroke="var(--muted)" />
                <Tooltip formatter={(v) => `₱${v.toFixed(2)}`} />
                <Bar dataKey="revenue" radius={[6,6,0,0]} fill="#2563eb">
                  {totalSoldSeries.map((_, i) => <Cell key={i} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-box full-width">
            <h3>Category Breakdown</h3>
            <p>Revenue by menu category</p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={90}>
                  {pieData.map((_, i) => <Cell key={i} fill={['#2563eb','#10b981','#f59e0b','#8b5cf6'][i % 4]} />)}
                </Pie>
                <Legend />
                <Tooltip formatter={(v) => `₱${v.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bottom-row">
          <div className="data-box">
            <h3>🏆 Best Selling Drinks</h3>
            <p>Top drinks for the selected period</p>
            {bestSellers.length === 0 ? (
              <div className="empty-state">No sales yet</div>
            ) : (
              bestSellers.map((item, index) => (
                <div key={item.name} className="seller-item">
                  <div className="seller-badge" style={{ background: index === 0 ? '#f59e0b' : 'var(--border)' }}>
                    {index + 1}
                  </div>
                  <div className="seller-info">
                    <div className="seller-name">{item.name}</div>
                    <div className="seller-cups">{item.qty} sold</div>
                  </div>
                  <div className="seller-revenue">₱{item.revenue.toFixed(2)}</div>
                </div>
              ))
            )}
          </div>

          <div className="data-box">
            <h3>🧾 Recent Orders</h3>
            <p>Latest confirmed transactions</p>
            {orders.length === 0 ? (
              <div className="empty-state">No orders yet</div>
            ) : (
              <div className="orders-table">
                <div className="table-header">
                  <div className="col-id">#</div>
                  <div className="col-customer">CUSTOMER</div>
                  <div className="col-items">ITEMS</div>
                  <div className="col-total">TOTAL</div>
                  <div className="col-date">DATE</div>
                </div>
                {orders.map((order, index) => (
                  <div key={order.order_number || index} className="table-row">
                    <div className="col-id">#{String(order.order_number || order.orderNum || '').padStart(3, '0')}</div>
                    <div className="col-customer">{order.customer_name || order.customer}</div>
                    <div className="col-items">{(order.items || []).map((item, idx) => `${item.name}${idx < order.items.length - 1 ? ', ' : ''}`).join('')}</div>
                    <div className="col-total">₱{parseFloat(order.total || 0).toFixed(2)}</div>
                    <div className="col-date">{new Date(order.order_date || order.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

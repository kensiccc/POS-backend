import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { PieChart, Pie, Legend } from 'recharts'

export default function Dashboard({ open, onClose, orderHistory, menu }) {
  const [filter, setFilter] = useState('week')

  const filtered = useMemo(() => {
    const now = new Date()
    return orderHistory.filter(o => {
      const d = new Date(o.date)
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
  }, [orderHistory, filter])

  const totalRevenue = filtered.reduce((s, o) => s + o.total, 0)
  const totalOrders = filtered.length
  const drinksSold = filtered.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0)
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Bar chart data
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const barData = days.map((day, i) => {
    const total = filtered
      .filter(o => new Date(o.date).getDay() === (i + 1) % 7)
      .reduce((s, o) => s + o.total, 0)
    return { day, total }
  })

  // Donut chart data
  const catMap = {}
  filtered.forEach(o => o.items.forEach(item => {
    const menuItem = menu.find(m => m.name === item.name)
    const cat = menuItem ? menuItem.cat : 'other'
    catMap[cat] = (catMap[cat] || 0) + item.unitPrice * item.qty
  }))
  const pieData = Object.entries(catMap).map(([name, value]) => ({ name, value }))
  const PIE_COLORS = ['#2563eb','#10b981','#f59e0b','#8b5cf6']

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

  if (!open) return null

  return (
    <div className="overlay open" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <h2>📊 Sales Dashboard</h2>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', margin: '16px 0' }}>
          {[['week','This Week'],['month','This Month'],['year','This Year'],['all','All Time']].map(([val, label]) => (
            <button key={val}
              onClick={() => setFilter(val)}
              style={{
                padding: '8px 16px', borderRadius: '8px', fontWeight: 700,
                background: filter === val ? '#2563eb' : 'var(--bg2)',
                color: filter === val ? '#fff' : 'var(--text)',
                border: 'none', cursor: 'pointer'
              }}
            >{label}</button>
          ))}
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'TOTAL REVENUE', value: `₱${totalRevenue.toFixed(2)}`, color: '#2563eb', icon: '💰' },
            { label: 'TOTAL ORDERS', value: totalOrders, color: '#10b981', icon: '🧾' },
            { label: 'DRINKS SOLD', value: drinksSold, color: '#f59e0b', icon: '🧋' },
            { label: 'AVG. ORDER VALUE', value: `₱${avgOrder.toFixed(2)}`, color: '#8b5cf6', icon: '📈' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'var(--bg2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '1.5rem' }}>{k.icon}</div>
              <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '8px', fontWeight: 700 }}>{k.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.6fr', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: 'var(--bg2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h4 style={{ marginBottom: '4px' }}>Sales This Week</h4>
            <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: '12px' }}>Revenue per day (Mon–Sun)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <XAxis dataKey="day" stroke="var(--muted)" />
                <YAxis stroke="var(--muted)" />
                <Tooltip formatter={(v) => `₱${v}`} />
                <Bar dataKey="total" radius={[6,6,0,0]}>
                  {barData.map((_, i) => <Cell key={i} fill="#2563eb" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: 'var(--bg2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h4 style={{ marginBottom: '4px' }}>Sales by Category</h4>
            <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: '12px' }}>Revenue breakdown</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={80}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip formatter={(v) => `₱${v.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best Sellers + Recent Orders */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div style={{ background: 'var(--bg2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h4>🏆 Best Selling Drinks</h4>
            <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: '12px' }}>Top drinks for selected period</p>
            {bestSellers.length === 0
              ? <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px' }}>No sales yet</div>
              : bestSellers.map(([name, data], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: i === 0 ? '#f59e0b' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '.85rem' }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{name}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{data.qty} cups sold</div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#2563eb' }}>₱{data.revenue.toFixed(2)}</div>
                </div>
              ))
            }
          </div>
          <div style={{ background: 'var(--bg2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h4>🧾 Recent Orders</h4>
            <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: '12px' }}>Latest confirmed transactions</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.8rem' }}>
                <thead>
                  <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '6px 4px' }}>#</th>
                    <th style={{ textAlign: 'left', padding: '6px 4px' }}>Customer</th>
                    <th style={{ textAlign: 'left', padding: '6px 4px' }}>Items</th>
                    <th style={{ textAlign: 'right', padding: '6px 4px' }}>Total</th>
                    <th style={{ textAlign: 'right', padding: '6px 4px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 8).map((o, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '6px 4px', color: '#2563eb', fontWeight: 700 }}>#{o.orderNum}</td>
                      <td style={{ padding: '6px 4px' }}>{o.customer}</td>
                      <td style={{ padding: '6px 4px', color: 'var(--muted)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.items.map(i => i.name).join(', ')}
                      </td>
                      <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 700 }}>₱{o.total.toFixed(2)}</td>
                      <td style={{ padding: '6px 4px', textAlign: 'right', color: 'var(--muted)' }}>{new Date(o.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="mbtn primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

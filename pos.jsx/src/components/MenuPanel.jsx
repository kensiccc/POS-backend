import { useState } from 'react'
import MenuCard from './MenuCard'

export default function MenuPanel({ menu, activeFilter, onSetFilter, cardQty, onChangeQty, onAddToOrder, customerName, onSetCustomerName }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredMenu = menu.filter(item => {
    const matchCat = activeFilter === 'all' || item.cat === activeFilter
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="menu-panel">
      <div className="menu-inner">
        <div className="customer-bar">
          <label>👤 Customer:</label>
          <input 
            type="text" 
            placeholder="Enter customer name"
            value={customerName}
            onChange={(e) => onSetCustomerName(e.target.value)}
          />
        </div>

        <div className="search-bar">
          <div className="search-wrap">
            <span className="search-icon">🔎</span>
            <input 
              type="text"
              placeholder="Search drinks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filters">
            <span 
              className={`ftag ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => onSetFilter('all')}
            >All</span>
            <span 
              className={`ftag ${activeFilter === 'coffee' ? 'active' : ''}`}
              onClick={() => onSetFilter('coffee')}
            >☕ Coffee</span>
            <span 
              className={`ftag ${activeFilter === 'tea' ? 'active' : ''}`}
              onClick={() => onSetFilter('tea')}
            >🍵 Tea</span>
            <span 
              className={`ftag ${activeFilter === 'snacks' ? 'active' : ''}`}
              onClick={() => onSetFilter('snacks')}
            >🍰 Snacks</span>
          </div>
        </div>

        <div className="menu-grid">
          {filteredMenu.map(item => (
            <MenuCard 
              key={item.id}
              item={item}
              qty={cardQty[item.id] || 1}
              onChangeQty={(delta) => onChangeQty(item.id, delta)}
              onAddToOrder={onAddToOrder}
            />
          ))}
        </div>
        {filteredMenu.length === 0 && <div className="no-results">No drinks found 😢</div>}
      </div>
    </div>
  )
}

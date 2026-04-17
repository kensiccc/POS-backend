import { useState } from 'react'

export default function MenuCard({ item, qty, onChangeQty, onAddToOrder }) {
  const [sugar, setSugar] = useState('100%')
  const [ice, setIce] = useState('Regular')
  const [size, setSize] = useState('0')

  const handleAddToOrder = () => {
    onAddToOrder(item.id, sugar, ice, size)
  }

  const stockBadge = item.stock <= 20 ? `⚠️ Low Stock: ${item.stock}` : `✓ ${item.stock} left`

  return (
    <div className="card">
      <div className="card-img">
        <img src={item.img} alt={item.name} loading="lazy" />
        {item.badge && <span className={`badge ${item.badgeCls}`}>{item.badge}</span>}
        <span className={`badge ${item.stock <= 20 ? 'stock-warning' : 'stock-ok'}`}>
          {stockBadge}
        </span>
      </div>
      <div className="card-body">
        <div className="card-name">{item.name}</div>
        <div className="card-price">₱{item.price}</div>
        <div className="customs">
          <div className="cust-row">
            <label>Sugar</label>
            <select value={sugar} onChange={(e) => setSugar(e.target.value)}>
              <option>100%</option>
              <option>75%</option>
              <option>50%</option>
              <option>25%</option>
              <option>0%</option>
            </select>
          </div>
          <div className="cust-row">
            <label>Ice</label>
            <select value={ice} onChange={(e) => setIce(e.target.value)}>
              <option>Regular</option>
              <option>Less Ice</option>
              <option>No Ice</option>
              <option>Extra Ice</option>
            </select>
          </div>
          <div className="cust-row">
            <label>Size</label>
            <select value={size} onChange={(e) => setSize(e.target.value)}>
              <option value="0">Medium</option>
              <option value="15">Large (+₱15)</option>
              <option value="-10">Small (-₱10)</option>
            </select>
          </div>
        </div>
        <div className="qty-row">
          <button className="qty-btn" onClick={() => onChangeQty(-1)}>−</button>
          <span className="qty-num">{qty}</span>
          <button className="qty-btn" onClick={() => onChangeQty(1)}>+</button>
        </div>
        <button className="add-btn" onClick={handleAddToOrder}>Add to Order</button>
      </div>
    </div>
  )
}

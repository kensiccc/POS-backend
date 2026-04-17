export default function Sidebar({
  order, subtotal, discount, discAmt, total, cashInput, onSetCash, change,
  onClearOrder, onRemoveItem, onChangeItemQty, onCheckout, onOpenHistory, onOpenDashboard
}) {

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">🛒 Your Order</div>
        <button className="clear-btn" onClick={onClearOrder}>Clear All</button>
      </div>
      <div className="order-list">
        {order.length === 0 ? (
          <div className="order-empty">🧋<br/>Add some items to start!</div>
        ) : (
          order.map(o => (
            <div key={o.key} className="oi">
              <div className="oi-info">
                <div className="oi-name">{o.name}</div>
                <div className="oi-meta">{o.size} · {o.sugar} sugar · {o.ice}</div>
              </div>
              <div className="oi-right">
                <div className="oi-price">₱{(o.unitPrice * o.qty).toFixed(2)}</div>
                <div className="oi-actions">
                  <button className="oi-qbtn del" onClick={() => onRemoveItem(o.key)}>🗑</button>
                  <button className="oi-qbtn" onClick={() => onChangeItemQty(o.key, -1)}>−</button>
                  <span className="oi-qnum">{o.qty}</span>
                  <button className="oi-qbtn" onClick={() => onChangeItemQty(o.key, 1)}>+</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {order.length > 0 && (
        <div className="sidebar-footer">
          <div className="totals">
            <div className="totals-row"><span>Subtotal</span><span>₱{subtotal.toFixed(2)}</span></div>
            {discAmt > 0 && (
              <div className="totals-row discount"><span>Discount ({discount}%)</span><span>−₱{discAmt.toFixed(2)}</span></div>
            )}
            <div className="totals-row grand"><span>TOTAL</span><span>₱{total.toFixed(2)}</span></div>
          </div>
          <div className="cash-block">
            <label>💵 Cash Tendered (₱)</label>
            <input 
              type="number" 
              placeholder="0.00"
              value={cashInput}
              onChange={(e) => onSetCash(e.target.value)}
              min="0"
            />
            {cashInput && (
              <div className={`change-box ${change < 0 ? 'neg' : ''}`}>
                <span>Change</span>
                <span>₱{change.toFixed(2)}</span>
              </div>
            )}
          </div>
          <button 
            className="checkout-btn"
            onClick={onCheckout}
            disabled={!cashInput || parseFloat(cashInput) < total}
          >Checkout →</button>
        </div>
      )}

      <div className="sidebar-always">
        <button className="history-btn" onClick={onOpenHistory}>🧾 Order History</button>
        <button className="history-btn dashboard-btn" onClick={onOpenDashboard}>📊 Sales Dashboard</button>
      </div>
    </div>
  )
}

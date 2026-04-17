export default function HistoryModal({ open, onClose, history }) {
  if (!open) return null

  return (
    <div className="overlay open" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>📋 Order History</h2>
        <p>Your past transactions (saved locally)</p>
        <div id="historyList" style={{maxHeight: '400px', overflowY: 'auto', marginBottom: '20px'}}>
          {history.length === 0 ? (
            <div className="h-empty">No orders yet.</div>
          ) : (
            history.map((h, idx) => (
              <div key={idx} className="h-entry">
                <div className="h-top">
                  <span>#{h.orderNum} — {h.customer}</span>
                  <span style={{color: 'var(--accent)'}}>₱{h.total.toFixed(2)}</span>
                </div>
                <div className="h-date">{h.date} {h.promo ? `· Promo: ${h.promo}` : ''}</div>
                <div className="h-items">{h.items.map(o => `${o.name} x${o.qty}`).join(', ')}</div>
              </div>
            ))
          )}
        </div>
        <div className="modal-actions">
          <button className="mbtn secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

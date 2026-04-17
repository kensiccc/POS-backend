export default function ReceiptModal({ open, onClose, order, subtotal, discount, discAmt, total, cash, customerName, orderNum, onConfirm, onSilentPrint }) {

  if (!open) return null

  return (
    <>
      <style>{`
        @media print {
          @page {
            margin: 0;
            size: 80mm auto;
          }
          body, html {
            background: white;
            margin: 0;
            padding: 0;
            color: black;
          }
          /* Hide main app panels so ONLY the modal prints */
          .header, .layout, .drawer, .drawer-overlay, .toast, .history-btn, .dashboard-btn {
            display: none !important;
          }
          /* Reset the modal overlay so it acts like a normal page */
          .overlay {
            position: relative;
            background: white !important;
            padding: 0;
            display: block;
            min-height: 100vh;
            overflow: visible;
          }
          .modal {
            max-width: 100%;
            margin: 0;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
            transform: none;
            overflow: visible;
          }
          .receipt-paper {
            position: relative;
            width: 80mm;
            margin: 0;
            padding: 5mm;
            box-shadow: none;
            background: white;
            color: black;
          }
          /* Hide non-receipt portions of the modal */
          .modal-header-preview, .modal-actions {
            display: none !important;
          }
          /* Ensure text is black for thermal printing */
          .receipt-paper * {
            color: black !important;
          }
        }
        .preview-modal {
          max-width: 400px;
          padding: 24px;
        }
        .modal-header-preview {
          text-align: center;
          margin-bottom: 16px;
        }
        .modal-title-pv {
          font-size: 20px;
          font-weight: 700;
          color: white;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .modal-sub-pv {
          font-size: 13px;
          color: #94a3b8;
        }
        .receipt-paper {
          background: #fff;
          color: #1e293b;
          font-family: 'Courier New', Courier, monospace;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          font-size: 12px;
          line-height: 1.5;
          margin-bottom: 20px;
        }
        .receipt-brand {
          text-align: center;
          margin-bottom: 16px;
        }
        .brand-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 4px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
        }
        .brand-tag {
          font-size: 11px;
          color: #64748b;
          margin-bottom: 4px;
        }
        .date-time {
          font-size: 11px;
          color: #94a3b8;
        }
        .r-divider {
          border-top: 1px dashed #cbd5e1;
          margin: 12px 0;
        }
        .r-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .r-col-left { text-align: left; }
        .r-col-right { text-align: right; }
        .r-item {
          margin-bottom: 8px;
        }
        .r-item-main {
          display: flex;
          justify-content: space-between;
          font-weight: 600;
        }
        .r-item-sub {
          font-size: 11px;
          color: #64748b;
          padding-right: 40px;
        }
        .r-total-row {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          margin-bottom: 4px;
        }
        .r-change {
          color: #2563eb;
        }
      `}</style>
      <div className="overlay open" onClick={onClose}>
        <div className="modal preview-modal" onClick={(e) => e.stopPropagation()}>

          <div className="modal-header-preview">
            <div className="modal-title-pv">🧾 Receipt Preview</div>
            <div className="modal-sub-pv">{customerName || 'Guest'} · {orderNum}</div>
          </div>

          <div className="receipt-paper">
            <div className="receipt-brand">
              <img src="/house-blend-logo.png" alt="Logo" style={{ width: '64px', height: '64px', marginBottom: '8px' }} />
              <div className="brand-name">House Blend</div>
              <div className="brand-tag">Quality Coffee. Fresh Drinks.</div>
              <div className="date-time">{new Date().toLocaleString('en-US')}</div>
            </div>

            <div className="r-divider"></div>

            <div className="r-row">
              <span>Customer</span>
              <span>{customerName || 'Guest'}</span>
            </div>
            <div className="r-row">
              <span>Order</span>
              <span style={{ background: '#2563eb', color: '#fff', padding: '0 4px', borderRadius: '2px' }}>{orderNum}</span>
            </div>

            <div className="r-divider"></div>

            <div className="r-items">
              {order.map((o, i) => (
                <div key={i} className="r-item">
                  <div className="r-item-main">
                    <span>{o.name} x{o.qty} ({o.size})</span>
                    <span>₱{(o.unitPrice * o.qty).toFixed(2)}</span>
                  </div>
                  <div className="r-item-sub">
                    {o.sugar} sugar · {o.ice}
                  </div>
                </div>
              ))}
            </div>

            <div className="r-divider"></div>

            <div className="r-row">
              <span>Subtotal</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>
            {discAmt > 0 && (
              <div className="r-row">
                <span>Discount ({discount}%)</span>
                <span>-₱{discAmt.toFixed(2)}</span>
              </div>
            )}
            <div className="r-total-row">
              <span>TOTAL</span>
              <span>₱{total.toFixed(2)}</span>
            </div>

            <div className="r-divider"></div>

            <div className="r-row">
              <span>Cash</span>
              <span>₱{cash.toFixed(2)}</span>
            </div>
            <div className="r-total-row r-change">
              <span>Change</span>
              <span>₱{(cash - total).toFixed(2)}</span>
            </div>

            <div className="r-divider"></div>
            <div style={{ textAlign: 'center', marginTop: '16px', fontWeight: 'bold' }}>
              Thank you! Please come again.
            </div>
          </div>

          <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
            <button className="mbtn danger" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button className="mbtn secondary" onClick={() => { onSilentPrint(cash); onClose(); }} style={{ flex: 1 }}>🖨️ Instant Print</button>
            <button className="mbtn primary" onClick={() => { onConfirm(cash); onClose() }} style={{ flex: 1 }}>Confirm</button>
          </div>

        </div>
      </div>
    </>
  )
}

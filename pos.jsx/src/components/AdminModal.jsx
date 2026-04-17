import { useState } from 'react'

export default function AdminModal({ open, onClose, menu, tab, onSetTab, onAddProduct, onEditProduct, onDeleteProduct, onUpdateStock, onResetMenu }) {
  const [newProdName, setNewProdName] = useState('')
  const [newProdCat, setNewProdCat] = useState('coffee')
  const [newProdPrice, setNewProdPrice] = useState('')
  const [newProdStock, setNewProdStock] = useState('')
  const [newProdImg, setNewProdImg] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const handleAddProduct = () => {
    if (!newProdName || !newProdPrice || newProdStock === '') {
      alert('Please fill all fields')
      return
    }
    onAddProduct(newProdName, newProdCat, newProdPrice, newProdStock, newProdImg)
    setNewProdName('')
    setNewProdPrice('')
    setNewProdStock('')
    setNewProdImg('')
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        setNewProdImg(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileInput = (e) => {
    const files = e.target.files
    if (files && files[0]) {
      const file = files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        setNewProdImg(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const sortedByStock = menu.slice().sort((a, b) => a.stock - b.stock)

  if (!open) return null

  return (
    <div className="overlay open" onClick={onClose}>
      <div className="modal admin-modal" onClick={(e) => e.stopPropagation()}>
        <h2>⚙️ Product Management</h2>
        <p>Add, edit, or manage your products and stock</p>

        <div className="admin-tabs">
          <button 
            className={`atab ${tab === 'products' ? 'active' : ''}`}
            onClick={() => onSetTab('products')}
          >📦 Products</button>
          <button 
            className={`atab ${tab === 'addnew' ? 'active' : ''}`}
            onClick={() => onSetTab('addnew')}
          >➕ Add Product</button>
          <button 
            className={`atab ${tab === 'stock' ? 'active' : ''}`}
            onClick={() => onSetTab('stock')}
          >📊 Stock Status</button>
        </div>

        {/* Products Tab */}
        {tab === 'products' && (
          <div className="admin-tab-content active">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
              <h3>Existing Products</h3>
              <button className="mbtn secondary" onClick={() => {
                if (confirm('Reset menu to defaults? This will remove all custom products.')) onResetMenu()
              }}>Reset Menu</button>
            </div>
            {menu.map(item => (
              <div key={item.id} className="product-item">
                <div>
                  <div style={{fontWeight: 700}}>{item.name}</div>
                  <div style={{fontSize: '.85rem', color: 'var(--muted)'}}>₱{item.price} | {item.cat}</div>
                  <div style={{fontSize: '.85rem', marginTop: '4px', color: item.stock <= 20 ? '#ff6b6b' : '#10b981', fontWeight: 700}}>
                    Stock: {item.stock}
                  </div>
                </div>
                <div style={{display: 'flex', gap: '8px'}}>
                  <button className="mbtn secondary" onClick={() => {
                    const name = prompt('Product name:', item.name)
                    if (name) onEditProduct(item.id, name)
                  }}>Edit</button>
                  <button className="mbtn danger" onClick={() => {
                    if (confirm('Delete this product?')) onDeleteProduct(item.id)
                  }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Product Tab */}
        {tab === 'addnew' && (
          <div className="admin-tab-content active">
            <h3>Add New Product</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <div>
                <label>Product Name</label>
                <input 
                  type="text"
                  placeholder="e.g., Espresso Shot"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label>Category</label>
                <select 
                  value={newProdCat}
                  onChange={(e) => setNewProdCat(e.target.value)}
                  className="form-input"
                >
                  <option value="coffee">☕ Coffee</option>
                  <option value="tea">🍵 Tea</option>
                  <option value="snacks">🍰 Snacks</option>
                </select>
              </div>
              <div>
                <label>Price (₱)</label>
                <input 
                  type="number"
                  placeholder="0.00"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label>Initial Stock</label>
                <input 
                  type="number"
                  placeholder="0"
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label>Product Image</label>
                <div 
                  className={`drop-zone ${dragActive ? 'active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    style={{display: 'none'}}
                    id="file-input"
                  />
                  {newProdImg ? (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center'}}>
                      <img src={newProdImg} alt="preview" style={{maxWidth: '100px', maxHeight: '100px', borderRadius: '4px'}} />
                      <small style={{color: 'var(--muted)'}}>Image selected ✓</small>
                    </div>
                  ) : (
                    <label htmlFor="file-input" style={{cursor: 'pointer', textAlign: 'center'}}>
                      <div style={{fontSize: '2rem', marginBottom: '8px'}}>📸</div>
                      <div>Drag & drop image here</div>
                      <div style={{fontSize: '.85rem', color: 'var(--muted)'}}>or click to select</div>
                    </label>
                  )}
                </div>
              </div>
              <button className="mbtn primary" onClick={handleAddProduct}>➕ Add Product</button>
            </div>
          </div>
        )}

        {/* Stock Status Tab */}
        {tab === 'stock' && (
          <div className="admin-tab-content active">
            <h3>Stock Status</h3>
            {sortedByStock.map(item => {
              const status = item.stock === 0 ? '🔴 OUT' : (item.stock <= 20 ? '🟡 LOW' : '🟢 OK')
              const statusColor = item.stock === 0 ? '#ef4444' : (item.stock <= 20 ? '#f59e0b' : '#10b981')
              return (
                <div key={item.id} className="stock-item">
                  <div>
                    <div style={{fontWeight: 700}}>{item.name}</div>
                    <div style={{fontSize: '.85rem', color: 'var(--muted)'}}>Category: {item.cat}</div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div style={{fontSize: '2rem', fontWeight: 700, color: statusColor}}>{item.stock}</div>
                    <div style={{fontSize: '.85rem', fontWeight: 700, color: statusColor}}>{status}</div>
                    <input 
                      type="number"
                      value={item.stock}
                      onChange={(e) => onUpdateStock(item.id, e.target.value)}
                      style={{width: '70px', padding: '4px', marginTop: '4px', border: '1px solid var(--border)', borderRadius: '4px'}}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="modal-actions" style={{marginTop: '20px'}}>
          <button className="mbtn secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

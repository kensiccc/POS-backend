import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import MenuPanel from '../components/MenuPanel'
import Sidebar from '../components/Sidebar'
import Drawer from '../components/Drawer'
import ReceiptModal from '../components/ReceiptModal'
import AdminModal from '../components/AdminModal'
import HistoryModal from '../components/HistoryModal'
import Toast from '../components/Toast'
import {
  fetchProducts,
  fetchOrders,
  createOrder,
  createProduct,
  updateProduct,
  deleteProduct as deleteProductApi,
  updateStock as patchStock,
} from '../services/api'

export default function POSPage({ darkMode, onToggleDark, token, currentUser, onLogout }) {
  const navigate = useNavigate()

  const [menu, setMenu] = useState([])
  const [order, setOrder] = useState([])
  const [cardQty, setCardQty] = useState({})
  const [customerName, setCustomerName] = useState('')
  const [orderHistory, setOrderHistory] = useState([])
  const [orderNum, setOrderNum] = useState(() => {
    const saved = localStorage.getItem('hb_orderNum')
    return saved ? parseInt(saved, 10) : 1
  })
  const [discount, setDiscount] = useState(0)
  const [cashInput, setCashInput] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [adminTab, setAdminTab] = useState('products')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const subtotal = order.reduce((sum, item) => sum + item.unitPrice * item.qty, 0)
  const discAmt = subtotal * (discount / 100)
  const total = subtotal - discAmt
  const change = parseFloat(cashInput || 0) - total

  useEffect(() => {
    loadProducts()
    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    localStorage.setItem('hb_orderNum', orderNum)
  }, [orderNum])

  const syncOrderNumber = (orders) => {
    const maxNumber = orders.reduce((max, order) => {
      const raw = order.order_number || order.orderNum || order.orderNum
      const parsed = parseInt(String(raw).replace(/^0+/, ''), 10)
      return Number.isNaN(parsed) ? max : Math.max(max, parsed)
    }, 0)
    const next = Math.max(orderNum, maxNumber + 1)
    setOrderNum(next)
  }

  async function loadProducts() {
    setLoading(true)
    try {
      const products = await fetchProducts(token)
      setMenu(products.map((product) => ({
        id: product.id,
        name: product.name,
        cat: product.category || 'all',
        price: parseFloat(product.price),
        stock: product.stock,
        threshold: product.threshold,
        img: product.img || product.image_url || '/images/matcha-dream.jpg',
      })))
      setError(null)
    } catch (err) {
      console.error('Load products failed', err)
      setError('Unable to load products from backend. Showing local demo menu.')
      setMenu(DEFAULT_MENU)
    } finally {
      setLoading(false)
    }
  }

  async function loadOrders() {
    try {
      const data = await fetchOrders(token, '?limit=100')
      const orders = data.orders || []
      const mapped = orders.map((orderItem) => ({
        orderNum: orderItem.order_number || orderItem.orderNum || '',
        customer: orderItem.customer_name || orderItem.customer || 'Guest',
        total: parseFloat(orderItem.total || 0),
        items: orderItem.items || [],
        promo: orderItem.promo_code || orderItem.promo || '',
        date: orderItem.order_date || orderItem.date || '',
      }))
      setOrderHistory(mapped)
      syncOrderNumber(orders)
    } catch (err) {
      console.error('Load orders failed', err)
      setError('Unable to load order history from backend.')
    }
  }

  const changeCardQty = (itemId, delta) => {
    setCardQty((prev) => ({
      ...prev,
      [itemId]: Math.max(1, (prev[itemId] || 1) + delta),
    }))
  }

  const addToOrder = (itemId, sugar, ice, sizeExtra) => {
    const item = menu.find((m) => m.id === itemId)
    if (!item) return

    const qty = cardQty[itemId] || 1
    if (item.stock < qty) {
      showToast('Not enough stock for this item', true)
      return
    }

    const extra = parseInt(sizeExtra, 10) || 0
    const sizeLabel = extra === 0 ? 'Medium' : extra > 0 ? 'Large' : 'Small'
    const unitPrice = item.price + extra
    const key = `${itemId}-${sugar}-${ice}-${sizeLabel}`

    setOrder((prev) => {
      const existing = prev.find((o) => o.key === key)
      if (existing) {
        return prev.map((o) => (o.key === key ? { ...o, qty: o.qty + qty } : o))
      }
      return [
        ...prev,
        {
          key,
          id: item.id,
          name: item.name,
          cat: item.cat,
          sugar,
          ice,
          size: sizeLabel,
          unitPrice,
          qty,
        },
      ]
    })

    setMenu((prev) => prev.map((m) =>
      m.id === itemId ? { ...m, stock: Math.max(0, m.stock - qty) } : m
    ))

    setCardQty((prev) => ({ ...prev, [itemId]: 1 }))
    showToast(`${item.name} added to order!`)
  }

  const removeItem = (key) => setOrder((prev) => prev.filter((o) => o.key !== key))

  const changeItemQty = (key, delta) => {
    setOrder((prev) => prev.map((o) => (o.key === key ? { ...o, qty: Math.max(1, o.qty + delta) } : o)))
  }

  const clearOrder = () => {
    setOrder([])
    setDiscount(0)
    setCashInput('')
  }

  const applyPromo = (code) => {
    const promos = { HBPAY10: 10, HBPAY20: 20 }
    if (promos[code]) {
      setDiscount(promos[code])
      showToast(`${code} applied! ${promos[code]}% off`)
    } else {
      showToast('Invalid promo code', true)
    }
  }

  const handleCheckout = () => {
    if (order.length === 0 || !cashInput || parseFloat(cashInput) < total) {
      showToast('Invalid order or payment', true)
      return
    }
    setReceiptOpen(true)
  }

  const confirmOrder = async (cash) => {
    const orderPayload = {
      orderNumber: String(orderNum).padStart(3, '0'),
      customerName: customerName || 'Guest',
      items: order,
      subtotal,
      discountPct: discount,
      discountAmount: discAmt,
      total,
      cash: parseFloat(cash || 0),
      changeAmount: change,
      promoCode: discount > 0 ? `${discount}% off` : '',
    }

    try {
      await createOrder(token, orderPayload)
      const confirmedOrder = {
        orderNum: String(orderNum).padStart(3, '0'),
        customer: customerName || 'Guest',
        items: order.map(o => ({ ...o, cat: o.cat || 'other' })),
        subtotal,
        discount,
        discAmt,
        total,
        date: new Date().toISOString(),
        promo: discount > 0 ? `${discount}% off` : '',
      }
      setOrderHistory((prev) => [confirmedOrder, ...prev])
      // Save to localStorage for dashboard fallback
      const existing = JSON.parse(localStorage.getItem('hb_history') || '[]')
      localStorage.setItem('hb_history', JSON.stringify([confirmedOrder, ...existing]))
      
      setOrderNum((n) => n + 1)
      clearOrder()
      setCustomerName('')
      loadProducts()
      loadOrders()
      showToast('✓ Order confirmed!')
    } catch (err) {
      showToast(err.message || 'Unable to confirm order', true)
    }
  }

  const silentPrintAndConfirm = async (cash) => {
    showToast('🔓 Drawer Unlocked & Printing!', false)

    const payload = {
      orderNum: String(orderNum).padStart(3, '0'),
      customerName: customerName || 'Guest',
      order,
      subtotal,
      discount,
      discAmt,
      total,
      cash: parseFloat(cash || 0),
    }

    try {
      await fetch('http://localhost:3001/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch (err) {
      console.log('Print error:', err)
    }

    await confirmOrder(cash)
  }

  const addProduct = async (name, category, price, stock, imageUrl) => {
    try {
      if (!name || !price || !stock) {
        return showToast('Please complete all product fields.', true)
      }
      const newProduct = await createProduct(token, {
        name,
        description: '',
        category,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        threshold: 10,
        imageUrl: imageUrl || '/images/matcha-dream.jpg',
      })
      setMenu((prev) => [...prev, {
        id: newProduct.id,
        name: newProduct.name,
        cat: category,
        price: parseFloat(newProduct.price),
        stock: newProduct.stock,
        threshold: newProduct.threshold,
        img: newProduct.image_url || newProduct.img,
      }])
      showToast(`${newProduct.name} created!`)
    } catch (err) {
      showToast(err.message || 'Unable to create product', true)
    }
  }

  const editProduct = async (id, name) => {
    try {
      if (!name) return showToast('Product name is required', true)
      const existing = menu.find((m) => m.id === id)
      if (!existing) return
      const updated = await updateProduct(token, id, {
        ...existing,
        name,
        category: existing.cat,
        imageUrl: existing.img,
      })
      setMenu((prev) => prev.map((m) => (m.id === id ? {
        ...m,
        name: updated.name,
        price: parseFloat(updated.price),
        stock: updated.stock,
      } : m)))
      showToast('Product updated!')
    } catch (err) {
      showToast(err.message || 'Unable to update product', true)
    }
  }

  const deleteProduct = async (id) => {
    try {
      await deleteProductApi(token, id)
      setMenu((prev) => prev.filter((m) => m.id !== id))
      showToast('Product deleted.')
    } catch (err) {
      showToast(err.message || 'Unable to delete product', true)
    }
  }

  const updateStock = async (id, value) => {
    try {
      const updated = await patchStock(token, id, {
        stock: parseInt(value, 10) || 0,
      })
      setMenu((prev) => prev.map((m) => (m.id === id ? {
        ...m,
        stock: updated.stock,
        threshold: updated.threshold,
      } : m)))
    } catch (err) {
      showToast(err.message || 'Unable to update stock', true)
    }
  }

  const resetMenu = async () => {
    try {
      await loadProducts()
      showToast('Product catalog refreshed from backend.')
    } catch (err) {
      showToast(err.message || 'Unable to reset menu from server', true)
    }
  }

  const showToast = (msg, isErr = false) => {
    setToast({ msg, isErr })
    setTimeout(() => setToast(null), 3000)
  }

  const orderLabel = `Order #${String(orderNum).padStart(3, '0')}`

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`} data-theme={darkMode ? 'dark' : undefined}>
      <Header
        darkMode={darkMode}
        onToggleDark={onToggleDark}
        onOpenAdmin={() => setAdminOpen(true)}
        onOpenDashboard={() => navigate('/dashboard')}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      {loading && <div className="page-banner">Loading live data…</div>}
      {error && <div className="page-banner error">{error}</div>}

      <div className="layout">
        <MenuPanel
          menu={menu}
          activeFilter={activeFilter}
          onSetFilter={setActiveFilter}
          cardQty={cardQty}
          onChangeQty={changeCardQty}
          onAddToOrder={addToOrder}
          customerName={customerName}
          onSetCustomerName={setCustomerName}
        />

        <Sidebar
          order={order}
          subtotal={subtotal}
          discount={discount}
          discAmt={discAmt}
          total={total}
          cashInput={cashInput}
          onSetCash={setCashInput}
          change={change}
          onClearOrder={clearOrder}
          onRemoveItem={removeItem}
          onChangeItemQty={changeItemQty}
          onApplyPromo={applyPromo}
          onCheckout={handleCheckout}
          onOpenHistory={() => setHistoryOpen(true)}
          onOpenDashboard={() => navigate('/dashboard')}
        />
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        order={order}
        subtotal={subtotal}
        discount={discount}
        discAmt={discAmt}
        total={total}
        cashInput={cashInput}
        onSetCash={setCashInput}
        change={change}
        onClearOrder={clearOrder}
        onRemoveItem={removeItem}
        onChangeItemQty={changeItemQty}
        onApplyPromo={applyPromo}
        onCheckout={() => { handleCheckout(); setDrawerOpen(false) }}
        onOpenHistory={() => { setHistoryOpen(true); setDrawerOpen(false) }}
        onOpenDashboard={() => navigate('/dashboard')}
      />

      <ReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        order={order}
        subtotal={subtotal}
        discount={discount}
        discAmt={discAmt}
        total={total}
        cash={parseFloat(cashInput || 0)}
        customerName={customerName}
        orderNum={orderLabel}
        onConfirm={confirmOrder}
        onSilentPrint={silentPrintAndConfirm}
      />

      <HistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={orderHistory}
      />

      <AdminModal
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        menu={menu}
        tab={adminTab}
        onSetTab={setAdminTab}
        onAddProduct={addProduct}
        onEditProduct={editProduct}
        onDeleteProduct={deleteProduct}
        onUpdateStock={updateStock}
        onResetMenu={resetMenu}
      />

      <Toast msg={toast?.msg} isErr={toast?.isErr} />
    </div>
  )
}

const DEFAULT_MENU = [
  {
    id: 1, name: 'Cappuccino', cat: 'coffee', price: 85, stock: 45,
    img: '/images/matcha-dream.jpg',
    rating: 4.3, reviews: 64, badge: null, badgeCls: ''
  },
  {
    id: 2, name: 'Matcha Latte', cat: 'coffee', price: 95, stock: 35,
    img: '/images/matcha.jpg',
    rating: 4.8, reviews: 110, badge: 'Best Seller', badgeCls: 'gold'
  },
  {
    id: 3, name: 'Okinawa Milk Tea', cat: 'tea', price: 105, stock: 28,
    img: '/images/okinawa.jpg',
    rating: 4.6, reviews: 97, badge: null, badgeCls: ''
  },
  {
    id: 4, name: 'Chocolate Mousse', cat: 'snacks', price: 110, stock: 15,
    img: '/images/chocolate.jpg',
    rating: 4.4, reviews: 55, badge: 'New', badgeCls: 'green'
  },
  {
    id: 5, name: 'Blueberry Muffin', cat: 'snacks', price: 120, stock: 8,
    img: '/images/strawberry.jpg',
    rating: 4.7, reviews: 88, badge: null, badgeCls: ''
  },
  {
    id: 6, name: 'Latte', cat: 'coffee', price: 90, stock: 42,
    img: '/images/taro-latte.jpg',
    rating: 4.5, reviews: 73, badge: null, badgeCls: ''
  },
  {
    id: 7, name: 'Iced Tea', cat: 'tea', price: 88, stock: 55,
    img: '/images/dark-chocolate.jpg',
    rating: 4.7, reviews: 85, badge: null, badgeCls: ''
  },
  {
    id: 8, name: 'Cheesecake Slice', cat: 'snacks', price: 105, stock: 12,
    img: '/images/oreo-cheesecake.jpg',
    rating: 4.6, reviews: 79, badge: 'Must Try', badgeCls: 'gold'
  },
  {
    id: 9, name: 'Green Tea Latte', cat: 'tea', price: 100, stock: 38,
    img: '/images/matcha-dream.jpg',
    rating: 4.9, reviews: 132, badge: 'Top Rated', badgeCls: 'green'
  },
  {
    id: 10, name: 'Cold Brew', cat: 'coffee', price: 75, stock: 60,
    img: '/images/boba.jpg',
    rating: 4.8, reviews: 120, badge: 'Best', badgeCls: 'gold'
  },
  {
    id: 11, name: 'Espresso Cookie', cat: 'snacks', price: 92, stock: 5,
    img: '/images/cookies-and-cream.jpg',
    rating: 4.4, reviews: 58, badge: null, badgeCls: ''
  },
  {
    id: 12, name: 'Mango Smoothie', cat: 'snacks', price: 110, stock: 30,
    img: '/images/manggo-smoothie.jpg',
    rating: 4.6, reviews: 91, badge: null, badgeCls: ''
  },
]

import { useState, useEffect } from 'react'

function App() {
  // --- NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState('dashboard');

  // --- DATA STATES ---
  const [dashboardData, setDashboardData] = useState({});
  const [reportData, setReportData] = useState({
    today: { revenue: 0, profit: 0, count: 0, history: [] },
    yesterday: { revenue: 0, profit: 0, count: 0, history: [] },
    week: { summary: [], totals: { revenue: 0, profit: 0, count: 0 } }
  });
  
  // Initialize as empty arrays to prevent crashes
  const [shopInventory, setShopInventory] = useState([]);
  const [godownInventory, setGodownInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [variants, setVariants] = useState([]);
  const [productList, setProductList] = useState([]); 

  // --- BILLING / CART STATES ---
  const [cart, setCart] = useState([]);
  const [selectedStockId, setSelectedStockId] = useState('');
  const [billQty, setBillQty] = useState('');
  const [billTotal, setBillTotal] = useState('');
  const [isLoose, setIsLoose] = useState(false);
  const [currentItem, setCurrentItem] = useState(null); 
  const [currentUnit, setCurrentUnit] = useState('Kg'); 
  const [lastSale, setLastSale] = useState(null);

  // --- BILLING (LOAN / CREDIT) STATES ---
  const [isLoanMode, setIsLoanMode] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [initialPayment, setInitialPayment] = useState(''); 

  // --- KHATA BOOK STATES ---
  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');

  // --- FORM STATES ---
  const [newCat, setNewCat] = useState('');
  const [newProd, setNewProd] = useState({ name: '', manufacturer: '', size: '', category_id: '', volume: '1.0' });
  const [newStock, setNewStock] = useState({ variant_id: '', quantity: '', purchase_price: '', mrp: '', expiry_date: '', location: 'godown' });
  const [editProd, setEditProd] = useState({ id: '', name: '', manufacturer: '', volume: '', size: '' });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  // --- API HELPER ---
  const apiFetch = async (path, options = {}) => {
    const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        console.warn(`API Error ${response.status} on ${path}`);
        return null;
      }
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) return await response.json();
      return null;
    } catch (e) {
      console.error(`Fetch failed for ${path}`, e);
      return null;
    }
  };

  const fmtCurrency = (value) => {
    if (value === undefined || value === null) return '0.00';
    const n = Number(value);
    if (Number.isNaN(n)) return '0.00';
    return n.toFixed(2);
  };

  // --- MAIN DATA REFRESH ---
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const [dashboard, shop, godown, report, setup] = await Promise.all([
        apiFetch('/api/dashboard/'),
        apiFetch('/api/inventory/'),
        apiFetch('/api/godown/'),
        apiFetch('/api/report/'),
        apiFetch('/api/setup-data/'),
      ]);

      // SAFETY CHECKS: Ensure we never set null to state
      setDashboardData(dashboard || {});
      setShopInventory(Array.isArray(shop) ? shop : []);
      setGodownInventory(Array.isArray(godown) ? godown : []);
      setReportData(report || { today: {}, yesterday: {}, week: {} });

      const catList = setup?.categories || [];
      const varList = setup?.variants || [];
      const prodList = setup?.products || [];

      setCategories(catList);
      setVariants(varList);
      
      const fullList = prodList.map(p => {
        const v = varList.find(v => v.name.startsWith(p.name));
        return { ...p, volume: v ? v.volume : 1.0, size: v ? v.size : '' };
      });
      setProductList(fullList);
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => { refreshData(); }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'dashboard') return;
    const intervalId = setInterval(() => { refreshData(); }, 30000);
    return () => clearInterval(intervalId);
  }, [activeTab]);

  // --- KHATA ACTIONS ---
  const fetchLoans = async () => {
    const data = await apiFetch('/api/loans/');
    console.log('LOANS rawData (App):', data);
    setLoans(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    if (activeTab === 'khata') fetchLoans();
  }, [activeTab]);

  const handleLoanPayment = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) return alert("Enter valid amount");
    const res = await apiFetch('/api/loan-payment/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loan_id: selectedLoan.id, amount: payAmount, note: payNote || 'Installment' })
    });
    if (res && res.success) {
      alert("Payment Recorded!");
      setPayAmount(''); setPayNote(''); setSelectedLoan(null);
      fetchLoans();
    } else {
      alert("Payment Failed");
    }
  };

  // --- UNIT UTILS ---
  const getUnit = (categoryName) => {
      if (!categoryName || typeof categoryName !== 'string') return 'Kg';
      const cat = categoryName.toLowerCase();
      if (cat.includes('seed')) return 'g';
      if (cat.includes('pesticide') || cat.includes('insecticide')) return 'ml';
      return 'Kg'; 
  };
  const getPercentColor = (percent) => { if(percent > 50) return 'bg-green-500'; if(percent > 20) return 'bg-yellow-500'; return 'bg-red-500'; };

  // --- BILLING LOGIC ---
  const handleProductSelect = (e) => {
      const id = e.target.value;
      setSelectedStockId(id);
      const item = shopInventory.find(i => i.id == id);
      if(item) {
          setCurrentItem(item);
          setCurrentUnit(getUnit(item.category));
          setBillQty('');
          setBillTotal('');
      }
  };

  const handleQtyChange = (e) => {
      const qty = e.target.value;
      setBillQty(qty);
      if(currentItem && qty) {
          if (isLoose) {
            const packetWeight = parseFloat(currentItem.packet_weight) || 1;
            const unit = currentUnit;
            let packetWeightKg = packetWeight;
            if (unit === 'g' || unit === 'ml') packetWeightKg = packetWeight / 1000.0;
            const pricePerKg = currentItem.mrp / packetWeightKg;
            let qtyKg = parseFloat(qty);
            if (unit === 'g' || unit === 'ml') qtyKg = qtyKg / 1000.0;
            const calculatedPrice = qtyKg * pricePerKg;
            setBillTotal(calculatedPrice.toFixed(2));
          } else {
            setBillTotal((parseFloat(qty) * currentItem.mrp).toFixed(2));
          }
      } else {
          setBillTotal('');
      }
  };

  const handleTotalChange = (e) => {
    setBillTotal(e.target.value);
  };

  const addToCart = () => {
    if(!selectedStockId) return alert("Select a product first");
    if(!billQty || billQty <= 0) return alert("Enter valid quantity");
    if(!billTotal) return alert("Total cannot be zero");

    const packetWeight = parseFloat(currentItem.packet_weight) || 1;
    let checkQtyDisplay = parseFloat(billQty);
    let checkQtyKg = checkQtyDisplay;

    if (isLoose) {
      if (currentUnit === 'g' || currentUnit === 'ml') {
        checkQtyKg = checkQtyDisplay / 1000.0; 
      }
      const availableKg = parseFloat(currentItem.quantity_loose) || 0;
      if (availableKg < checkQtyKg) {
         const availableDisplay = (currentUnit === 'g' || currentUnit === 'ml') ? (availableKg * 1000) : availableKg;
         return alert(`❌ Not enough LOOSE stock!\n\nAvailable: ${availableDisplay.toFixed(2)} ${currentUnit}\nRequired: ${checkQtyDisplay} ${currentUnit}\n\nPlease 'Open' a bag in Shop Stock first.`);
      }
    } else {
      if (currentItem.quantity_sealed < billQty) return alert(`Not enough SEALED stock!`);
    }

    const newItem = {
        stock_id: selectedStockId,
        product_name: currentItem.product_name,
        variant: currentItem.variant,
        quantity: parseFloat(billQty), 
        selling_price: (parseFloat(billTotal) / parseFloat(billQty)).toFixed(4),
        total: parseFloat(billTotal),
        is_loose: isLoose,
        unit: isLoose ? currentUnit : 'Pkts',
        packet_weight: packetWeight
    };

    setCart([...cart, newItem]);
    setSelectedStockId(''); setBillQty(''); setBillTotal(''); setIsLoose(false); setCurrentItem(null);
  };

  const removeFromCart = (index) => { const newCart = [...cart]; newCart.splice(index, 1); setCart(newCart); };
  
  const checkout = async () => {
    if (isLoanMode && (!customerName || !customerPhone)) return alert("Customer Name and Phone are required for Loans!");

    try {
      const serverCart = cart.map(item => {
        if (item.is_loose) {
            let qtyKg = item.quantity;
            if (item.unit === 'g' || item.unit === 'ml') qtyKg = item.quantity / 1000.0;
            const finalRate = item.total / qtyKg; 
            return { stock_id: item.stock_id, quantity: qtyKg, selling_price: finalRate, is_loose: true };
        } else {
            const finalRate = item.total / item.quantity;
            return { stock_id: item.stock_id, quantity: item.quantity, selling_price: finalRate, is_loose: false };
        }
      });

      const payload = { 
        items: serverCart,
        loan: isLoanMode ? {
          is_loan: true,
          customer: { phone: customerPhone, name: customerName, address: customerAddress },
          initial_payment: parseFloat(initialPayment) || 0,
          description: "POS Sale"
        } : null
      };

      const res = await apiFetch('/api/sale/', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });

      if (!res || !res.success) throw new Error(res?.error || "Sale Failed");

      const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);
      setLastSale({ 
        items: cart, 
        grandTotal: grandTotal, 
        date: new Date().toLocaleString(),
        isLoan: isLoanMode,
        customer: isLoanMode ? { name: customerName, phone: customerPhone } : null,
        paidNow: isLoanMode ? (parseFloat(initialPayment) || 0) : grandTotal
      });

      setCart([]); 
      setIsLoanMode(false); setCustomerName(''); setCustomerPhone(''); setCustomerAddress(''); setInitialPayment('');
      refreshData();

    } catch (err) {
      alert(`❌ Sale Failed: ${err.message || err}`);
    }
  };
  
  // --- INVENTORY ACTIONS ---
  async function handleOpenBag(item) {
    const unit = getUnit(item.category);
    const weight = item.packet_weight || 1;
    const qty = prompt(`Opening 1 Sealed Bag.\n\nAdding loose stock (${unit}):`, `${weight} ${unit}`);
    if (!qty) return;
    let kgToSend = parseFloat(qty);
    if (unit === 'g' || unit === 'ml') kgToSend = kgToSend / 1000.0;
    const res = await apiFetch('/api/open-bag/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shop_id: item.id, kg_in_bag: kgToSend }) });
    if(res) { alert("✂️ Opened!"); refreshData(); }
  }

  const handleTransfer = async (godownId, currentQty) => { const qty = prompt(`Move to SHOP? (Max: ${currentQty})`); if (!qty) return; await apiFetch('/api/transfer/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ godown_id: godownId, quantity: qty }) }); alert("✅ Moved!"); refreshData(); };
  const handleReturnToGodown = async (shopId) => { const qty = prompt(`Return to GODOWN?`); if (!qty) return; await apiFetch('/api/transfer-back/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shop_id: shopId, quantity: qty }) }); alert("✅ Returned!"); refreshData(); };
  const handleDeleteBatch = async (batchId) => { if (window.confirm("Delete?")) { await apiFetch('/api/delete-batch/', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ batch_id: batchId }) }); refreshData(); }};
  const submitProduct = async () => { await apiFetch('/api/add-product/', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(newProd) }); alert("Added!"); refreshData(); };
  const submitStock = async () => { const d = await apiFetch('/api/add-stock/', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(newStock) }); if(d) alert(d.message); refreshData(); };
  const saveProductEdit = async () => { await apiFetch('/api/edit-product/', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(editProd) }); alert("Updated!"); refreshData(); };
  const deleteProduct = async () => { if (!editProd.id) return; if (window.confirm("Delete Product completely?")) { await apiFetch('/api/delete-product/', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: editProd.id }) }); alert("Deleted."); refreshData(); }};
  const printBill = () => { window.print(); };

  // --- RENDER ---
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <div className="w-64 bg-green-900 text-white flex flex-col shadow-2xl print:hidden">
        <div className="p-6 text-2xl font-bold bg-green-950 text-center border-b border-green-800">
          <div>🌾 Raju Agro</div>
          <div className="text-xs text-green-200 mt-1">Farmer's Trusted Partner</div>
        </div>
        <nav className="flex-1 mt-6">
          <MenuButton label="📊 Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <MenuButton label="🛒 Shop Stock" active={activeTab === 'shop'} onClick={() => setActiveTab('shop')} />
          <MenuButton label="🏭 Godown Stock" active={activeTab === 'godown'} onClick={() => setActiveTab('godown')} />
          <MenuButton label="📖 Khata Book" active={activeTab === 'khata'} onClick={() => setActiveTab('khata')} />
          <MenuButton label="➕ Manage Items" active={activeTab === 'manage'} onClick={() => setActiveTab('manage')} />
          <MenuButton label="💰 Billing (POS)" active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} />
        </nav>
      </div>

      <div className="flex-1 overflow-auto p-8">
        
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Stock Management</h1>
                <p className="text-sm text-gray-500">Overview of stock levels, sales, and weekly summaries</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1">
                          <Card title="Today's Collection" value={`₹ ${fmtCurrency(reportData.today?.revenue)}`} color="green" />
                          <Card title="Today's Profit" value={`₹ ${fmtCurrency(reportData.today?.profit)}`} color="purple" />
                          <Card title="Yesterday's Collection" value={`₹ ${fmtCurrency(reportData.yesterday?.revenue)}`} color="indigo" />
                          <Card title="Week Total" value={`₹ ${fmtCurrency(reportData.week?.totals?.revenue)}`} color="blue" />
                        </div>
            </div>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border-t-4 border-gray-600">
              <div className="bg-gray-800 text-white p-4 font-bold text-lg flex justify-between"><span>📜 Today's Sales History</span><span>{reportData.today?.count || 0} Bills</span></div>
              <table className="min-w-full"><thead className="bg-gray-100 border-b"><tr><th className="py-3 px-6 text-left">Time</th><th className="py-3 px-6 text-left">Items Sold</th><th className="py-3 px-6 text-right">Bill Amount</th></tr></thead><tbody className="text-gray-700">{reportData.today?.history && reportData.today.history.map((bill) => (<tr key={bill.id} className="border-b hover:bg-gray-50"><td className="py-3 px-6 font-bold text-gray-500">{bill.time}</td><td className="py-3 px-6">{bill.items}</td><td className="py-3 px-6 text-right font-bold text-green-700">₹ {fmtCurrency(bill.total)}</td></tr>))}</tbody></table>
            </div>
            {/* YESTERDAY */}
            <div className="mt-6 bg-white rounded-lg shadow-lg overflow-hidden border-t-4 border-gray-500">
              <div className="bg-gray-700 text-white p-3 font-bold text-md flex justify-between"><span>📜 Yesterday's Sales History</span><span>{reportData.yesterday?.count || 0} Bills</span></div>
              <table className="min-w-full"><thead className="bg-gray-100 border-b"><tr><th className="py-3 px-6 text-left">Time</th><th className="py-3 px-6 text-left">Items Sold</th><th className="py-3 px-6 text-right">Bill Amount</th></tr></thead><tbody className="text-gray-700">{reportData.yesterday?.history && reportData.yesterday.history.map((bill) => (<tr key={bill.id} className="border-b hover:bg-gray-50"><td className="py-3 px-6 font-bold text-gray-500">{bill.time}</td><td className="py-3 px-6">{bill.items}</td><td className="py-3 px-6 text-right font-bold text-green-700">₹ {fmtCurrency(bill.total)}</td></tr>))}</tbody></table>
            </div>

            {/* WEEK SUMMARY */}
            <div className="mt-6 bg-white rounded-lg shadow-lg overflow-hidden border-t-4 border-gray-600">
              <div className="bg-gray-800 text-white p-3 font-bold text-md flex justify-between"><span>📆 Weekly Summary (Last 7 Days)</span><span>Revenue: ₹ {fmtCurrency(reportData.week?.totals?.revenue)} &nbsp; Profit: ₹ {fmtCurrency(reportData.week?.totals?.profit)}</span></div>
              <table className="min-w-full"><thead className="bg-gray-100 border-b"><tr><th className="py-3 px-6 text-left">Date</th><th className="py-3 px-6 text-right">Revenue</th><th className="py-3 px-6 text-right">Profit</th><th className="py-3 px-6 text-right"># Bills</th></tr></thead><tbody className="text-gray-700">{reportData.week?.summary && reportData.week.summary.map((d) => (<tr key={d.date} className="border-b hover:bg-gray-50"><td className="py-3 px-6 font-bold text-gray-500">{new Date(d.date).toLocaleDateString()}</td><td className="py-3 px-6 text-right">₹ {fmtCurrency(d.revenue)}</td><td className="py-3 px-6 text-right">₹ {fmtCurrency(d.profit)}</td><td className="py-3 px-6 text-right">{d.count}</td></tr>))}</tbody></table>
            </div>
          </div>
        )}

        {/* SHOP INVENTORY */}
        {activeTab === 'shop' && (
          <div className="print:hidden">
            <h1 className="text-4xl font-bold text-gray-800 mb-8">Shop Inventory</h1>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-green-800 text-white">
                  <tr><th className="py-3 px-6 text-left">Product</th><th className="py-3 px-6 text-left">Sealed Bags</th><th className="py-3 px-6 text-left bg-green-900">Open Stock</th><th className="py-3 px-6 text-left">MRP</th><th className="py-3 px-6 text-left">Actions</th><th className="py-3 px-6"></th></tr>
                </thead>
                <tbody className="text-gray-700">
                  {shopInventory.map((item) => {
                    const unit = getUnit(item.category);
                    const capacity = item.packet_weight || 1;
                    const looseKg = parseFloat(item.quantity_loose) || 0; 
                    let capacityKg = capacity; if (unit === 'g' || unit === 'ml') capacityKg = capacity / 1000.0;
                    const percent = capacityKg === 0 ? 0 : Math.min(100, Math.round((looseKg / capacityKg) * 100));
                    const showAlternate = (unit === 'g' || unit === 'ml');
                    const primaryDisplayText = showAlternate ? `${(looseKg * 1000).toFixed(2)} ${unit}` : `${looseKg.toFixed(2)} Kg`;
                    return (
                      <tr key={item.id} className="border-b hover:bg-green-50">
                        <td className="py-3 px-6 font-bold">{item.product_name} <br/><span className="text-xs text-gray-500">{item.batch_no}</span></td>
                        <td className="py-3 px-6 font-bold text-green-700">{item.quantity_sealed}</td>
                        <td className="py-3 px-6 font-bold bg-orange-50"><div className="flex items-center gap-2"><div className="w-16 bg-gray-200 rounded-full h-2.5"><div className={`h-2.5 rounded-full ${getPercentColor(percent)}`} style={{width: `${percent}%`}}></div></div><span>{percent}%</span></div><span className="text-xs text-gray-400">({primaryDisplayText} left)</span></td>
                        <td className="py-3 px-6">₹ {item.mrp}</td>
                        <td className="py-3 px-6 space-y-1"><button onClick={() => handleOpenBag(item)} className="block w-full bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700">✂️ Open</button><button onClick={() => handleReturnToGodown(item.id)} className="block w-full bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600">⬅ Godown</button></td>
                        <td className="py-3 px-6 text-right"><button onClick={() => handleDeleteBatch(item.batch_id)} className="text-red-400 hover:text-red-700 font-bold text-xl">×</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* GODOWN */}
        {activeTab === 'godown' && (
           <div className="print:hidden"><h1 className="text-4xl font-bold text-gray-800 mb-8">Godown Management</h1><div className="bg-white rounded-lg shadow overflow-hidden"><table className="min-w-full"><thead className="bg-orange-800 text-white"><tr><th className="py-3 px-6 text-left">Product</th><th className="py-3 px-6 text-left">Batch</th><th className="py-3 px-6 text-left">Qty</th><th className="py-3 px-6 text-left">Expiry</th><th className="py-3 px-6 text-left">Action</th><th className="py-3 px-6"></th></tr></thead><tbody className="text-gray-700">{godownInventory.map((item) => (<tr key={item.id} className={`border-b ${item.is_alert ? 'bg-red-100' : ''}`}><td className="py-3 px-6 font-bold">{item.product_name} <br/><span className="text-xs text-gray-500">{item.batch_no}</span></td><td className="py-3 px-6">{item.batch_no}</td><td className="py-3 px-6 font-bold">{item.quantity}</td><td className="py-3 px-6">{item.expiry_date} {item.is_alert && <span className="text-red-600 font-bold">⚠</span>}</td><td className="py-3 px-6"><button onClick={() => handleTransfer(item.id, item.quantity)} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs">To Shop ➡</button></td><td className="py-3 px-6 text-right"><button onClick={() => handleDeleteBatch(item.batch_id)} className="text-red-400 hover:text-red-700 font-bold text-xl">×</button></td></tr>))}</tbody></table></div></div>
        )}

        {/* KHATA BOOK */}
        {activeTab === 'khata' && (
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">📖 Khata Book (Ledger)</h1>
            {(!loans || loans.length === 0) && <p className="text-center text-gray-500 italic mt-10">No active loans found.</p>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(loans || []).map(loan => (
                <div key={loan.id} className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-red-500 cursor-pointer hover:shadow-xl transition transform hover:-translate-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{loan.customer?.name || loan.customer_name || 'Unknown'}</h3>
                      <p className="text-sm text-gray-500">📞 {loan.customer?.phone || loan.customer_phone || 'No Phone'}</p>
                      <p className="text-sm text-gray-500">📍 {loan.customer?.address || loan.customer_address || 'No Address'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-bold uppercase">Due Amount</p>
                      <p className="text-2xl font-bold text-red-600">₹ {parseFloat(loan.outstanding).toLocaleString()}</p>
                    </div>
                    </div>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${loan.status === 'CLOSED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{loan.status}</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedLoan(loan)} className="text-blue-600 text-sm font-bold">View & Pay ➡</button>
                      <button onClick={async (e) => {
                        e.stopPropagation();
                        if (!window.confirm(`Delete entire loan history for ${loan.customer.name}?`)) return;
                        try {
                          const res = await apiFetch('/api/delete-customer-loans/', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ customer_id: loan.customer.id })
                          });
                          if (!res || !res.success) throw new Error(res?.error || 'Delete failed');
                          alert('Loan history deleted successfully');
                          fetchLoans();
                        } catch (err) {
                          alert(`Delete failed: ${err.message || err}`);
                        }
                      }} className="text-red-600 text-sm font-semibold hover:underline">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedLoan && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col">
                  <div className="bg-blue-900 text-white p-4 flex justify-between items-center rounded-t-lg">
                    <h2 className="text-xl font-bold">{selectedLoan.customer?.name || selectedLoan.customer_name || 'Unknown'} {selectedLoan.status === 'CLOSED' ? (<span className="text-sm bg-green-200 text-green-800 px-2 py-1 rounded ml-3 font-normal">PAID IN FULL</span>) : (<span className="text-sm bg-red-200 text-red-800 px-2 py-1 rounded ml-3 font-normal">DUE: ₹{fmtCurrency(selectedLoan.outstanding)}</span>)}</h2>
                    <div className="flex items-center gap-3">
                      <button onClick={async () => {
                        if (!window.confirm(`Delete entire loan history for ${selectedLoan.customer.name}?`)) return;
                        try {
                          const res = await apiFetch('/api/delete-customer-loans/', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ customer_id: selectedLoan.customer.id })
                          });
                          if (!res || !res.success) throw new Error(res?.error || 'Delete failed');
                          alert('Loan history deleted successfully');
                          setSelectedLoan(null);
                          fetchLoans();
                        } catch (err) {
                          alert(`Delete failed: ${err.message || err}`);
                        }
                      }} className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded font-bold text-sm">Delete</button>
                      <button onClick={() => setSelectedLoan(null)} className="text-2xl font-bold hover:text-red-200">×</button>
                    </div>
                  </div>
                  <div className="p-6 flex-1 overflow-y-auto">
                    <div className="bg-green-50 p-4 rounded border border-green-200 mb-6">
                      <h3 className="font-bold text-green-900 mb-2">💰 Add Installment</h3>
                      <div className="flex gap-2">
                        <input type="number" placeholder="Amount" className="flex-1 p-2 border rounded" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
                        <input type="text" placeholder="Note (e.g. UPI)" className="flex-1 p-2 border rounded" value={payNote} onChange={e => setPayNote(e.target.value)} />
                        <button onClick={handleLoanPayment} className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700">Save</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded p-3 bg-gray-50">
                        <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">🛒 Purchase History</h4>
                        <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                          {selectedLoan.purchase_history && selectedLoan.purchase_history.map(sale => (
                            <div key={sale.id} className="flex justify-between border-b pb-1 last:border-0">
                              <span>{new Date(sale.date).toLocaleDateString()} - {sale.items}</span>
                              <span className="font-bold text-red-600 whitespace-nowrap">+₹{sale.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="border rounded p-3 bg-gray-50">
                        <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">✅ Payment History</h4>
                        <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                           {selectedLoan.payments && selectedLoan.payments.map(p => (
                            <div key={p.id} className="flex justify-between border-b pb-1 last:border-0">
                              <span>{new Date(p.date).toLocaleDateString()} ({p.note})</span>
                              <span className="font-bold text-green-600 whitespace-nowrap">-₹{p.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MANAGE ITEMS */}
        {activeTab === 'manage' && (
          <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <h1 className="text-3xl font-bold text-gray-800">Manage Items</h1>
            <div className="bg-white p-6 rounded shadow border-l-4 border-yellow-500"><h2 className="font-bold text-xl mb-4">1. Add Category</h2><div className="flex gap-4"><input type="text" placeholder="Category Name" className="border p-2 rounded w-full" onChange={(e) => setNewCat(e.target.value)} /><button onClick={async () => {await fetch(`${API_BASE}/api/add-category/`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:newCat})}); alert("Added!"); refreshData();}} className="bg-yellow-600 text-white px-6 py-2 rounded font-bold">Add</button></div></div>
            <div className="bg-white p-6 rounded shadow border-l-4 border-blue-500"><h2 className="font-bold text-xl mb-4">2. Add New Product</h2><div className="grid grid-cols-2 gap-4"><select className="border p-2 rounded" onChange={(e) => setNewProd({...newProd, category_id: e.target.value})}><option>Select Category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><input type="text" placeholder="Product Name" className="border p-2 rounded" onChange={(e) => setNewProd({...newProd, name: e.target.value})} /><input type="text" placeholder="Manufacturer" className="border p-2 rounded" onChange={(e) => setNewProd({...newProd, manufacturer: e.target.value})} /><input type="text" placeholder="Size Label (e.g. 500g)" className="border p-2 rounded" onChange={(e) => setNewProd({...newProd, size: e.target.value})} /><div className="col-span-2 bg-gray-50 p-2 rounded border border-blue-200"><label className="block text-sm text-gray-600 font-bold mb-1">Packet Weight/Volume (Numerical Only)</label><div className="flex gap-2 items-center"><input type="number" placeholder="e.g. 500 or 50" className="border p-2 rounded w-full" onChange={(e) => setNewProd({...newProd, volume: e.target.value})} /><span className="text-gray-500 text-sm italic">Enter '500' for 500g, or '50' for 50kg</span></div></div></div><button onClick={submitProduct} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded font-bold w-full">Create Product</button></div>
            <div className="bg-white p-6 rounded shadow border-l-4 border-green-500"><h2 className="font-bold text-xl mb-4">3. Add Stock</h2><div className="grid grid-cols-2 gap-4"><select className="border p-2 rounded col-span-2" onChange={(e) => setNewStock({...newStock, variant_id: e.target.value})}><option>Select Product Variant</option>{variants.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select><div className="col-span-2 bg-gray-100 p-2 rounded flex gap-4 items-center"><span className="font-bold">Add To:</span><label className="flex items-center gap-2"><input type="radio" name="loc" checked={newStock.location === 'godown'} onChange={() => setNewStock({...newStock, location: 'godown'})} /> Godown</label><label className="flex items-center gap-2"><input type="radio" name="loc" checked={newStock.location === 'shop'} onChange={() => setNewStock({...newStock, location: 'shop'})} /> Shop Directly</label></div><div className="col-span-1 bg-gray-200 p-2 rounded text-gray-600 text-center italic">Batch ID: Auto-Generated</div><input type="number" placeholder="Quantity" className="border p-2 rounded" onChange={(e) => setNewStock({...newStock, quantity: e.target.value})} /><input type="number" placeholder="Purchase Price" className="border p-2 rounded" onChange={(e) => setNewStock({...newStock, purchase_price: e.target.value})} /><input type="number" placeholder="MRP" className="border p-2 rounded" onChange={(e) => setNewStock({...newStock, mrp: e.target.value})} /><div className="flex flex-col"><label className="text-xs text-gray-500">Expiry Date</label><input type="date" className="border p-2 rounded" onChange={(e) => setNewStock({...newStock, expiry_date: e.target.value})} /></div></div><button onClick={submitStock} className="mt-4 bg-green-600 text-white px-6 py-2 rounded font-bold w-full">Add Stock</button></div>
            <div className="bg-white p-6 rounded shadow border-l-4 border-red-500"><h2 className="font-bold text-xl mb-4">4. Edit / Delete Product</h2><div className="grid grid-cols-1 gap-4"><select className="border p-2 rounded" onChange={(e) => { const prod = productList.find(p => p.id == e.target.value); if(prod) setEditProd({ id: prod.id, name: prod.name, manufacturer: prod.manufacturer, volume: prod.volume, size: prod.size }); }}><option>-- Select Product --</option>{productList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>{editProd.id && (<div className="bg-red-50 p-4 rounded border border-red-200"><label className="block text-sm font-bold text-gray-700">Name:</label><input type="text" value={editProd.name} className="border p-2 rounded w-full mb-2" onChange={(e) => setEditProd({...editProd, name: e.target.value})} /><label className="block text-sm font-bold text-gray-700">Manufacturer:</label><input type="text" value={editProd.manufacturer} className="border p-2 rounded w-full mb-2" onChange={(e) => setEditProd({...editProd, manufacturer: e.target.value})} /><label className="block text-sm font-bold text-gray-700">Packet Weight (Volume):</label><input type="number" value={editProd.volume} className="border p-2 rounded w-full mb-2" onChange={(e) => setEditProd({...editProd, volume: e.target.value})} /><label className="block text-sm font-bold text-gray-700">Size Label (e.g. 50kg):</label><input type="text" value={editProd.size} className="border p-2 rounded w-full mb-2" onChange={(e) => setEditProd({...editProd, size: e.target.value})} /><div className="flex gap-4 mt-2"><button onClick={saveProductEdit} className="bg-blue-600 text-white px-6 py-2 rounded font-bold w-2/3">Save Changes</button><button onClick={deleteProduct} className="bg-red-700 text-white px-6 py-2 rounded font-bold w-1/3 hover:bg-red-900">DELETE 🗑</button></div></div>)}</div></div>
          </div>
        )}

        {/* BILLING (POS) */}
        {activeTab === 'billing' && (
          <div className="max-w-4xl mx-auto">
            {lastSale ? (
              <div className="bg-white p-8 rounded-lg shadow-xl border-2 border-gray-200 text-center animate-fade-in">
                <div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4">
                  <h2 className="text-3xl font-bold text-green-800">🌾 Raju Agro Center</h2>
                  <p className="text-gray-500">Main Road, Tamil Nadu</p>
                  <p className="text-sm text-gray-400 mt-1">Date: {lastSale.date}</p>
                  <p className="font-bold mt-1">Bill No: {Math.floor(Math.random() * 10000)}</p>
                  {lastSale.isLoan && (
                    <div className="border border-black p-2 mt-2 inline-block text-left text-sm">
                        <p><strong>Customer:</strong> {lastSale.customer.name}</p>
                        <p><strong>Phone:</strong> {lastSale.customer.phone}</p>
                        <p className="font-bold text-red-600 mt-1">CREDIT / UDHAAR BILL</p>
                    </div>
                  )}
                </div>
                
                <div className="text-left mb-4">
                  {(lastSale.items || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between border-b border-dashed border-gray-200 py-2">
                      <span>{item.product_name} ({item.quantity} {item.unit} x {item.selling_price})</span>
                      <span className="font-bold">₹ {Number(item.total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-dashed border-gray-400 pt-4 mb-6 text-right">
                  <div className="flex justify-between text-xl font-bold text-gray-800">
                    <span>Grand Total:</span>
                    <span>₹ {Number(lastSale.grandTotal).toFixed(2)}</span>
                  </div>
                  {lastSale.isLoan && (
                      <>
                        <div className="flex justify-between text-sm text-gray-600 mt-1">
                            <span>Paid Now:</span>
                            <span>₹ {Number(lastSale.paidNow).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-red-600 mt-2 border-t pt-2">
                            <span>Balance Due:</span>
                            <span>₹ {(Number(lastSale.grandTotal) - Number(lastSale.paidNow)).toFixed(2)}</span>
                        </div>
                      </>
                  )}
                </div>

                <div className="flex gap-4 print:hidden">
                  <button onClick={printBill} className="w-1/2 bg-gray-800 text-white py-3 rounded hover:bg-black font-bold">🖨 Print Bill</button>
                  <button onClick={() => {setLastSale(null); setBillQty('');}} className="w-1/2 bg-green-600 text-white py-3 rounded hover:bg-green-700 font-bold">New Sale ➡</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-6">
                <div className="w-1/2 bg-white p-6 rounded-lg shadow-xl border-t-4 border-green-600 h-fit">
                  <h1 className="text-2xl font-bold text-gray-800 mb-6">Add Item to Bill</h1>
                  <div className="flex gap-4 mb-4 bg-gray-100 p-2 rounded">
                    <button onClick={() => setIsLoose(false)} className={`flex-1 py-2 rounded font-bold ${!isLoose ? 'bg-green-600 text-white shadow' : 'text-gray-600'}`}>📦 Sealed</button>
                    <button onClick={() => setIsLoose(true)} className={`flex-1 py-2 rounded font-bold ${isLoose ? 'bg-orange-500 text-white shadow' : 'text-gray-600'}`}>⚖️ Loose ({selectedStockId ? currentUnit : 'Unit'})</button>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-2">Select Product</label>
                    <select className="w-full p-3 border rounded bg-gray-50" value={selectedStockId} onChange={handleProductSelect}>
                      <option value="">-- Choose Item --</option>
                      {(shopInventory || []).map(item => (<option key={item.id} value={item.id}>{item.product_name} ({item.variant}) - MRP: {item.mrp}</option>))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-2">{isLoose ? `Enter ${currentUnit}` : 'Qty (Pkts)'}</label>
                    <input type="number" className="w-full p-3 border rounded font-bold text-lg" value={billQty} onChange={handleQtyChange} placeholder="0" />
                  </div>
                  <div className="mb-6">
                    <label className="block text-gray-800 font-bold mb-2 text-lg">Final Amount (Editable)</label>
                    <input type="number" className="w-full p-4 border-2 border-green-500 rounded text-xl font-bold text-green-700" value={billTotal} onChange={handleTotalChange} placeholder="₹ 0" />
                    <p className="text-xs text-gray-400 mt-1">System calculated based on Packet Weight. Edit to bargain.</p>
                  </div>
                  <button onClick={addToCart} className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 text-lg transition shadow-lg">⬇ Add to Bill</button>
                </div>

                <div className="w-1/2 bg-white p-6 rounded-lg shadow-xl border-t-4 border-orange-500 min-h-[400px] flex flex-col justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Current Bill (Cart)</h1>
                    {cart.length === 0 ? (
                      <p className="text-gray-400 italic text-center mt-10">Cart is empty...</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-gray-600"><tr><th className="p-2 text-left">Item</th><th className="p-2">Qty</th><th className="p-2">Total</th><th className="p-2"></th></tr></thead>
                        <tbody>
                          {cart.map((item, index) => (<tr key={index} className="border-b"><td className="p-2 font-bold">{item.product_name} <br/><span className="text-xs text-gray-500">{item.is_loose ? `(Loose ${item.unit})` : '(Sealed)'}</span></td><td className="p-2 text-center">{item.quantity}</td><td className="p-2 text-center">{Number(item.total).toFixed(2)}</td><td className="p-2 text-center"><button onClick={() => removeFromCart(index)} className="text-red-500 font-bold hover:text-red-700">Remove</button></td></tr>))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  
                  <div className="mt-4 border-t pt-4">
                    <div className="flex justify-between text-xl font-bold text-gray-800 mb-4"><span>Total Amount:</span><span>₹ {cart.reduce((sum, item) => sum + item.total, 0).toFixed(2)}</span></div>
                    
                    <div className="bg-gray-50 p-3 rounded mb-4 border">
                        <div className="flex gap-2 mb-3">
                            <button onClick={() => setIsLoanMode(false)} className={`flex-1 py-2 font-bold rounded ${!isLoanMode ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>💵 Cash</button>
                            <button onClick={() => setIsLoanMode(true)} className={`flex-1 py-2 font-bold rounded ${isLoanMode ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}>📕 Loan</button>
                        </div>
                        {isLoanMode && (
                            <div className="space-y-2 animate-fade-in">
                                <input type="text" placeholder="Customer Phone *" className="w-full p-2 border rounded" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                                <input type="text" placeholder="Customer Name *" className="w-full p-2 border rounded" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                                <input type="text" placeholder="Address" className="w-full p-2 border rounded" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold w-1/3">Paid Now:</span>
                                    <input type="number" placeholder="0" className="w-2/3 p-2 border rounded" value={initialPayment} onChange={e => setInitialPayment(e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={checkout} className={`w-full py-4 rounded font-bold text-xl transition shadow-lg ${cart.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : (isLoanMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-700 hover:bg-green-800 text-white')}`}>
                        {isLoanMode ? '📕 CONFIRM LOAN' : '✅ CONFIRM & PRINT'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

function MenuButton({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full text-left px-8 py-4 font-semibold ${active ? 'bg-green-700 border-l-4 border-yellow-400' : 'hover:bg-green-800'}`}>
      {label}
    </button>
  );
}

function Card({ title, value, color }) {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-lg border-l-4 border-${color}-500`}>
      <h3 className="text-gray-500 font-bold uppercase text-sm">{title}</h3>
      <p className="text-4xl font-bold text-gray-800 mt-2">{value}</p>
    </div>
  );
}

export default App
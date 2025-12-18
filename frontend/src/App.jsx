import { useState, useEffect } from 'react';
import { 
  BarChart2, ShoppingCart, Archive, BookOpen, Plus, DollarSign, 
  Receipt, Sprout, Trash2, Scissors, TrendingUp, Search,
  ArrowLeft, ArrowRight, X, CheckCircle, Truck, Zap, Users, Layers,
  Calendar, Menu, ChevronRight
} from 'lucide-react';
import CustomCursor from './CustomCursor';
import './CustomCursor.css';

// --- HELPER: CUSTOM CSS CHART ---
// --- HELPER: CUSTOM CSS CHART ---
const SimpleBarChart = ({ data, onBarClick }) => {
    if (!data || data.length === 0) return <div className="h-40 flex items-center justify-center text-gray-400">No Data Available</div>;
    
    // Calculate max value for bar height scaling
    const maxVal = Math.max(...data.map(d => Math.max(d.revenue, d.expenses)));
    
    return (
        <div className="flex items-end justify-between gap-2 h-64 pt-8 pb-6">
            {data.map((item, idx) => {
                // Calculate heights as percentage
                const hRev = maxVal > 0 ? (item.revenue / maxVal) * 100 : 0;
                const hExp = maxVal > 0 ? (item.expenses / maxVal) * 100 : 0;
                
                return (
                    <div key={idx} onClick={() => onBarClick && onBarClick(item)} className="flex flex-col items-center flex-1 h-full justify-end gap-1 group cursor-pointer relative">
                        
                        {/* Tooltip (Hover State) */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] p-2 rounded absolute bottom-full mb-2 z-10 pointer-events-none whitespace-nowrap shadow-lg">
                            <p className="font-bold border-b border-gray-700 pb-1 mb-1">{item.label}</p>
                            <p className="text-emerald-300">Rev: ₹{item.revenue.toLocaleString()}</p>
                            <p className="text-red-300">Exp: ₹{item.expenses.toLocaleString()}</p>
                            <p className="text-blue-300 mt-1 border-t border-gray-700 pt-1">Net: ₹{item.net.toLocaleString()}</p>
                        </div>

                        {/* Bars */}
                        <div className="w-full flex items-end justify-center gap-1 h-full px-1">
                            <div style={{ height: `${hRev}%` }} className="w-full max-w-[20px] bg-emerald-500 rounded-t-sm hover:bg-emerald-400 transition-all"></div>
                            <div style={{ height: `${hExp}%` }} className="w-full max-w-[20px] bg-red-400 rounded-t-sm hover:bg-red-300 transition-all"></div>
                        </div>

                        {/* Label - FIXED HERE */}
                        <span className="text-[10px] font-bold text-gray-600 w-full text-center leading-tight">
                            {/* Logic: If it's a Year (numeric), show full. If text (Month/Week), shorten intelligently if needed */}
                            {item.label.includes('Week') ? item.label.replace('Week', 'W') : item.label.substring(0, 10)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};
// --- STYLED COMPONENTS HELPERS ---
const GlassCard = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white backdrop-blur-xl border border-gray-200/80 rounded-2xl p-4 md:p-6 shadow-xl ${className} ${onClick ? 'cursor-pointer hover:border-emerald-500/50 transition-all active:scale-95' : ''}`}>
    {children}
  </div>
);

const StatCard = ({ title, value, sub, colorClass = "text-emerald-600" }) => (
  <GlassCard className="relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300">
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-emerald-900">
      <Sprout size={60} />
    </div>
    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">{title}</h3>
    <p className={`text-2xl md:text-3xl font-bold ${colorClass}`}>{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-2">{sub}</p>}
  </GlassCard>
);

const ActionButton = ({ onClick, label, icon: Icon, variant = "primary", className = "", disabled = false, ...props }) => {
  const base = "flex items-center justify-center gap-2 px-4 py-3 md:py-2 rounded-xl font-bold transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed z-20 relative text-sm md:text-base";
  const styles = {
    primary: "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] border border-emerald-500/20",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
    warning: "bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100",
    blue: "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100",
    secondary: "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`} {...props}>
      {Icon && <Icon size={18} />} {label}
    </button>
  );
};

const Input = (props) => (
  <input {...props} className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors text-sm md:text-base ${props.className}`} />
);

const Select = ({ children, ...props }) => (
  <select {...props} className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors appearance-none text-sm md:text-base ${props.className}`}>
    {children}
  </select>
);
// --- LANDING PAGE COMPONENT (WITH LOGIN) ---
const LandingPage = ({ onEnter }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

 // INSIDE App.jsx

  // --- REPLACE YOUR EXISTING handleLogin WITH THIS ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    try {
      // 1. Send Username & Password to Django to get a Key
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        // 2. Login Success: Save the Key (Access Token)
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        onEnter();
      } else {
        // 3. Login Failed
        setError('Invalid Username or Password');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to Server. Is Backend running?');
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-emerald-500/20">
      
      {/* Background Blobs */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-emerald-300/20 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-green-300/20 rounded-full blur-[150px] pointer-events-none translate-x-1/3 translate-y-1/3"></div>

      {/* Main Login Card */}
      <div className="z-10 flex flex-col items-center p-8 bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl w-full max-w-md animate-fade-in-up">
        
        {/* Logo Icon */}
        <div className="mb-6 relative group cursor-default">
            <div className="absolute inset-0 bg-emerald-400 blur-xl opacity-20 rounded-full"></div>
            <div className="relative bg-white p-4 rounded-2xl shadow-lg border border-emerald-50 text-emerald-600">
                <Sprout size={48} strokeWidth={1.5} />
            </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Raju Agro</h1>
        <p className="text-sm text-gray-500 mb-8 font-medium">Please sign in to continue</p>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full space-y-4">
            
            {/* Username Input */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Username</label>
                <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                    placeholder="Enter username"
                />
            </div>

            {/* Password Input */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                    placeholder="Enter password"
                />
            </div>

            {/* Error Message */}
            {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}

            {/* Submit Button */}
            <button 
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-emerald-600 to-green-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 mt-4"
            >
              <span>Login to Dashboard</span>
              <ArrowRight size={20} />
            </button>
        </form>
      </div>

    </div>
  );
};
function App() {
  // --- ADD THIS LINE HERE ---
  const [hasEntered, setHasEntered] = useState(false);
  
  const [activeTab, setActiveTab] = useState('stock-management');
  
  // --- SEARCH STATES ---
  const [searchTerm, setSearchTerm] = useState('');
  const [allCustomers, setAllCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  // --- DATA STATES ---
  const [reportData, setReportData] = useState({});
  const [shopInventory, setShopInventory] = useState([]);
  const [godownInventory, setGodownInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [variants, setVariants] = useState([]);
  const [productList, setProductList] = useState([]); 

  // --- ANALYSIS STATES ---
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisYear, setAnalysisYear] = useState(null);
  const [analysisMonth, setAnalysisMonth] = useState(null);

  // --- BILLING STATES ---
  const [cart, setCart] = useState([]);
  const [selectedStockId, setSelectedStockId] = useState('');
  const [billQty, setBillQty] = useState('');
  const [billTotal, setBillTotal] = useState('');
  const [isLoose, setIsLoose] = useState(false);
  const [currentItem, setCurrentItem] = useState(null); 
  const [currentUnit, setCurrentUnit] = useState('Kg'); 
  const [lastSale, setLastSale] = useState(null);
  const [isLoanMode, setIsLoanMode] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [initialPayment, setInitialPayment] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  // --- EXPENSE STATES ---
  const [expenseList, setExpenseList] = useState([]);
  const [expenseForm, setExpenseForm] = useState({ category: 'Transport', amount: '', note: '' });

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
   
  const API_BASE = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://127.0.0.1:8000';

  // INSIDE App.jsx

  // --- REPLACE YOUR EXISTING apiFetch WITH THIS ---
  const apiFetch = async (path, options = {}) => {
    try {
      // 1. Retrieve the "Key" from browser storage
      const token = localStorage.getItem('access_token');
      
      // 2. Prepare headers with the Key
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 3. Make the request
      const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
      
      // 4. Security Check: If the server says "401 Unauthorized" (Key expired/wrong), kick user out
      if (response.status === 401) {
        localStorage.removeItem('access_token'); // Clear bad key
        setHasEntered(false); // Go back to login screen
        return null;
      }
      
      if (!response.ok) return null;
      
      // Handle empty responses (like from delete actions)
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) return await response.json();
      
      return { success: true };
    } catch (e) { return null; }
  };
  const fmtCurrency = (value) => Number(value || 0).toFixed(2);
  const getUnit = (c) => {
    const cat = (c || '').toLowerCase();
    if (cat.includes('seed')) return 'g';
    if (cat.includes('pesticide') || cat.includes('insecticide')) return 'ml';
    return 'Kg'; 
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const [dash, shop, godown, report, setup, exp, customers] = await Promise.all([
        apiFetch('/api/dashboard/'),
        apiFetch('/api/inventory/'),
        apiFetch('/api/godown/'),
        apiFetch('/api/report/'),
        apiFetch('/api/setup-data/'),
        apiFetch('/api/expenses/'),
        apiFetch('/api/customers/'),
      ]);

      if(shop) setShopInventory(Array.isArray(shop) ? shop : []);
      if(godown) setGodownInventory(Array.isArray(godown) ? godown : []);
      if(report) setReportData(report);
      if(exp) setExpenseList(Array.isArray(exp) ? exp : []); // Ensure exp is array
      if(customers) setAllCustomers(customers);

      if(setup) {
        setCategories(setup.categories || []);
        setVariants(setup.variants || []);
        const fullList = (setup.products || []).map(p => {
          const v = setup.variants.find(v => v.name.startsWith(p.name));
          return { ...p, volume: v ? v.volume : 1.0, size: v ? v.size : '' };
        });
        setProductList(fullList);
      }
    } catch (err) { console.error(err); } 
    finally { setIsRefreshing(false); }
  };

  const fetchAnalysis = async () => {
      let url = '/api/analysis/?';
      if(analysisYear) url += `year=${analysisYear}&`;
      if(analysisMonth) url += `month=${analysisMonth}`;
      const data = await apiFetch(url);
      if(data) setAnalysisData(data);
  };

  useEffect(() => { refreshData(); }, [activeTab]);
  useEffect(() => { if(activeTab === 'analysis') fetchAnalysis(); }, [activeTab, analysisYear, analysisMonth]);
  useEffect(() => {
    if (activeTab === 'stock-management') {
      const intervalId = setInterval(() => { refreshData(); }, 30000);
      return () => clearInterval(intervalId);
    }
  }, [activeTab]);
  useEffect(() => { if (activeTab === 'khata') fetchLoans(); }, [activeTab]);

  const fetchLoans = async () => {
    const data = await apiFetch('/api/loans/');
    setLoans(Array.isArray(data) ? data : []);
  };

  // --- FILTER HELPERS ---
  const filterList = (list, key) => {
      if(!searchTerm) return list;
      return list.filter(item => {
          const val = item[key] ? String(item[key]).toLowerCase() : '';
          return val.includes(searchTerm.toLowerCase());
      });
  };

  // --- POS CUSTOMER & PHONE HANDLING ---
  const handleCustomerNameChange = (e) => {
      const val = e.target.value;
      setCustomerName(val);
      if (val.length > 0) {
          const filtered = allCustomers.filter(c => c.name.toLowerCase().includes(val.toLowerCase()));
          setFilteredCustomers(filtered);
          setShowCustomerSuggestions(true);
      } else {
          setShowCustomerSuggestions(false);
      }
  };

  const handlePhoneInput = (e) => {
      // 1. Remove non-numeric characters
      // 2. Limit to 10 digits
      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
      setCustomerPhone(val);
  };

  const selectCustomer = (c) => {
      setCustomerName(c.name);
      setCustomerPhone(c.phone || '');
      setCustomerAddress(c.address || '');
      setShowCustomerSuggestions(false);
  };

  const handleLoanPayment = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) return alert("Enter valid amount");
    const res = await apiFetch('/api/loan-payment/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loan_id: selectedLoan.id, amount: payAmount, note: payNote || 'Installment' })
    });
    if (res && res.success) {
      alert("Payment Recorded!");
      setPayAmount(''); setPayNote(''); setSelectedLoan(null); fetchLoans();
    } else { alert("Payment Failed"); }
  };

  const handleDeleteCustomerHistory = async (customerId, customerName) => {
    if (!window.confirm(`Delete entire loan history for ${customerName}?`)) return;
    try {
      await apiFetch('/api/delete-customer-loans/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId })
      });
      alert('Loan history deleted successfully');
      setSelectedLoan(null); fetchLoans();
    } catch (err) { alert(`Delete failed: ${err.message || err}`); }
  };

  const handleAddExpense = async () => {
    if(!expenseForm.amount) return alert("Enter Amount");
    try {
        const res = await apiFetch('/api/add-expense/', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expenseForm)
        });
        if(res && res.success) {
            setExpenseForm({ ...expenseForm, amount: '', note: '' });
            refreshData(); // Refresh list after adding
        } else {
            alert("Failed to add expense. Ensure database is connected.");
        }
    } catch (e) {
        alert("Error adding expense. Check your server connection.");
    }
  };

  const handleProductSelect = (e) => {
    const id = e.target.value;
    setSelectedStockId(id);
    const item = shopInventory.find(i => i.id == id);
    if(item) {
        setCurrentItem(item); setCurrentUnit(getUnit(item.category));
        setBillQty(''); setBillTotal('');
    }
  };

  const handleQtyChange = (e) => {
    const qty = e.target.value;
    setBillQty(qty);
    if(currentItem && qty) {
      if (isLoose) {
        const packetWeight = parseFloat(currentItem.packet_weight) || 1;
        const unitDiv = (currentUnit === 'g' || currentUnit === 'ml') ? 1000 : 1;
        const pricePerKg = currentItem.mrp / (packetWeight/unitDiv);
        setBillTotal(((parseFloat(qty)/unitDiv) * pricePerKg).toFixed(2));
      } else {
        setBillTotal((parseFloat(qty) * currentItem.mrp).toFixed(2));
      }
    } else { setBillTotal(''); }
  };

  const addToCart = () => {
    if(!selectedStockId || !billQty || !billTotal) return alert("Invalid Entry");
    const packetWeight = parseFloat(currentItem.packet_weight) || 1;
    let checkQtyDisplay = parseFloat(billQty);
    let checkQtyKg = checkQtyDisplay;
    if (isLoose) {
      if (currentUnit === 'g' || currentUnit === 'ml') checkQtyKg = checkQtyDisplay / 1000.0;
      const availableKg = parseFloat(currentItem.quantity_loose) || 0;
      if (availableKg < checkQtyKg) return alert(`Not enough LOOSE stock! Need to Open a bag.`);
    } else {
      if (currentItem.quantity_sealed < billQty) return alert(`Not enough SEALED stock!`);
    }

    const newItem = {
        stock_id: selectedStockId, product_name: currentItem.product_name, variant: currentItem.variant,
        quantity: parseFloat(billQty), selling_price: (parseFloat(billTotal) / parseFloat(billQty)).toFixed(4),
        total: parseFloat(billTotal), is_loose: isLoose, unit: isLoose ? currentUnit : 'Pkts', packet_weight: packetWeight
    };
    setCart([...cart, newItem]);
    setSelectedStockId(''); setBillQty(''); setBillTotal(''); setIsLoose(false); setCurrentItem(null);
  };

  const checkout = async () => {
    if (isLoanMode) {
        if (!customerName) return alert("Customer Name is required for Loans!");
        if (!customerPhone) return alert("Customer Phone is required for Loans!");
        // STRICT VALIDATION: Must be exactly 10 chars
        if (customerPhone.length !== 10) return alert("Phone number must be exactly 10 digits!");
    }
    
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
          is_loan: true, customer: { phone: customerPhone, name: customerName, address: customerAddress },
          initial_payment: parseFloat(initialPayment) || 0, description: "POS Sale"
        } : null
      };

      const res = await apiFetch('/api/sale/', { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) 
      });

      if (!res || !res.success) throw new Error(res?.error || "Sale Failed");

      const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);
      setLastSale({ 
        items: cart, grandTotal: grandTotal, date: new Date().toLocaleString(),
        isLoan: isLoanMode, customer: isLoanMode ? { name: customerName, phone: customerPhone } : null,
        paidNow: isLoanMode ? (parseFloat(initialPayment) || 0) : grandTotal
      });
      setCart([]); setIsLoanMode(false); setCustomerName(''); setCustomerPhone(''); setInitialPayment('');
      refreshData();
    } catch (err) { alert(`Sale Failed: ${err.message}`); }
  };
  
  async function handleOpenBag(item) {
    const unit = getUnit(item.category);
    const weight = item.packet_weight || 1;
    const qty = prompt(`Opening 1 Sealed Bag.\n\nAdding loose stock (${unit}):`, `${weight} ${unit}`);
    if (!qty) return;
    let kgToSend = parseFloat(qty);
    if (unit === 'g' || unit === 'ml') kgToSend = kgToSend / 1000.0;
    await apiFetch('/api/open-bag/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shop_id: item.id, kg_in_bag: kgToSend }) });
    refreshData();
  }

  const handleTransfer = async (godownId, currentQty) => { 
    const qty = prompt(`Move to SHOP? (Max: ${currentQty})`); 
    if (!qty) return; 
    await apiFetch('/api/transfer/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ godown_id: godownId, quantity: qty }) }); 
    refreshData(); 
  };
   
  const handleReturnToGodown = async (shopId) => { 
    const qty = prompt(`Return to GODOWN?`); 
    if (!qty) return; 
    await apiFetch('/api/transfer-back/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shop_id: shopId, quantity: qty }) }); 
    refreshData(); 
  };
   
  const handleDeleteBatch = async (batchId) => { 
    if (window.confirm("Delete Stock Batch Completely?")) { 
      await apiFetch('/api/delete-batch/', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ batch_id: batchId }) }); 
      refreshData(); 
    }
  };

  const submitProduct = async () => { await apiFetch('/api/add-product/', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(newProd) }); alert("Added!"); refreshData(); };
  const submitStock = async () => { const d = await apiFetch('/api/add-stock/', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(newStock) }); if(d) alert(d.message); refreshData(); };
  const saveProductEdit = async () => { await apiFetch('/api/edit-product/', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(editProd) }); alert("Updated!"); refreshData(); };
  const deleteProduct = async () => { if (!editProd.id) return; if (window.confirm("Delete Product completely?")) { await apiFetch('/api/delete-product/', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: editProd.id }) }); alert("Deleted."); refreshData(); }};

  const menuItems = [
    { id: 'stock-management', label: 'Dashboard', icon: BarChart2 },
    { id: 'analysis', label: 'Analysis', icon: TrendingUp },
    { id: 'shop', label: 'Shop Stock', icon: ShoppingCart },
    { id: 'godown', label: 'Godown Stock', icon: Archive },
    { id: 'billing', label: 'POS Billing', icon: DollarSign },
    { id: 'khata', label: 'Khata Book', icon: BookOpen },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'manage', label: 'Manage Items', icon: Plus },
  ];

// Logic for search bar visibility
  const showSearchBar = ['shop', 'godown', 'khata'].includes(activeTab);

  // --- ADD THIS BLOCK HERE ---
  if (!hasEntered) {
    return <LandingPage onEnter={() => setHasEntered(true)} />;
  }
  // --------------------------

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 ...">
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-emerald-200/30 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2 print:hidden"></div>
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-green-200/30 rounded-full blur-[150px] pointer-events-none translate-x-1/3 translate-y-1/3 print:hidden"></div>

      {/* WRAPPER FOR MAIN APP CONTENT */}
      <div className="flex-1 flex flex-col md:flex-row print:hidden w-full h-full overflow-hidden">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex w-72 sticky top-0 h-screen p-6 border-r border-gray-200 bg-white/80 backdrop-blur-xl flex-col z-40 shadow-sm">
            <div className="flex items-center gap-3 mb-10 px-2">
            <div className="bg-gradient-to-tr from-emerald-500 to-green-600 p-2.5 rounded-xl shadow-[0_4px_10px_rgba(16,185,129,0.3)]">
                <Sprout size={24} className="text-white" />
            </div>
            <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-wide">Raju Agro</h1>
                <p className="text-[10px] text-emerald-600 font-medium tracking-[0.05em] uppercase">Farmer's Trusted Partner</p>
            </div>
            </div>
            <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${activeTab === item.id ? 'bg-gradient-to-r from-emerald-50 to-white border-l-4 border-emerald-500 text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
                <item.icon size={20} className={activeTab === item.id ? 'text-emerald-600' : 'group-hover:text-emerald-500 text-gray-400'} />
                <span className="font-medium">{item.label}</span>
                </button>
            ))}
            </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 scrollbar-hide mb-20 md:mb-0">
            
            {/* TOP BAR */}
            <div className="flex justify-between items-center mb-6 md:mb-10">
                <div className="md:hidden flex items-center gap-2">
                    <div className="bg-emerald-500 p-2 rounded-lg"><Sprout size={20} className="text-white"/></div>
                    <h1 className="font-bold text-lg text-gray-800">Raju Agro</h1>
                </div>

                <div className="hidden md:block">
                    <h2 className="text-3xl font-bold text-gray-900 capitalize">{activeTab === 'stock-management' ? 'Stock Management' : activeTab.replace('-', ' ')}</h2>
                </div>

                {/* GLOBAL SEARCH INPUT (CONDITIONAL) */}
                {showSearchBar && (
                    <div className="relative w-full max-w-[200px] md:max-w-xs animate-fade-in">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors shadow-sm"
                        />
                    </div>
                )}
            </div>

            {/* --- DASHBOARD --- */}
            {activeTab === 'stock-management' && (
            <div className="space-y-6 md:space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard title="Today's Revenue" value={`₹ ${fmtCurrency(reportData.today?.revenue)}`} colorClass="text-emerald-700" />
                <StatCard title="Today's Profit" value={`₹ ${fmtCurrency(reportData.today?.profit)}`} colorClass="text-green-600" />
                <StatCard title="Total Bills" value={reportData.today?.count || 0} colorClass="text-blue-600" />
                <StatCard title="Week Revenue" value={`₹ ${fmtCurrency(reportData.week?.totals?.revenue)}`} colorClass="text-orange-600" />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="flex flex-col h-[300px] md:h-[340px]">
                    <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg text-gray-900">Today's Sales</h3><span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">Live</span></div>
                    <div className="space-y-2 overflow-auto flex-1 pr-2">
                    {(reportData.today?.history || []).length > 0 ? (
                        reportData.today?.history.map(sale => (
                            <div key={sale.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-all">
                                <div><p className="text-sm font-bold text-gray-900">{sale.time}</p><p className="text-xs text-gray-500">{sale.items}</p></div>
                                <span className="text-emerald-600 font-mono font-bold">₹{fmtCurrency(sale.total)}</span>
                            </div>
                        ))
                    ) : <div className="h-full flex items-center justify-center text-gray-400">No Sales Today</div>}
                    </div>
                </GlassCard>

                <GlassCard className="flex flex-col h-[300px] md:h-[340px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2"><Calendar size={18} className="text-emerald-600"/> Last 7 Days</h3>
                    </div>
                    <div className="grid grid-cols-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">
                        <span>Date</span><span className="text-center">Collection</span><span className="text-right">Profit</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {reportData.week?.summary?.map((day, idx) => {
                            const displayDate = day.date ? new Date(day.date).toLocaleDateString() : day.day;
                            return (
                                <div key={idx} className="grid grid-cols-3 items-center p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                                    <span className="font-bold text-gray-700">{displayDate}</span>
                                    <span className="text-center font-mono text-emerald-700 font-bold">₹{fmtCurrency(day.revenue)}</span>
                                    <span className="text-right font-mono text-green-600 font-bold">₹{fmtCurrency(day.profit)}</span>
                                </div>
                            )
                        })}
                    </div>
                </GlassCard>
                </div>
            </div>
            )}

            {/* --- ANALYSIS FEATURE --- */}
            {activeTab === 'analysis' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <button onClick={() => { setAnalysisYear(null); setAnalysisMonth(null); }} className="hover:text-emerald-600 font-bold">All Years</button>
                        {analysisYear && <><ChevronRight size={14} /><button onClick={() => setAnalysisMonth(null)} className="hover:text-emerald-600 font-bold">{analysisYear}</button></>}
                        {analysisMonth && <><ChevronRight size={14} /><span className="text-emerald-600 font-bold">Month {analysisMonth}</span></>}
                    </div>

                    {analysisData && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                            <p className="text-xs text-emerald-600 font-bold uppercase">Total Revenue</p>
                            <p className="text-2xl font-bold text-emerald-800">₹ {analysisData.totals.revenue.toLocaleString()}</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                            <p className="text-xs text-red-600 font-bold uppercase">Total Expenses</p>
                            <p className="text-2xl font-bold text-red-800">₹ {analysisData.totals.expenses.toLocaleString()}</p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <p className="text-xs text-blue-600 font-bold uppercase">Net Income</p>
                            <p className="text-2xl font-bold text-blue-800">₹ {analysisData.totals.net.toLocaleString()}</p>
                        </div>
                    </div>
                    )}

                    {analysisData && (
                        <GlassCard className="min-h-[400px]">
                            <h3 className="font-bold text-lg text-gray-900 mb-4">{analysisData.mode} Performance</h3>
                            <SimpleBarChart 
                                data={analysisData.data} 
                                onBarClick={(item) => {
                                    if(analysisData.mode === 'Yearly') {
                                        setAnalysisYear(new Date(item.date).getFullYear());
                                    } else if(analysisData.mode === 'Monthly') {
                                        setAnalysisMonth(new Date(item.date).getMonth() + 1);
                                    }
                                }}
                            />
                            
                            <div className="mt-8 overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-gray-100 text-gray-500 text-xs uppercase"><th className="p-3 rounded-l-lg">Period</th><th className="p-3">Revenue</th><th className="p-3">Expense</th><th className="p-3 rounded-r-lg text-right">Net</th></tr>
                                    </thead>
                                    <tbody>
                                        {analysisData.data.map((row, i) => (
                                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                                <td className="p-3 font-bold text-gray-700">{row.label}</td>
                                                <td className="p-3 text-emerald-600">₹{row.revenue.toLocaleString()}</td>
                                                <td className="p-3 text-red-500">₹{row.expenses.toLocaleString()}</td>
                                                <td className="p-3 text-right font-bold text-blue-600">₹{row.net.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    )}
                </div>
            )}

            {/* --- INVENTORY LISTS --- */}
            {(activeTab === 'shop' || activeTab === 'godown') && (
            <GlassCard className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                    <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                        <th className="p-4 md:p-5 font-bold">Product</th>
                        <th className="p-4 md:p-5 font-bold">Stock</th>
                        {activeTab === 'shop' ? <th className="p-4 md:p-5 font-bold">MRP</th> : <th className="p-4 md:p-5 font-bold">Expiry</th>}
                        <th className="p-4 md:p-5 font-bold text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                    {filterList(activeTab === 'shop' ? shopInventory : godownInventory.filter(i => i.quantity > 0), 'product_name').map(item => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="p-4 md:p-5">
                            <p className="font-bold text-gray-900 text-base">{item.product_name}</p>
                            <p className="text-xs text-gray-500">{item.batch_no} • {item.variant}</p>
                        </td>
                        <td className="p-4 md:p-5">
                            {activeTab === 'shop' ? (
                            <div className="flex flex-col gap-1">
                                <span className="text-emerald-700 font-bold">{item.quantity_sealed} Sealed</span>
                                <span className="text-orange-600 text-xs">{Number(item.quantity_loose).toFixed(2)} Loose</span>
                            </div>
                            ) : (
                            <span className="text-gray-900 font-bold">{item.quantity} Units</span>
                            )}
                        </td>
                        <td className="p-4 md:p-5 text-gray-700">{activeTab === 'shop' ? `₹ ${item.mrp}` : item.expiry_date}</td>
                        <td className="p-4 md:p-5 text-right space-x-2 opacity-100 flex justify-end items-center">
                            {activeTab === 'shop' ? (
                            <>
                                <ActionButton label="Open" icon={Scissors} variant="blue" onClick={() => handleOpenBag(item)} className="px-2 py-1 text-xs" />
                                <ActionButton label="Back" icon={ArrowLeft} variant="warning" onClick={() => handleReturnToGodown(item.id)} className="px-2 py-1 text-xs" />
                            </>
                            ) : (
                            <ActionButton label="Shop" icon={ArrowRight} variant="primary" onClick={() => handleTransfer(item.id, item.quantity)} className="px-3 py-1 text-xs shadow-none" />
                            )}
                            <button onClick={() => handleDeleteBatch(item.batch_id)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            </GlassCard>
            )}

            {/* --- EXPENSES TAB --- */}
            {activeTab === 'expenses' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <GlassCard className="col-span-1 h-fit">
                    <h3 className="font-bold text-emerald-700 mb-4 flex items-center gap-2"><Plus size={18}/> New Expense</h3>
                    <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 mb-2 block uppercase font-bold">Category</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                {id: 'Transport', icon: Truck, label: 'Transport'},
                                {id: 'Wages', icon: Users, label: 'Wages'},
                                {id: 'Bills', icon: Zap, label: 'Bills'},
                                {id: 'Extra', icon: Layers, label: 'Extra'}
                            ].map(cat => (
                                <button key={cat.id} onClick={() => setExpenseForm({...expenseForm, category: cat.id})} className={`flex items-center justify-center gap-2 p-3 text-xs rounded-xl border transition-all ${expenseForm.category === cat.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                                <cat.icon size={14} /> {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block uppercase font-bold">Amount</label>
                        <Input placeholder="0.00" type="number" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block uppercase font-bold">Note</label>
                        <Input placeholder="Description (e.g. Lorry No.)" value={expenseForm.note} onChange={e => setExpenseForm({...expenseForm, note: e.target.value})} />
                    </div>
                    <ActionButton label="Save Expense" icon={CheckCircle} onClick={handleAddExpense} className="w-full py-3 shadow-none" />
                    </div>
                </GlassCard>
                <GlassCard className="col-span-1 lg:col-span-2 flex flex-col h-[500px]">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                        <div><h3 className="font-bold text-gray-900 text-lg">Recent Expenses</h3></div>
                        <div className="bg-red-50 border border-red-100 px-3 md:px-5 py-2 md:py-3 rounded-xl text-right"><p className="text-[10px] text-red-600 font-bold uppercase tracking-widest mb-1">Total</p><p className="text-xl md:text-2xl font-bold text-red-700 font-mono">₹ {expenseList.reduce((total, item) => total + (parseFloat(item.amount) || 0), 0).toFixed(2)}</p></div>
                    </div>
                    {/* FILTERED LIST */}
                    <div className="flex-1 overflow-y-auto pr-1 md:pr-2 space-y-3">
                    {filterList(expenseList, 'note').map(exp => (
                            <div key={exp.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-white border border-gray-200 text-emerald-600 hidden md:block">{exp.category === 'Transport' && <Truck size={18} />}{exp.category === 'Wages' && <Users size={18} />}</div>
                                    <div className="flex flex-col">
                                        <p className="font-bold text-gray-900 text-sm">{exp.category}</p>
                                        <div className="flex gap-2 text-[10px] md:text-xs text-gray-500 mt-1">
                                            <span>{exp.date}</span>
                                            {exp.note && <span>• {exp.note}</span>}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-red-600 font-bold font-mono">-₹{Number(exp.amount).toFixed(2)}</span>
                            </div>
                    ))}
                    </div>
                </GlassCard>
            </div>
            )}

            {/* --- KHATA BOOK --- */}
            {activeTab === 'khata' && (
                <div className="space-y-6">
                {/* FILTER LOANS BASED ON CUSTOMER NAME */}
                {(!loans || loans.length === 0) && <p className="text-gray-500 text-center py-10">No active loans.</p>}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {loans.filter(l => l.customer.name.toLowerCase().includes(searchTerm.toLowerCase())).map(loan => (
                    <GlassCard key={loan.id} className="border-l-4 border-l-red-500 flex flex-col justify-between min-h-[160px]">
                        <div className="flex justify-between items-start mb-4">
                            <div><h3 className="font-bold text-gray-900 text-lg">{loan.customer?.name}</h3><p className="text-sm text-gray-500">{loan.customer?.phone}</p></div>
                            <div className="text-right"><p className="text-xs text-red-600 font-bold uppercase">Due</p><p className="text-xl font-bold text-red-700">₹{fmtCurrency(loan.outstanding)}</p></div>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-100 gap-2">
                            <ActionButton label="View & Pay" icon={ArrowRight} variant="secondary" onClick={() => setSelectedLoan(loan)} className="flex-1 text-xs" />
                            <ActionButton label="Del" icon={Trash2} variant="danger" onClick={(e) => { e.stopPropagation(); handleDeleteCustomerHistory(loan.customer.id, loan.customer.name); }} className="text-xs px-2" />
                        </div>
                    </GlassCard>
                    ))}
                </div>
                {selectedLoan && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <GlassCard className="w-full max-w-xl h-[85vh] md:h-[80vh] flex flex-col relative border-emerald-500/20 shadow-2xl overflow-hidden">
                        <button onClick={() => setSelectedLoan(null)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 z-50 p-2"><X size={24} /></button>
                        
                        <div className="border-b border-gray-100 pb-4 mb-4 flex justify-between items-center pr-10 shrink-0">
                            <div><h2 className="text-xl font-bold text-gray-900">{selectedLoan.customer?.name}</h2><p className="text-emerald-700 font-mono text-sm">Due: ₹{fmtCurrency(selectedLoan.outstanding)}</p></div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3 mb-4 bg-gray-50 p-3 rounded-xl items-end border border-gray-100 shrink-0">
                            <div className="w-full md:flex-1"><label className="text-[10px] text-gray-500 block mb-1 uppercase">Amount</label><Input placeholder="0.00" type="number" value={payAmount} onChange={e=>setPayAmount(e.target.value)} className="py-2 bg-white" /></div>
                            <div className="w-full md:flex-1"><label className="text-[10px] text-gray-500 block mb-1 uppercase">Note</label><Input placeholder="UPI / Cash" value={payNote} onChange={e=>setPayNote(e.target.value)} className="py-2 bg-white" /></div>
                            <div className="w-full md:w-auto h-10"><ActionButton label="Pay" icon={CheckCircle} onClick={handleLoanPayment} className="h-full w-full md:w-auto px-6 text-sm shadow-none" /></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden min-h-0">
                            <div className="bg-gray-50 rounded-xl p-3 flex flex-col h-full border border-gray-100 overflow-hidden">
                            <h4 className="font-bold text-gray-700 mb-2 text-xs uppercase tracking-wider shrink-0">Purchases</h4>
                            <div className="overflow-y-auto flex-1 pr-1 space-y-2">
                                {selectedLoan.purchase_history?.map((s, i) => (
                                    <div key={i} className="flex flex-col border-b border-gray-200 pb-2 last:border-0">
                                        <div className="flex justify-between text-xs text-gray-700">
                                            <span className="font-bold">{new Date(s.date).toLocaleDateString()}</span>
                                            <span className="text-red-600 font-bold">+₹{s.amount}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">{s.items}</p>
                                    </div>
                                ))}
                            </div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3 flex flex-col h-full border border-gray-100 overflow-hidden">
                            <h4 className="font-bold text-gray-700 mb-2 text-xs uppercase tracking-wider shrink-0">Payments</h4>
                            <div className="overflow-y-auto flex-1 pr-1 space-y-2">
                                {selectedLoan.payments?.map((p, i) => (
                                    <div key={i} className="flex justify-between text-xs py-2 border-b border-gray-200 text-gray-600 last:border-0 items-center">
                                        <div>
                                            <p className="font-bold text-gray-800">{new Date(p.date).toLocaleDateString()}</p>
                                            <p className="text-[10px] text-gray-500">{p.note || 'Installment'}</p>
                                        </div>
                                        <span className="text-emerald-600 font-bold">-₹{p.amount}</span>
                                    </div>
                                ))}
                            </div>
                            </div>
                        </div>
                    </GlassCard>
                    </div>
                )}
                </div>
            )}

            {/* --- POS BILLING (UPDATED) --- */}
            {activeTab === 'billing' && (
                <div className="flex flex-col md:flex-row gap-6 h-auto md:h-[calc(100vh-140px)]">
                   <GlassCard className="w-full md:w-1/2 flex flex-col gap-6 order-1">
                       <div className="flex gap-4 p-1 bg-gray-100 rounded-xl border border-gray-200">
                         <button onClick={() => setIsLoose(false)} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${!isLoose ? 'bg-white text-emerald-700 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}>Sealed</button>
                         <button onClick={() => setIsLoose(true)} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${isLoose ? 'bg-white text-orange-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}>Loose</button>
                       </div>
                       <div className="space-y-4 flex-1">
                          <Select value={selectedStockId} onChange={handleProductSelect}>
                            <option value="">-- Select Item --</option>
                            {/* FILTER PRODUCTS FOR POS ALSO */}
                            {filterList(shopInventory, 'product_name').map(i => <option key={i.id} value={i.id}>{i.product_name} ({i.variant}) - ₹{i.mrp}</option>)}
                          </Select>
                          <div className="grid grid-cols-2 gap-4">
                            <Input type="number" value={billQty} onChange={handleQtyChange} placeholder={`Qty (${isLoose ? currentUnit : 'Pkts'})`} />
                            <Input type="number" value={billTotal} onChange={e => setBillTotal(e.target.value)} placeholder="Total Price" className="font-bold text-emerald-700 bg-emerald-50 border-emerald-200" />
                          </div>
                       </div>
                       <ActionButton onClick={addToCart} label="Add to Cart" icon={ShoppingCart} className="w-full py-4 text-lg shadow-none" />
                   </GlassCard>
                   <GlassCard className="w-full md:w-1/2 flex flex-col relative border-emerald-500/30 order-2 h-[500px] md:h-auto">
                       <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Receipt size={18} /> Current Bill</h3>
                       <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                         {cart.map((item, idx) => (
                           <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                             <div>
                               <p className="text-sm font-bold text-gray-900">{item.product_name}</p>
                               <p className="text-xs text-gray-500">{item.quantity} {item.unit} @ {item.selling_price}</p>
                             </div>
                             <div className="flex items-center gap-4">
                               <span className="font-mono text-emerald-700 font-bold">₹{Number(item.total).toFixed(2)}</span>
                               <button onClick={() => setCart(cart.filter((_,i)=>i!==idx))} className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors"><Trash2 size={14}/></button>
                             </div>
                           </div>
                         ))}
                       </div>
                       <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                         <div className="flex justify-between items-end">
                           <span className="text-gray-500 text-sm">Grand Total</span>
                           <span className="text-3xl font-bold text-gray-900">₹ {cart.reduce((a,b)=>a+b.total,0).toFixed(2)}</span>
                         </div>
                         <div className="flex gap-2 text-xs">
                            <button onClick={()=>setIsLoanMode(false)} className={`flex-1 py-2.5 rounded-xl font-bold border transition-colors ${!isLoanMode ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>CASH</button>
                            <button onClick={()=>setIsLoanMode(true)} className={`flex-1 py-2.5 rounded-xl font-bold border transition-colors ${isLoanMode ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>LOAN</button>
                         </div>
                         {isLoanMode && (
                           <div className="grid grid-cols-2 gap-2 animate-fade-in p-3 bg-red-50 rounded-xl border border-red-100 relative">
                               
                               {/* CUSTOMER AUTOCOMPLETE */}
                               <div className="col-span-2 relative">
                                   <Input 
                                        placeholder="Customer Name" 
                                        value={customerName} 
                                        onChange={handleCustomerNameChange} 
                                        className="bg-white border-red-100" 
                                    />
                                   {showCustomerSuggestions && filteredCustomers.length > 0 && (
                                       <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                                           {filteredCustomers.map(c => (
                                               <div key={c.id} onClick={() => selectCustomer(c)} className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                                                   <p className="font-bold text-sm text-gray-900">{c.name}</p>
                                                   <p className="text-xs text-gray-500">{c.phone}</p>
                                               </div>
                                           ))}
                                       </div>
                                   )}
                               </div>

                               <Input placeholder="Phone (10 digits)" value={customerPhone} onChange={handlePhoneInput} className="bg-white border-red-100" maxLength={10} />
                               <Input placeholder="Initial Pay" value={initialPayment} onChange={e=>setInitialPayment(e.target.value)} type="number" className="bg-white border-red-100" />
                               <Input placeholder="Address" value={customerAddress} onChange={e=>setCustomerAddress(e.target.value)} className="bg-white border-red-100 col-span-2" />
                           </div>
                         )}
                         <ActionButton onClick={checkout} label={isLoanMode ? "Confirm Loan Sale" : "Complete Sale"} variant={isLoanMode ? "danger" : "primary"} className="w-full py-3 shadow-none" disabled={cart.length===0} />
                       </div>
                   </GlassCard>
                </div>
            )}

            {/* --- MANAGE ITEMS --- */}
            {activeTab === 'manage' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                    <GlassCard>
                       <h3 className="font-bold text-orange-600 mb-4">1. Add Category</h3>
                       <div className="flex gap-2">
                         <Input placeholder="Category Name" onChange={(e) => setNewCat(e.target.value)} />
                         <ActionButton label="Add" onClick={async () => {await apiFetch('/api/add-category/', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:newCat})}); alert("Added!"); refreshData();}} variant="warning" />
                       </div>
                   </GlassCard>
                   
                   <GlassCard>
                       <h3 className="font-bold text-blue-600 mb-4">2. Add Product</h3>
                       <div className="space-y-4">
                         <Select onChange={e => setNewProd({...newProd, category_id: e.target.value})}>
                           <option>Select Category</option>
                           {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </Select>
                         <Input placeholder="Product Name" onChange={e => setNewProd({...newProd, name: e.target.value})} />
                         <Input placeholder="Manufacturer" onChange={e => setNewProd({...newProd, manufacturer: e.target.value})} />
                         <div className="grid grid-cols-2 gap-4">
                            <Input placeholder="Size (e.g. 50kg)" onChange={e => setNewProd({...newProd, size: e.target.value})} />
                            <Input placeholder="Num Weight" type="number" onChange={e => setNewProd({...newProd, volume: e.target.value})} />
                         </div>
                         <ActionButton label="Create Product" onClick={submitProduct} variant="blue" className="w-full" />
                       </div>
                   </GlassCard>

                   <GlassCard>
                       <h3 className="font-bold text-emerald-600 mb-4">3. Add Stock</h3>
                       <div className="space-y-4">
                         <Select onChange={e => setNewStock({...newStock, variant_id: e.target.value})}>
                           <option>Select Variant</option>
                           {variants.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                         </Select>
                         <div className="flex gap-4 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="radio" checked={newStock.location==='godown'} onChange={()=>setNewStock({...newStock, location:'godown'})} className="accent-emerald-600" /> Godown</label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="radio" checked={newStock.location==='shop'} onChange={()=>setNewStock({...newStock, location:'shop'})} className="accent-emerald-600" /> Shop Direct</label>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <Input placeholder="Qty" type="number" onChange={e=>setNewStock({...newStock, quantity: e.target.value})} />
                            <Input placeholder="Purchase Price" type="number" onChange={e=>setNewStock({...newStock, purchase_price: e.target.value})} />
                            <Input placeholder="MRP" type="number" onChange={e=>setNewStock({...newStock, mrp: e.target.value})} />
                            <Input type="date" onChange={e=>setNewStock({...newStock, expiry_date: e.target.value})} />
                         </div>
                         <ActionButton label="Add Stock" onClick={submitStock} className="w-full shadow-none" />
                       </div>
                   </GlassCard>

                   <GlassCard>
                       <h3 className="font-bold text-red-600 mb-4">4. Edit / Delete Product</h3>
                       <Select onChange={(e) => { const prod = productList.find(p => p.id == e.target.value); if(prod) setEditProd({ id: prod.id, name: prod.name, manufacturer: prod.manufacturer, volume: prod.volume, size: prod.size }); }}>
                         <option>-- Select Product --</option>
                         {productList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                       </Select>
                       {editProd.id && (
                         <div className="mt-4 space-y-4 animate-fade-in">
                            <Input value={editProd.name} onChange={e => setEditProd({...editProd, name: e.target.value})} />
                            <Input value={editProd.manufacturer} onChange={e => setEditProd({...editProd, manufacturer: e.target.value})} />
                            <div className="flex gap-2">
                              <ActionButton label="Save" onClick={saveProductEdit} variant="blue" className="flex-1" />
                              <ActionButton label="Delete" onClick={deleteProduct} variant="danger" className="flex-1" />
                            </div>
                         </div>
                       )}
                   </GlassCard>
                </div>
            )}
        </main>

        {/* MOBILE BOTTOM NAVIGATION */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50 flex justify-around items-center px-2 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            {menuItems.slice(0, 5).map((item) => (
                <button 
                    key={item.id} 
                    onClick={() => setActiveTab(item.id)}
                    className={`flex flex-col items-center gap-1 ${activeTab === item.id ? 'text-emerald-600 scale-110' : 'text-gray-400'} transition-all`}
                >
                    <item.icon size={20} fill={activeTab === item.id ? "currentColor" : "none"} className={activeTab === item.id ? 'text-emerald-600' : ''} />
                    <span className="text-[9px] font-bold">{item.label.split(' ')[0]}</span>
                </button>
            ))}
            <button onClick={() => setActiveTab('manage')} className={`flex flex-col items-center gap-1 ${['manage', 'expenses'].includes(activeTab) ? 'text-emerald-600' : 'text-gray-400'}`}>
                <Menu size={20} />
                <span className="text-[9px] font-bold">More</span>
            </button>
        </nav>
      </div>

      {/* BILL RECEIPT MODAL (SAME AS BEFORE) */}
      {lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 print:p-0 print:block print:fixed print:inset-0 print:bg-white print:z-[9999]">
            <div className="w-full max-w-md bg-white p-6 shadow-xl border-2 border-gray-200 text-center rounded-xl print:border-0 print:shadow-none print:w-full print:max-w-none my-auto">
              <div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4">
                  <h2 className="text-3xl font-bold text-green-800">Raju Agro</h2>
                  <p className="text-gray-600">Main Road, Tamil Nadu</p>
                  <p className="text-sm text-gray-500 mt-1">Date: {lastSale.date}</p>
                  <p className="font-bold mt-1 text-gray-800">Bill No: {Math.floor(Math.random() * 10000)}</p>
                  {lastSale.isLoan && <div className="border border-red-600 p-2 mt-2 inline-block text-left text-sm bg-red-50 rounded"><p><strong>Customer:</strong> {lastSale.customer.name}</p><p><strong>Phone:</strong> {lastSale.customer.phone}</p><p className="font-bold text-red-600 mt-1">CREDIT BILL</p></div>}
              </div>
              <div className="text-left mb-4 text-sm font-mono text-gray-800">
                  {lastSale.items.map((item, idx) => (
                     <div key={idx} className="flex justify-between border-b border-dashed border-gray-200 py-2">
                        <span>{item.product_name} ({item.quantity} {item.unit} x {item.selling_price})</span>
                        <span className="font-bold">₹ {Number(item.total).toFixed(2)}</span>
                     </div>
                  ))}
              </div>
              <div className="border-t-2 border-dashed border-gray-400 pt-4 mb-6 text-right">
                  <div className="flex justify-between text-xl font-bold text-gray-800"><span>Grand Total:</span><span>₹ {Number(lastSale.grandTotal).toFixed(2)}</span></div>
                  {lastSale.isLoan && (
                    <>
                      <div className="flex justify-between text-sm text-gray-600 mt-1"><span>Paid Now:</span><span>₹ {Number(lastSale.paidNow).toFixed(2)}</span></div>
                      <div className="flex justify-between text-lg font-bold text-red-600 mt-2 border-t pt-2"><span>Due Balance:</span><span>₹ {(Number(lastSale.grandTotal) - Number(lastSale.paidNow)).toFixed(2)}</span></div>
                    </>
                  )}
              </div>
              <div className="flex flex-col md:flex-row gap-4 print:hidden">
                  <button onClick={() => window.print()} className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors">Print</button>
                  <button onClick={() => setLastSale(null)} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors">New Sale</button>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default App;
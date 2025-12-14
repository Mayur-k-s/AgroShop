// frontend/src/pages/Expenses.jsx

import React, { useState, useEffect } from 'react';
// Ensure lucide-react is installed: npm install lucide-react
import { 
  Wallet, Truck, Users, Droplets, Zap, Receipt, 
  Plus, ArrowDownLeft, ArrowUpRight, Search, FileText 
} from 'lucide-react';

const Expenses = () => {
  // --- STATE ---
  const [expenses, setExpenses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  // hydration flag prevents initial empty-state from overwriting saved data
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Form State
  const [category, setCategory] = useState('UTILITY'); // UTILITY, TRANSPORT, LABOR, PERSONAL
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Specific Fields for Load/Transport
  const [companyName, setCompanyName] = useState('');
  const [loadItems, setLoadItems] = useState('');
  const [isRefund, setIsRefund] = useState(false); // If company gives back rent

  // --- DATA LOADING (mock fallback -> localStorage) ---
  useEffect(() => {
    // Try to load saved expenses from localStorage first
    try {
      const saved = localStorage.getItem('agro_expenses_v1');
      if (saved) {
        setExpenses(JSON.parse(saved));
        setIsHydrated(true);
        return;
      }
    } catch (e) {
      console.warn('Failed to load expenses from localStorage', e);
    }

    // Fallback mock data (only used on first run)
    const mockData = [
      { id: 1, date: '2023-12-14', category: 'UTILITY', subType: 'Electricity', amount: 1200, description: 'Shop Current Bill', isRefund: false },
      { id: 2, date: '2023-12-14', category: 'LABOR', subType: 'Daily Wage', amount: 500, description: 'Worker 1 & 2', isRefund: false },
      { id: 3, date: '2023-12-14', category: 'TRANSPORT', subType: 'Load Unloading', amount: 300, description: 'Urea Load - 50 Bags', company: 'Raju Fertilizers', items: 'Urea', isRefund: false },
      { id: 4, date: '2023-12-13', category: 'TRANSPORT', subType: 'Rent Refund', amount: 200, description: 'Company returned transport charge', company: 'Raju Fertilizers', isRefund: true }, // Refund example
    ];
    setExpenses(mockData);
    setIsHydrated(true);
  }, []);

  // Persist changes to localStorage (simple client-side persistence)
  useEffect(() => {
    // Only persist after initial hydration to avoid overwriting saved data
    if (!isHydrated) return;
    try {
      localStorage.setItem('agro_expenses_v1', JSON.stringify(expenses));
    } catch (e) {
      console.warn('Failed to save expenses to localStorage', e);
    }
  }, [expenses, isHydrated]);

  // --- MATH LOGIC ---
  const calculateTotals = () => {
    let totalExp = 0;
    let transportExp = 0;
    let laborExp = 0;
    let personalExp = 0;

    expenses.forEach(exp => {
      const val = parseFloat(exp.amount);
      
      // If it is a refund (Company gave money back), we SUBTRACT from expense
      // If it is a normal expense, we ADD to expense
      const adjustedVal = exp.isRefund ? -val : val;

      totalExp += adjustedVal;

      if (exp.category === 'TRANSPORT') transportExp += adjustedVal;
      if (exp.category === 'LABOR') laborExp += adjustedVal;
      if (exp.category === 'PERSONAL') personalExp += adjustedVal;
    });

    return { totalExp, transportExp, laborExp, personalExp };
  };

  const totals = calculateTotals();

  // --- HANDLERS ---
  const handleSave = () => {
    if (!amount) return alert("Please enter amount");

    const newExpense = {
      id: Date.now(),
      date,
      category,
      amount: parseFloat(amount),
      description: category === 'TRANSPORT' ? `Load from ${companyName}` : description,
      // Store specific details
      company: companyName,
      items: loadItems,
      subType: isRefund ? 'Refund/Return' : category,
      isRefund: isRefund
    };

    setExpenses([newExpense, ...expenses]);
    closeModal();
  };

  const handleDeleteExpense = (id) => {
    if (!window.confirm('Delete this expense? This cannot be undone.')) return;
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Reset Form
    setCategory('UTILITY');
    setAmount('');
    setDescription('');
    setCompanyName('');
    setLoadItems('');
    setIsRefund(false);
  };

  // --- RENDER HELPERS ---
  const getIcon = (cat) => {
    switch (cat) {
      case 'TRANSPORT': return <Truck className="text-blue-600" />;
      case 'LABOR': return <Users className="text-orange-600" />;
      case 'UTILITY': return <Zap className="text-yellow-600" />;
      case 'PERSONAL': return <Wallet className="text-purple-600" />;
      default: return <FileText className="text-gray-600" />;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Receipt className="w-8 h-8 text-gray-700" /> Expenses & Loads
          </h1>
          <p className="text-gray-500">Track bills, daily wages, load charges, and personal spending.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-red-700 transition"
        >
          <Plus className="w-5 h-5" /> Add Expense
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        {/* Total Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-red-600">
          <p className="text-gray-500 text-xs font-bold uppercase">Net Total Expenses</p>
          <h2 className="text-3xl font-bold text-gray-800 mt-2">₹ {totals.totalExp.toLocaleString()}</h2>
        </div>

        {/* Transport Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-blue-500">
          <div className="flex justify-between">
            <p className="text-gray-500 text-xs font-bold uppercase">Load & Transport</p>
            <Truck className="w-5 h-5 text-blue-200" />
          </div>
          <h2 className="text-2xl font-bold text-blue-700 mt-2">₹ {totals.transportExp.toLocaleString()}</h2>
          <p className="text-xs text-gray-400 mt-1">Includes rent & unloading</p>
        </div>

        {/* Labor Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-orange-500">
           <div className="flex justify-between">
            <p className="text-gray-500 text-xs font-bold uppercase">Daily Wages</p>
            <Users className="w-5 h-5 text-orange-200" />
          </div>
          <h2 className="text-2xl font-bold text-orange-700 mt-2">₹ {totals.laborExp.toLocaleString()}</h2>
        </div>

        {/* Personal Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-purple-500">
           <div className="flex justify-between">
            <p className="text-gray-500 text-xs font-bold uppercase">Personal / Extra</p>
            <Wallet className="w-5 h-5 text-purple-200" />
          </div>
          <h2 className="text-2xl font-bold text-purple-700 mt-2">₹ {totals.personalExp.toLocaleString()}</h2>
        </div>
      </div>

      {/* LIST SECTION */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Transaction History
          </h3>
          {/* Simple Filter Buttons */}
          <div className="flex gap-2 text-sm">
             {['ALL', 'TRANSPORT', 'LABOR'].map(type => (
               <button 
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-full font-bold transition ${filterType === type ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
               >
                 {type}
               </button>
             ))}
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-white text-gray-500 font-bold uppercase border-b">
            <tr>
              <th className="p-4">Type</th>
              <th className="p-4">Details / Company</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Amount</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {expenses
              .filter(e => filterType === 'ALL' || e.category === filterType)
              .map((exp) => (
              <tr key={exp.id} className="hover:bg-gray-50 transition">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getIcon(exp.category)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-700">{exp.category}</span>
                      <span className="text-xs text-gray-400">{exp.subType}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <p className="font-bold text-gray-800">{exp.description}</p>
                  {/* Show items if it's a load */}
                  {exp.items && (
                    <p className="text-xs text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded mt-1">
                      📦 Items: {exp.items}
                    </p>
                  )}
                </td>
                <td className="p-4 text-gray-500">{exp.date}</td>
                <td className="p-4 text-right">
                  {exp.isRefund ? (
                    <span className="text-green-600 font-bold flex items-center justify-end gap-1">
                      <ArrowDownLeft className="w-4 h-4" /> - ₹{exp.amount}
                      <span className="text-[10px] bg-green-100 px-1 rounded ml-1">REFUND</span>
                    </span>
                  ) : (
                    <span className="text-red-600 font-bold flex items-center justify-end gap-1">
                      <ArrowUpRight className="w-4 h-4" /> ₹{exp.amount}
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleDeleteExpense(exp.id)}
                    className="text-sm text-red-600 font-semibold hover:underline"
                    aria-label={`Delete expense ${exp.description}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- ADD EXPENSE MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Plus className="w-6 h-6 text-red-600" /> New Expense Entry
            </h2>

            {/* 1. Category Selector */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
              {[
                { id: 'UTILITY', label: 'Bills', icon: Zap },
                { id: 'TRANSPORT', label: 'Load/Rent', icon: Truck },
                { id: 'LABOR', label: 'Wages', icon: Users },
                { id: 'PERSONAL', label: 'Personal', icon: Wallet },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${
                    category === cat.id 
                      ? 'bg-gray-800 text-white border-gray-800' 
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <cat.icon className="w-6 h-6 mb-1" />
                  <span className="text-xs font-bold">{cat.label}</span>
                </button>
              ))}
            </div>

            {/* 2. DYNAMIC INPUTS BASED ON CATEGORY */}
            
            {/* --- TRANSPORT FIELDS --- */}
            {category === 'TRANSPORT' && (
              <div className="bg-blue-50 p-4 rounded-xl mb-4 border border-blue-100">
                <label className="block text-xs font-bold text-blue-800 uppercase mb-2">Load Details</label>
                <input 
                  type="text" 
                  placeholder="Company Name (e.g. Raju Fertilizers)" 
                  className="w-full p-2 border rounded mb-2 text-sm"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="Items Arrived (e.g. 50 Urea, 20 Potash)" 
                  className="w-full p-2 border rounded mb-2 text-sm"
                  value={loadItems}
                  onChange={(e) => setLoadItems(e.target.value)}
                />
                
                {/* REFUND TOGGLE */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-blue-200">
                  <input 
                    type="checkbox" 
                    id="refundCheck"
                    className="w-4 h-4"
                    checked={isRefund}
                    onChange={(e) => setIsRefund(e.target.checked)}
                  />
                  <label htmlFor="refundCheck" className="text-sm font-bold text-blue-900 cursor-pointer">
                    Company returned the Rent? (Refund)
                  </label>
                </div>
              </div>
            )}

            {/* --- UTILITY FIELDS --- */}
            {category === 'UTILITY' && (
              <div className="flex gap-3 mb-4">
                <button onClick={() => setDescription('Electricity Bill')} className="flex-1 py-2 border rounded hover:bg-yellow-50 text-sm">⚡ Current Bill</button>
                <button onClick={() => setDescription('Water Bill')} className="flex-1 py-2 border rounded hover:bg-blue-50 text-sm">💧 Water Bill</button>
              </div>
            )}

            {/* --- COMMON FIELDS --- */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700">Amount (₹)</label>
                <input 
                  type="number" 
                  className="w-full border-2 border-gray-300 p-3 rounded-lg text-lg font-bold outline-none focus:border-red-500"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              {category !== 'TRANSPORT' && category !== 'UTILITY' && (
                <div>
                  <label className="text-sm font-bold text-gray-700">Description / Note</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 p-3 rounded-lg outline-none"
                    placeholder={category === 'LABOR' ? "e.g. Worker 1 & 2 Daily Wage" : "Details..."}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-bold text-gray-700">Date</label>
                <input 
                  type="date" 
                  className="w-full border border-gray-300 p-3 rounded-lg"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3 mt-8">
              <button onClick={closeModal} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 shadow-lg">Save Entry</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Expenses;
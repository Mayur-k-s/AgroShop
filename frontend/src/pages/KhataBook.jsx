// frontend/src/pages/KhataBook.jsx

import React, { useState, useEffect } from 'react';
import { RefreshCcw, Plus, Phone, MapPin, Search, X, ArrowRight } from 'lucide-react'; 
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const KhataBook = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isAddLoanOpen, setIsAddLoanOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Form States
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  // --- 1. THE FIX: DATA PROCESSING FUNCTION ---
  // This function takes the list of loans and MERGES duplicates based on Phone Number
  const processData = (rawData) => {
    const uniqueCustomers = {};

    rawData.forEach((item) => {
      // Use phone number as the unique key (or name if phone is missing)
      // Determine customer details: API returns loans with a nested customer object.
      const customerObj = item.customer || {};
      const key = customerObj.phone || item.customer_phone || customerObj.id || item.customer_id || customerObj.name || item.customer_name || 'unknown';

      if (!uniqueCustomers[key]) {
        // If this is the first time seeing this customer, create their profile
        uniqueCustomers[key] = {
          id: customerObj.id || item.customer_id || item.id,
          name: customerObj.name || item.customer_name || 'Unknown',
          phone: customerObj.phone || item.customer_phone || 'No Phone',
          address: customerObj.address || item.customer_address || '',
          currentBalance: 0,
          transactions: []
        };
      }

      // Add the amount to their total balance
      // We assume the API returns 'amount' or 'due_amount'
      // Try to use outstanding if returned, else use amount or due_amount
      const loanAmount = parseFloat(item.outstanding || item.amount || item.due_amount || 0);
      uniqueCustomers[key].currentBalance += loanAmount;

      // Add this item to their history
      uniqueCustomers[key].transactions.push({
        date: item.created_at || item.date || new Date().toISOString(),
        amount: loanAmount,
        note: item.note || 'Loan',
        type: 'LOAN' // API returns loans and loan payments separate; we treat each loan as LOAN
      });
    });

    // Convert object back to array
    return Object.values(uniqueCustomers);
  };

  // --- 2. FETCH DATA ---
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // KEEP YOUR EXISTING API URL HERE
      const res = await fetch(`${API_BASE}/api/loans/`);
      const rawData = await res.json();
      console.log('LOANS rawData (KhataBook):', rawData);
      
      // We run the grouping logic here
      const mergedData = processData(rawData);
      setCustomers(mergedData);

    } catch (err) {
      console.error("Failed to load data", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // --- 3. ACTIONS ---

  const openAddLoan = (customer) => {
    setSelectedCustomer(customer);
    setAmount('');
    setNote('');
    setIsAddLoanOpen(true);
  };

  const openHistory = (customer) => {
    setSelectedCustomer(customer);
    setIsHistoryOpen(true);
  };

  const handleTransaction = async (type) => {
    if (!amount) return alert("Enter amount");

    // Here you would normally call your backend
    // For now, let's update the UI instantly so you see the change
    const newTxn = {
      date: new Date().toISOString(),
      amount: parseFloat(amount),
      note: note,
      type: type
    };

    // Update Local State (Visual only, until you fix backend save)
    const updatedCustomers = customers.map(c => {
      if (c.phone === selectedCustomer.phone) {
        const newBalance = type === 'LOAN' 
          ? c.currentBalance + parseFloat(amount)
          : c.currentBalance - parseFloat(amount);
        
        return {
          ...c,
          currentBalance: newBalance,
          transactions: [...c.transactions, newTxn]
        };
      }
      return c;
    });

    setCustomers(updatedCustomers);
    setIsAddLoanOpen(false);
    setIsHistoryOpen(false); // Close history if open
    
    // TODO: Add your fetch/axios POST call here to save to database
  };

  // Filter logic
  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone?.includes(searchTerm)
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          📖 Khata Book
        </h1>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={fetchCustomers} className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
            <RefreshCcw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 relative overflow-hidden group">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${customer.currentBalance > 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
            <div className="pl-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 capitalize">{customer.name}</h3>
                  <div className="flex items-center text-gray-500 text-sm mt-1">
                    <Phone className="w-3 h-3 mr-1" /> {customer.phone}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">DUE</p>
                  <p className="text-2xl font-bold text-red-600">₹{customer.currentBalance}</p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <button 
                  onClick={() => openAddLoan(customer)}
                  className="flex-1 bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm font-bold border border-red-100 hover:bg-red-100 flex justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
                <button 
                  onClick={() => openHistory(customer)}
                  className="text-blue-600 text-sm font-semibold flex items-center hover:underline px-2"
                >
                  View History <ArrowRight className="w-4 h-4 ml-1" />
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm(`Delete all history for ${customer.name}?`)) return;
                    try {
                      const resp = await fetch(`${API_BASE}/api/delete-customer-loans/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ customer_id: customer.id })
                      });
                      const resData = await resp.json();
                      if (!resp.ok) throw new Error(resData.error || 'Failed');
                      alert('Deleted history successfully');
                      fetchCustomers();
                    } catch (err) {
                      alert(`Delete failed: ${err.message}`);
                    }
                  }}
                  className="text-red-600 text-sm font-semibold flex items-center hover:underline px-2"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD LOAN MODAL */}
      {isAddLoanOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4">Add Loan for {selectedCustomer.name}</h2>
            <input 
              type="number" 
              className="w-full border p-3 rounded-lg mb-4 text-lg font-bold"
              placeholder="Amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            <input 
              type="text" 
              className="w-full border p-3 rounded-lg mb-6"
              placeholder="Note"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setIsAddLoanOpen(false)} className="flex-1 py-3 text-gray-500 bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={() => handleTransaction('LOAN')} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {isHistoryOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col">
            <div className="bg-gray-900 text-white p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold">{selectedCustomer.name}'s Ledger</h2>
              <button onClick={() => setIsHistoryOpen(false)}><X /></button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-0">
              <table className="w-full text-left">
                <thead className="bg-gray-100 text-gray-500 text-xs uppercase sticky top-0">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Note</th>
                    <th className="p-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCustomer.transactions.map((txn, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-4 text-sm text-gray-500">{new Date(txn.date).toLocaleDateString()}</td>
                      <td className="p-4 font-medium">{txn.note}</td>
                      <td className={`p-4 text-right font-bold ${txn.type === 'PAYMENT' ? 'text-green-600' : 'text-red-600'}`}>
                        {txn.type === 'PAYMENT' ? '-' : '+'} ₹{txn.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-2">
               <input 
                  type="number" 
                  placeholder="Payment Amount" 
                  className="w-full border p-2 rounded"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
               <button onClick={() => handleTransaction('PAYMENT')} className="bg-green-600 text-white px-6 py-2 rounded font-bold">
                 Pay
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default KhataBook;
// src/components/HistoryModal.jsx
import React from 'react';

const HistoryModal = ({ isOpen, onClose, customer }) => {
  if (!isOpen || !customer) return null;

  // Helper to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      
      {/* Modal Container */}
      <div className="bg-white w-full max-w-2xl h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* 1. Header Section */}
        <div className="bg-gray-800 p-4 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{customer.name}</h2>
            <p className="text-sm text-gray-400">{customer.phone}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        {/* 2. Balance Summary Banner */}
        <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
          <span className="text-gray-600 font-medium">Net Balance Due:</span>
          <span className="text-2xl font-bold text-red-600">₹ {customer.currentBalance}</span>
        </div>

        {/* 3. The Ledger Table (Scrollable) */}
        <div className="flex-grow overflow-y-auto p-4">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 border-b">Date</th>
                <th className="px-4 py-3 border-b">Description</th>
                <th className="px-4 py-3 border-b text-red-600 text-right">You Gave<br/>(Debit)</th>
                <th className="px-4 py-3 border-b text-green-600 text-right">You Got<br/>(Credit)</th>
              </tr>
            </thead>
            <tbody>
              {customer.transactions && customer.transactions.length > 0 ? (
                customer.transactions.slice().reverse().map((txn, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{formatDate(txn.date)}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{txn.note || '-'}</td>
                    
                    {/* Logic to show amount in correct column */}
                    <td className="px-4 py-3 text-right font-bold text-red-600 bg-red-50">
                      {txn.type === 'LOAN' ? `₹ ${txn.amount}` : ''}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600 bg-green-50">
                      {txn.type === 'PAYMENT' ? `₹ ${txn.amount}` : ''}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Footer Actions */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 border rounded-lg hover:bg-gray-100"
          >
            Close
          </button>
          
          {/* We can add a "Take Payment" button here later */}
          <button className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md">
            Receive Payment
          </button>
        </div>

      </div>
    </div>
  );
};

export default HistoryModal;
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Book, Receipt, Sprout } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  // Helper to make active link shine
  const getLinkClass = (path) => {
    const active = location.pathname === path;
    return `flex items-center gap-3 p-4 rounded-xl transition-all duration-300 ${
      active 
        ? 'bg-white/20 border border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.3)] backdrop-blur-md' 
        : 'text-gray-400 hover:text-white hover:bg-white/10'
    }`;
  };

  return (
    <div className="w-72 h-screen sticky top-0 p-5 border-r border-white/10 bg-black/20 backdrop-blur-xl flex flex-col">
      
      {/* Logo Area */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="bg-gradient-to-tr from-green-400 to-emerald-600 p-2 rounded-lg shadow-lg shadow-green-900/50">
          <Sprout size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Raju Agro</h1>
          <p className="text-xs text-emerald-300 font-medium tracking-wider">PREMIUM STORE</p>
        </div>
      </div>
      
      {/* Menu */}
      <nav className="space-y-3 flex-1">
        <Link to="/" className={getLinkClass('/')}>
          <LayoutDashboard size={20} /> Dashboard
        </Link>
        <Link to="/shop-stock" className={getLinkClass('/shop-stock')}>
          <ShoppingCart size={20} /> Shop Stock
        </Link>
        <Link to="/khata-book" className={getLinkClass('/khata-book')}>
          <Book size={20} /> Khata Book
        </Link>
        <Link to="/expenses" className={getLinkClass('/expenses')}>
          <Receipt size={20} /> Expenses
        </Link>
      </nav>

      {/* Footer */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-white/10">
        <p className="text-xs text-emerald-200">System Status</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          <span className="text-xs font-bold text-white">Online</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
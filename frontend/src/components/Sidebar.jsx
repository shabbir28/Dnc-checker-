import { NavLink } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import logo from '../assets/logo.png';

const Sidebar = () => {
  return (
    <div className="w-72 bg-white border-r border-slate-200 flex flex-col justify-between z-20 shadow-sm relative">
      <div className="px-8 pt-4 pb-8">
        <div className="relative w-full h-20 overflow-hidden flex items-center mb-10">
          <img src={logo} alt="DNC Checker Logo" className="absolute w-full h-auto top-1/2 -translate-y-1/2" />
        </div>
        <nav className="flex flex-col gap-2">
          <NavLink 
            to="/dashboard" 
            className={({isActive}) => `flex items-center px-4 py-3 rounded-xl transition-all duration-300 text-sm font-bold ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
          </NavLink>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;

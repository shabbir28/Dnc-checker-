import { NavLink } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import logo from '../assets/logo.png';

const Sidebar = () => {
  return (
    <div className="w-[260px] bg-slate-50 border-r border-slate-200 flex flex-col justify-between z-20 h-screen font-sans">
      <div className="px-6 pt-8 pb-8">
        <div className="mb-10 px-1 flex items-center h-8">
          <img src={logo} alt="DNC Checker Logo" className="max-w-[85%] h-auto object-contain" />
        </div>
        
        <div className="mb-2">
          <p className="px-3 text-xs font-semibold text-slate-500 mb-3 tracking-wider">NAVIGATION</p>
          <nav className="flex flex-col gap-1">
            <NavLink 
              to="/dashboard" 
              className={({isActive}) => `flex items-center px-3 py-2.5 text-sm font-semibold transition-colors ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/50 rounded-md' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600 rounded-md border border-transparent'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mr-3" strokeWidth={2.5} />
              Data Scrubber
            </NavLink>
          </nav>
        </div>
      </div>
      
      <div className="p-4 border-t border-slate-200 bg-slate-50">
         <div className="flex items-center gap-3 px-2 py-2">
           <div className="flex items-center justify-center">
             <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-50 relative">
               <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75"></span>
             </span>
           </div>
           <div>
             <p className="text-xs text-slate-900 font-bold">System Normal</p>
             <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Production Env</p>
           </div>
         </div>
      </div>
    </div>
  );
};

export default Sidebar;

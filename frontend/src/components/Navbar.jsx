import { Bell } from 'lucide-react';
import logo from '../assets/logo.png';

const Navbar = () => {
  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 h-16 flex items-center px-6 md:px-10 justify-between sticky top-0 z-50 w-full shadow-sm">
      <div className="flex items-center">
        <div className="relative w-40 h-10 overflow-hidden flex items-center">
          <img src={logo} alt="DNC Checker Logo" className="absolute w-full h-auto top-1/2 -translate-y-1/2" />
        </div>
      </div>
      <div className="flex items-center space-x-6">
        <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 rounded-full shadow-inner border border-slate-100">
          <Bell className="w-4 h-4" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import { Toaster } from 'react-hot-toast';

const toastOptions = {
  duration: 5000,
  style: {
    borderRadius: '12px',
    fontWeight: 600,
    padding: '14px 18px',
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.18)',
    zIndex: 99999,
  },
  success: {
    style: {
      background: '#10b981',
      color: '#ffffff',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#10b981',
    },
  },
  error: {
    style: {
      background: '#ef4444',
      color: '#ffffff',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#ef4444',
    },
  },
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/30 flex flex-col">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none -z-10"></div>
        <Navbar />
        <Toaster
          position="top-right"
          containerStyle={{ top: 72, zIndex: 99999 }}
          toastOptions={toastOptions}
        />
        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full relative z-0">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

import { useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../config/api';
import { Search, CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  // Setup State
  
  // Searching State
  const [searchPhone, setSearchPhone] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchPhone) return;
    setSearchError('');
    setSearchResult(null);
    setLoadingSearch(true);
    try {
      const response = await axios.post(apiUrl('/api/search'), { 
        phone: searchPhone
      });
      setSearchResult(response.data);
      toast.success('Search Completed!');
    } catch (err) {
      console.error(err);
      setSearchError('Search failed.');
      toast.error('Search failed.');
    } finally {
      setLoadingSearch(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto pb-4 pt-2 font-sans animate-in fade-in duration-500 overflow-x-hidden md:overflow-x-visible">
      
      {/* Header Area */}
      <div className="mb-4 px-4 relative z-10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 border border-white/20 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-600">Data Scrubber</h1>
        </div>
        <p className="text-slate-500 font-medium text-xs ml-11">Verify the DNC status of a single phone number.</p>
      </div>

      <div className="flex flex-col gap-4 px-2 relative z-10">
        
        {/* Single Lookup Box */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-[1.5rem] p-6 shadow-[0_4px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-indigo-100/40 to-purple-100/40 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shadow-inner border border-indigo-100/50">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Single Lookup</h2>
              <p className="text-slate-500 text-[11px]">Enter a phone number to check its DNC status and log it to your CRM.</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="relative z-10 flex flex-col gap-4 max-w-2xl">
            <div className="flex flex-col gap-4">
              <div className="w-full md:w-1/2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">Phone Number</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full bg-slate-50/50 border border-slate-200/80 rounded-lg px-3 py-2.5 text-slate-800 placeholder:text-slate-400 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-[13px] transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            {searchError && <p className="text-rose-500 text-[10px] font-bold mt-1 flex items-center bg-rose-50 p-1.5 rounded-md w-fit"><AlertTriangle className="w-3 h-3 mr-1"/> {searchError}</p>}

            <button 
              type="submit"
              disabled={loadingSearch || !searchPhone}
              className={`mt-2 w-full md:w-auto self-start px-8 py-2.5 rounded-lg font-bold text-[13px] transition-all duration-300 flex items-center justify-center relative overflow-hidden ${
                !searchPhone 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_4px_14px_rgb(99,102,241,0.3)] hover:-translate-y-0.5 border border-indigo-500'
              }`}
            >
              {loadingSearch ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span> : <Search className="w-4 h-4 mr-2" />}
              {loadingSearch ? 'Checking...' : 'Check Number'}
            </button>
          </form>
          
          {searchResult && (
            <div className="mt-8 pt-6 border-t border-slate-100 animate-in fade-in duration-300 relative z-10 max-w-2xl">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">Result</h3>
              
              <div className={`border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden ${
                searchResult.status === 'DNC' ? 'bg-rose-50 border-rose-100' : 
                searchResult.status === 'Clean' ? 'bg-emerald-50 border-emerald-100' : 
                'bg-orange-50 border-orange-100'
              }`}>
                 <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-inner border relative z-10 ${
                       searchResult.status === 'DNC' ? 'bg-rose-100/50 text-rose-500 border-rose-200' : 
                       searchResult.status === 'Clean' ? 'bg-emerald-100/50 text-emerald-500 border-emerald-200' : 
                       'bg-orange-100/50 text-orange-500 border-orange-200'
                   }`}>
                     {searchResult.status === 'DNC' ? <AlertTriangle className="w-6 h-6"/> : searchResult.status === 'Clean' ? <CheckCircle2 className="w-6 h-6"/> : <XCircle className="w-6 h-6"/>}
                   </div>
                   <div className="relative z-10">
                     <p className={`text-xl font-black flex items-center mb-0.5 ${
                       searchResult.status === 'DNC' ? 'text-rose-600' : 
                       searchResult.status === 'Clean' ? 'text-emerald-600' : 
                       'text-orange-600'
                     }`}>
                        {searchResult.status === 'DNC' ? 'DNC Matched' : searchResult.status === 'Clean' ? 'Clean Number' : 'Invalid Number'}
                     </p>
                     <p className={`text-[12px] font-medium ${
                       searchResult.status === 'DNC' ? 'text-rose-500' : 
                       searchResult.status === 'Clean' ? 'text-emerald-500' : 
                       'text-orange-500'
                     }`}>
                       {searchResult.phone}
                       {searchResult.lineType && <span className="ml-3 px-2.5 py-1 rounded-full bg-white/60 text-xs font-bold border border-current opacity-90 shadow-sm">{searchResult.lineType}</span>}
                     </p>
                   </div>
                 </div>

                 {searchResult.status !== 'Invalid' && (
                   <div className="relative z-10">
                     {searchResult.crmSynced === true ? (
                       <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100/50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                         <CheckCircle2 className="w-3.5 h-3.5" />
                         CRM Synced
                       </span>
                     ) : (
                       <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100/50 text-orange-700 text-[11px] font-bold border border-orange-200">
                         <AlertTriangle className="w-3.5 h-3.5" />
                         CRM Sync Failed
                       </span>
                     )}
                   </div>
                 )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

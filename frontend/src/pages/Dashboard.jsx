import { useState, useRef } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { UploadCloud, Search, CheckCircle2, Download, AlertTriangle, XCircle, FileText, ChevronDown, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

const campaigns = [
  'Medicare', 'ACA', 'FE', 'Home Improvement', 'Solar', 'Hospital Indemnity'
];

const Dashboard = () => {
  // Scrubbing State
  const [selectedCampaign, setSelectedCampaign] = useState(campaigns[0]);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [loadingScrub, setLoadingScrub] = useState(false);
  const [scrubResult, setScrubResult] = useState(null);
  const [scrubError, setScrubError] = useState('');
  const fileInputRef = useRef(null);

  // Searching State
  const [searchPhone, setSearchPhone] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setScrubError('');
      setScrubResult(null);

      Papa.parse(selectedFile, {
        header: false,
        preview: 4,
        skipEmptyLines: true,
        complete: function(results) {
          setPreviewData(results.data);
        }
      });
    }
  };

  const handleStartScrub = async () => {
    if (!file) {
      setScrubError('Please select a file.');
      return;
    }
    setLoadingScrub(true);
    setScrubError('');
    setScrubResult(null);
    const formData = new FormData();
    formData.append('campaign', selectedCampaign);
    formData.append('file', file);
    try {
      const response = await axios.post('http://localhost:5000/api/check', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setScrubResult(response.data);
      toast.success('DNC Scrubbing Completed Successfully!', {
        duration: 5000,
        style: {
          borderRadius: '16px',
          background: '#10b981',
          color: '#fff',
          fontWeight: 'bold'
        },
      });
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Scrubbing failed.';
      setScrubError(errMsg);
      toast.error(errMsg, { style: { borderRadius: '16px', fontWeight: 'bold' } });
    } finally {
      setLoadingScrub(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchPhone) return;
    setSearchError('');
    setSearchResult(null);
    setLoadingSearch(true);
    try {
      const response = await axios.post('http://localhost:5000/api/search', { phone: searchPhone });
      setSearchResult(response.data);
      toast.success('Search Completed!', {
        style: { borderRadius: '16px', fontWeight: 'bold' }
      });
    } catch (err) {
      console.error(err);
      setSearchError('Search failed.');
      toast.error('Search failed.', { style: { borderRadius: '16px', fontWeight: 'bold' } });
    } finally {
      setLoadingSearch(false);
    }
  };

  const downloadCSV = (data, filename) => {
    const csv = Papa.unparse({ fields: ["Phone Number"], data: data.map(num => [num]) });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-12 animate-in fade-in duration-700">
      
      {/* Header Area */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Workspace</h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">Manage, scrub and verify your lead files instantly.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Bento Box: Bulk Scrubbing */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          
          <div className="flex items-center gap-4 mb-10 relative z-10">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm border border-indigo-100">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800">Bulk Verification</h2>
              <p className="text-slate-500 font-semibold text-sm">Upload a list to run against the DNC registry</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col md:flex-row gap-8 relative z-10">
            {/* Left Col: Setup */}
            <div className="flex-1 space-y-6 flex flex-col">
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex-1">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Target Campaign</label>
                <div className="relative">
                  <select 
                    value={selectedCampaign}
                    onChange={(e) => setSelectedCampaign(e.target.value)}
                    className="w-full appearance-none bg-white border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 cursor-pointer shadow-sm text-lg"
                  >
                    {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Action Button */}
              <div>
                {scrubError && <p className="text-rose-500 text-sm font-bold mb-3 flex items-center"><AlertTriangle className="w-4 h-4 mr-1.5"/> {scrubError}</p>}
                <button 
                  onClick={handleStartScrub}
                  disabled={loadingScrub || !file}
                  className={`w-full py-5 rounded-2xl font-black text-lg transition-all duration-300 flex items-center justify-center shadow-lg ${
                    !file 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1 active:scale-95 shadow-indigo-600/30'
                  }`}
                >
                  {loadingScrub ? <span className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin mr-3"></span> : <CheckCircle2 className="w-6 h-6 mr-3" />}
                  {loadingScrub ? 'Processing...' : 'Start DNC'}
                </button>
              </div>
            </div>

            {/* Right Col: Dropzone */}
            <div className="flex-1 flex flex-col">
              {!file ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-indigo-200/60 rounded-3xl bg-indigo-50/30 hover:bg-indigo-50 transition-all cursor-pointer p-8 group min-h-[250px]"
                >
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm text-indigo-500 mb-4 group-hover:scale-110 group-hover:-translate-y-1 transition-transform border border-indigo-50">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <p className="text-slate-800 font-bold text-center">Click or Drag file here</p>
                  <p className="text-slate-500 text-sm mt-1 text-center font-medium">CSV, XLSX up to 50MB</p>
                  <input ref={fileInputRef} type="file" accept=".csv, .xlsx, .txt" onChange={handleFileChange} className="hidden" />
                </div>
              ) : (
                <div className="flex-1 flex flex-col border border-slate-200 rounded-3xl bg-white overflow-hidden shadow-sm h-full max-h-[300px]">
                  <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center overflow-hidden">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mr-4 shrink-0">
                        <FileText className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-slate-800 font-bold truncate text-sm">{file.name}</p>
                        <p className="text-indigo-600 font-bold text-[10px] uppercase tracking-wider mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button onClick={() => {setFile(null); setPreviewData([])}} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full shrink-0 ml-2">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                  {previewData.length > 0 && (
                    <div className="p-4 flex-1 bg-white overflow-x-auto overflow-y-auto">
                      <table className="w-full text-left text-xs text-slate-600">
                        <tbody>
                          {previewData.map((row, i) => (
                            <tr key={i} className="border-b last:border-0 border-slate-100">
                              {row.map((cell, j) => (
                                <td key={j} className={`py-2 pr-3 whitespace-nowrap ${j === 0 ? 'font-mono text-slate-800 font-bold' : ''}`}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Bento Box: Single Lookup */}
        <div className="lg:col-span-1 bg-slate-900 rounded-[2.5rem] p-8 sm:p-10 text-white relative overflow-hidden flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/20 to-blue-600/20 pointer-events-none"></div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex-1">
            <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 mb-8 shadow-inner">
              <Search className="w-7 h-7" />
            </div>
            <h2 className="text-3xl font-black mb-2">Single Lookup</h2>
            <p className="text-indigo-200 font-medium text-sm mb-10">Instantly verify the DNC status of any single phone number.</p>

            <form onSubmit={handleSearch} className="space-y-4">
              <input 
                type="text" 
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder="(555) 000-0000"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white placeholder:text-slate-500 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400 text-xl shadow-inner"
              />
              <button 
                type="submit"
                disabled={loadingSearch}
                className="w-full bg-white text-slate-900 hover:bg-indigo-50 font-black py-5 rounded-2xl transition-all flex items-center justify-center text-lg active:scale-95 shadow-lg shadow-white/10"
              >
                {loadingSearch ? <span className="w-5 h-5 border-3 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></span> : 'Search Number'}
              </button>
            </form>

            {searchError && <p className="text-rose-400 font-bold mt-4 text-sm bg-rose-400/10 px-4 py-3 rounded-xl border border-rose-400/20"><AlertTriangle className="w-4 h-4 inline mr-1"/> {searchError}</p>}
            
            {searchResult && (
              <div className="mt-8 animate-in slide-in-from-bottom-4 duration-300">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex items-center justify-between">
                   <div>
                     <p className="text-xs text-indigo-200 font-bold uppercase tracking-wider mb-1">Status Result</p>
                     <p className={`text-3xl font-black flex items-center ${searchResult.status === 'DNC' ? 'text-rose-400' : searchResult.status === 'Clean' ? 'text-emerald-400' : 'text-orange-400'}`}>
                        {searchResult.status}
                     </p>
                   </div>
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border border-white/5 ${searchResult.status === 'DNC' ? 'bg-rose-500/20 text-rose-400' : searchResult.status === 'Clean' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                     {searchResult.status === 'DNC' ? <AlertTriangle className="w-7 h-7"/> : searchResult.status === 'Clean' ? <CheckCircle2 className="w-7 h-7"/> : <XCircle className="w-7 h-7"/>}
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Results Bento Box */}
      {scrubResult && (
        <div className="mt-8 bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 animate-in slide-in-from-bottom-8 duration-700 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pl-4">
            <div className="flex items-center gap-5">
               <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm">
                 <CheckCircle2 className="w-8 h-8" />
               </div>
               <div>
                 <h3 className="text-3xl font-black text-slate-800">Results Ready</h3>
                 <p className="text-slate-500 font-semibold mt-1">Your list has been successfully verified.</p>
               </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => downloadCSV(scrubResult.cleanNumbers, `Clean_${file?.name}`)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 hover:-translate-y-1 flex items-center text-lg">
                <Download className="w-5 h-5 mr-2" /> Clean ({scrubResult.clean.toLocaleString()})
              </button>
              <button onClick={() => downloadCSV(scrubResult.matchedNumbers, `Matched_${file?.name}`)} className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-rose-600/20 hover:-translate-y-1 flex items-center text-lg">
                <Download className="w-5 h-5 mr-2" /> DNC ({scrubResult.matched.toLocaleString()})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-5 pl-4">
             {[
               { label: 'Total Scanned', value: scrubResult.totalRows, color: 'text-slate-800', bg: 'bg-slate-50' },
               { label: 'Clean', value: scrubResult.clean, color: 'text-emerald-600', bg: 'bg-emerald-50' },
               { label: 'DNC Matched', value: scrubResult.matched, color: 'text-rose-600', bg: 'bg-rose-50' },
               { label: 'Invalid Format', value: scrubResult.invalid, color: 'text-slate-600', bg: 'bg-slate-50' },
               { label: 'Duplicates', value: scrubResult.duplicates, color: 'text-orange-500', bg: 'bg-orange-50' }
             ].map((stat, idx) => (
               <div key={idx} className={`${stat.bg} rounded-3xl p-6 border border-slate-100/60 hover:shadow-md transition-shadow`}>
                 <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{stat.label}</p>
                 <p className={`text-4xl font-black ${stat.color}`}>{stat.value.toLocaleString()}</p>
               </div>
             ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;

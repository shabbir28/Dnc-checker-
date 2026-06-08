import { useState, useRef } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { UploadCloud, Search, CheckCircle2, Download, AlertTriangle, XCircle, FileText, ChevronDown, Layers, Rocket, ShieldCheck } from 'lucide-react';
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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Searching State
  const [searchPhone, setSearchPhone] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || e.dataTransfer?.files?.[0];
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

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e);
  };

  const clearFile = () => {
    setFile(null);
    setPreviewData([]);
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
        style: { borderRadius: '12px', background: '#10b981', color: '#fff', fontWeight: 'bold' },
      });
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Scrubbing failed.';
      setScrubError(errMsg);
      toast.error(errMsg, { style: { borderRadius: '12px', fontWeight: 'bold' } });
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
        style: { borderRadius: '12px', fontWeight: 'bold' }
      });
    } catch (err) {
      console.error(err);
      setSearchError('Search failed.');
      toast.error('Search failed.', { style: { borderRadius: '12px', fontWeight: 'bold' } });
    } finally {
      setLoadingSearch(false);
    }
  };

  const downloadCSV = (dataRows, filename) => {
    const csv = Papa.unparse(dataRows);
    const baseName = filename.includes('.') ? filename.substring(0, filename.lastIndexOf('.')) : filename;
    const finalFilename = `${baseName}.csv`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <p className="text-slate-500 font-medium text-xs ml-11">Upload your data file to start scrubbing</p>
      </div>

      <div className="flex flex-col gap-4 px-2 relative z-10">
        
        {/* Main Box: Bulk Scrubbing */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-[1.5rem] p-5 shadow-[0_4px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-indigo-100/40 to-purple-100/40 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110 pointer-events-none"></div>
          
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shadow-inner border border-indigo-100/50 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Bulk Verification</h2>
              <p className="text-slate-500 text-[11px]">Upload a list to run against the DNC registry</p>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 relative z-10">
            {/* Left Col: Setup */}
            <div className="lg:col-span-5 space-y-3 flex flex-col justify-between min-w-0">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">Target Campaign</label>
                <div className="relative group/select">
                  <select 
                    value={selectedCampaign}
                    onChange={(e) => setSelectedCampaign(e.target.value)}
                    className="w-full appearance-none bg-slate-50/50 border border-slate-200/80 rounded-lg px-3 py-2.5 text-slate-800 font-semibold text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 cursor-pointer transition-all shadow-sm group-hover/select:border-indigo-300"
                  >
                    {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Action Button */}
              <div>
                {scrubError && <p className="text-rose-500 text-[10px] font-bold mb-1.5 flex items-center bg-rose-50 p-1.5 rounded-md"><AlertTriangle className="w-3 h-3 mr-1"/> {scrubError}</p>}
                <button 
                  onClick={handleStartScrub}
                  disabled={loadingScrub || !file}
                  className={`w-full py-2.5 rounded-lg font-bold text-[13px] transition-all duration-300 flex items-center justify-center relative overflow-hidden group/btn ${
                    !file 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200' 
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_4px_14px_rgb(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgb(99,102,241,0.4)] hover:-translate-y-0.5 border border-indigo-500'
                  }`}
                >
                  {file && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out"></div>}
                  <span className="relative z-10 flex items-center">
                    {loadingScrub ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span> : <Rocket className="w-4 h-4 mr-2" />}
                    {loadingScrub ? 'Processing Verification...' : 'Start Scrubbing'}
                  </span>
                </button>
              </div>
            </div>

            {/* Right Col: Dropzone */}
            <div className="lg:col-span-7 flex flex-col h-full min-w-0">
              {!file ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-4 transition-all cursor-pointer h-full min-h-[100px] group/drop ${
                    isDragging 
                      ? 'border-indigo-400 bg-indigo-50/50 shadow-inner' 
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-1.5 transition-colors ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover/drop:bg-indigo-50 group-hover/drop:text-indigo-500'}`}>
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <p className="text-[13px] font-bold text-slate-700">Upload CSV Document</p>
                  <p className="text-[10px] text-slate-400">Drag & drop or click</p>
                  <input ref={fileInputRef} type="file" accept=".csv, .xlsx, .txt" onChange={handleFileChange} className="hidden" />
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl bg-slate-50/50 h-full flex flex-col overflow-hidden shadow-sm">
                  <div className="p-2 border-b border-slate-200 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                    <div className="flex items-center min-w-0">
                      <div className="w-6 h-6 rounded flex items-center justify-center text-indigo-600 mr-2 flex-shrink-0">
                        <FileText className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 truncate">
                        <p className="text-[11px] font-bold text-slate-800 truncate">{file.name}</p>
                        <p className="text-[8px] font-medium text-slate-500 uppercase tracking-wide">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button onClick={clearFile} className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors ml-1">
                      <XCircle className="w-3 h-3" />
                    </button>
                  </div>
                  {previewData.length > 0 && (
                    <div className="p-2 flex-1 bg-white overflow-x-auto overflow-y-auto max-h-[120px]">
                      <table className="w-full text-left text-[10px] text-slate-600">
                        <tbody>
                          {previewData.map((row, i) => (
                            <tr key={i} className="border-b last:border-0 border-slate-50 hover:bg-slate-50/80 transition-colors">
                              {row.map((cell, j) => (
                                <td key={j} className={`py-1 px-2 whitespace-nowrap ${j === 0 ? 'font-mono text-slate-800 font-bold' : ''}`}>{cell}</td>
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
        <div className="bg-[#0B1120] rounded-[1.5rem] p-5 text-white relative overflow-hidden flex flex-col shadow-xl shadow-slate-900/10 border border-slate-800">
          <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-indigo-500/20 rounded-full blur-[40px] pointer-events-none -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-[150px] h-[150px] bg-purple-500/20 rounded-full blur-[40px] pointer-events-none -ml-10 -mb-10"></div>
          
          <div className="relative z-10 flex-1 flex flex-col lg:flex-row gap-4 lg:items-center">
            <div className="flex-1 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 text-indigo-300 rounded-lg flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-inner">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-0 tracking-tight text-white">Single Lookup</h2>
                <p className="text-slate-400 font-medium text-[11px] leading-tight max-w-xs">Verify the DNC status of any single phone number.</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full h-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-slate-600 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50 text-[13px] backdrop-blur-sm transition-all shadow-inner"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={loadingSearch}
                  className="sm:w-auto px-4 bg-white text-slate-900 hover:bg-slate-100 font-bold py-2 rounded-lg transition-all flex items-center justify-center text-[13px] shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-[0.98] whitespace-nowrap"
                >
                  {loadingSearch ? <span className="w-3 h-3 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></span> : 'Search'}
                </button>
              </form>

              {searchError && <p className="text-rose-400 font-bold mt-3 text-[10px] bg-rose-400/10 px-3 py-2 rounded-lg border border-rose-400/20 flex items-center"><AlertTriangle className="w-3 h-3 mr-1.5"/> {searchError}</p>}
              
              {searchResult && (
                <div className="mt-3 animate-in slide-in-from-bottom-4 duration-300">
                  <div className={`backdrop-blur-md border rounded-lg p-3 flex items-center justify-between relative overflow-hidden ${
                    searchResult.status === 'DNC' ? 'bg-rose-500/10 border-rose-500/20' : 
                    searchResult.status === 'Clean' ? 'bg-emerald-500/10 border-emerald-500/20' : 
                    'bg-orange-500/10 border-orange-500/20'
                  }`}>
                     <div className="relative z-10">
                       <p className={`text-[7px] font-black uppercase tracking-widest mb-0.5 ${
                         searchResult.status === 'DNC' ? 'text-rose-400/80' : 
                         searchResult.status === 'Clean' ? 'text-emerald-400/80' : 
                         'text-orange-400/80'
                       }`}>Result Status</p>
                       <p className={`text-base font-black flex items-center ${
                         searchResult.status === 'DNC' ? 'text-rose-400' : 
                         searchResult.status === 'Clean' ? 'text-emerald-400' : 
                         'text-orange-400'
                       }`}>
                          {searchResult.status}
                       </p>
                     </div>
                     <div className={`w-8 h-8 rounded-md flex items-center justify-center shadow-inner border relative z-10 ${
                         searchResult.status === 'DNC' ? 'bg-rose-500/20 text-rose-400 border-rose-500/20' : 
                         searchResult.status === 'Clean' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 
                         'bg-orange-500/20 text-orange-400 border-orange-500/20'
                     }`}>
                       {searchResult.status === 'DNC' ? <AlertTriangle className="w-4 h-4"/> : searchResult.status === 'Clean' ? <CheckCircle2 className="w-4 h-4"/> : <XCircle className="w-4 h-4"/>}
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Scrub Result Area */}
      {scrubResult && (
        <div className="mt-6 mx-2 bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_4px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 animate-in slide-in-from-bottom-8 duration-500 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-400 to-emerald-600"></div>
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-50 rounded-full blur-[60px] pointer-events-none -mr-32 -mt-32"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border-2 border-emerald-100 flex items-center justify-center shadow-inner relative">
                <CheckCircle2 className="w-6 h-6" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Scrub Complete</h3>
                <p className="text-slate-500 text-xs mt-0.5">Your list has been verified and is ready for export.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => downloadCSV(scrubResult.cleanRows, `Clean_${file?.name}`)} className="bg-white border-2 border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center text-xs">
                <Download className="w-4 h-4 mr-1.5 text-emerald-500" /> Clean ({scrubResult.clean.toLocaleString()})
              </button>
              <button onClick={() => downloadCSV(scrubResult.matchedRows, `Matched_${file?.name}`)} className="bg-white border-2 border-rose-100 hover:border-rose-200 hover:bg-rose-50 text-rose-700 font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center text-xs">
                <Download className="w-4 h-4 mr-1.5 text-rose-500" /> DNC ({scrubResult.matched.toLocaleString()})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 relative z-10">
            {[
              { label: 'Total Scanned', value: scrubResult.totalRows, color: 'text-slate-900', bg: 'bg-slate-50', border: 'border-slate-100' },
              { label: 'Clean Numbers', value: scrubResult.clean, color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100' },
              { label: 'DNC Matched', value: scrubResult.matched, color: 'text-rose-600', bg: 'bg-rose-50/50', border: 'border-rose-100' },
              { label: 'Invalid Format', value: scrubResult.invalid, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100' },
              { label: 'Duplicates', value: scrubResult.duplicates, color: 'text-orange-600', bg: 'bg-orange-50/50', border: 'border-orange-100' }
            ].map((stat, i) => (
              <div key={i} className={`${stat.bg} border ${stat.border} rounded-xl p-4 transition-all hover:scale-[1.02] hover:shadow-sm`}>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{stat.label}</p>
                <p className={`text-2xl lg:text-3xl font-black ${stat.color}`}>{stat.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;

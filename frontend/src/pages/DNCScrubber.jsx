import { useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { apiUrl } from '../config/api';
import { Upload, FileText, CheckCircle, AlertTriangle, Download, Trash2, XCircle, Copy } from 'lucide-react';

const campaigns = [
  'Medicare',
  'ACA',
  'FE',
  'Home Improvement',
  'Solar',
  'Hospital Indemnity'
];

const DNCScrubber = () => {
  const [selectedCampaign, setSelectedCampaign] = useState(campaigns[0]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setResult(null);
  };

  const handleStartScrub = async () => {
    if (!file) {
      setError('Please upload a file first.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('campaign', selectedCampaign);
    formData.append('file', file);

    try {
      const response = await axios.post(apiUrl('/api/check'), formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'An error occurred during scrubbing.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const csv = Papa.unparse(data);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadFullReport = () => {
    if (!result || !result.fullReport) return;
    
    const csv = Papa.unparse(result.fullReport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'Full_Report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Start DNC Checking</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form Side */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Campaign</label>
              <select 
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {campaigns.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload File (CSV, XLSX, TXT)</label>
              
              {!file ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    accept=".csv, .xlsx, .txt"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">Click or drag file to upload</p>
                    <p className="text-xs text-gray-500">Maximum file size 50MB</p>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center overflow-hidden">
                    <FileText className="w-8 h-8 text-blue-500 mr-3 flex-shrink-0" />
                    <div className="truncate">
                      <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleRemoveFile}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
            
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button 
              onClick={handleStartScrub}
              disabled={loading || !file}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center shadow-sm"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Processing...
                </>
              ) : (
                'Start DNC Check'
              )}
            </button>
          </div>

          {/* Results Side */}
          {result && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-gray-500 text-sm font-medium mb-1">Total Rows</span>
                  <span className="text-2xl font-bold text-gray-800">{result.totalRows.toLocaleString()}</span>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-blue-600 text-sm font-medium mb-1 flex items-center"><Copy className="w-4 h-4 mr-1"/> Duplicates</span>
                  <span className="text-2xl font-bold text-blue-700">{result.duplicates.toLocaleString()}</span>
                </div>
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-red-600 text-sm font-medium mb-1 flex items-center"><AlertTriangle className="w-4 h-4 mr-1"/> Matched / DNC</span>
                  <span className="text-2xl font-bold text-red-700">{result.matched.toLocaleString()}</span>
                </div>
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-green-600 text-sm font-medium mb-1 flex items-center"><CheckCircle className="w-4 h-4 mr-1"/> Clean</span>
                  <span className="text-2xl font-bold text-green-700">{result.clean.toLocaleString()}</span>
                </div>
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex flex-col items-center justify-center text-center col-span-2">
                  <span className="text-orange-600 text-sm font-medium mb-1 flex items-center"><XCircle className="w-4 h-4 mr-1"/> Invalid Numbers</span>
                  <span className="text-2xl font-bold text-orange-700">{result.invalid.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Download Reports</h3>
                
                <button 
                  onClick={() => downloadCSV(result.cleanRows, 'Clean_Numbers.csv')}
                  className="w-full bg-white border border-green-200 hover:bg-green-50 text-green-700 font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-between group"
                >
                  <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-2" /> Download Clean File</span>
                  <Download className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>
                
                <button 
                  onClick={() => downloadCSV(result.matchedRows, 'DNC_Matched.csv')}
                  className="w-full bg-white border border-red-200 hover:bg-red-50 text-red-700 font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-between group"
                >
                  <span className="flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> Download Matched File</span>
                  <Download className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>
                
                <button 
                  onClick={downloadFullReport}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center"><FileText className="w-4 h-4 mr-2" /> Download Full Report</span>
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DNCScrubber;

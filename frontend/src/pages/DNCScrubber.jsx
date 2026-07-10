import { useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../config/api';
import { CheckCircle, AlertTriangle, Phone, XCircle } from 'lucide-react';

const DNCScrubber = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleStartScrub = async () => {
    if (!phone) {
      setError('Please enter a phone number first.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post(apiUrl('/api/search'), {
        phone: phone
      });
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'An error occurred during scrubbing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Start Single Phone DNC Check</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form Side */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Enter Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                  className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
            
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button 
              onClick={handleStartScrub}
              disabled={loading || !phone}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center shadow-sm"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Checking...
                </>
              ) : (
                'Check Number'
              )}
            </button>
          </div>

          {/* Results Side */}
          {result && (
            <div className="space-y-6">
              <div className="h-full flex flex-col justify-center space-y-6">
                {result.status === "Invalid" ? (
                  <div className="bg-orange-50 border border-orange-100 p-6 rounded-xl flex flex-col items-center justify-center text-center">
                    <XCircle className="w-12 h-12 text-orange-500 mb-2" />
                    <span className="text-xl font-bold text-orange-700">Invalid Number</span>
                    <span className="text-orange-600 mt-1">{result.phone} could not be validated.</span>
                  </div>
                ) : result.status === "DNC" ? (
                  <div className="bg-red-50 border border-red-100 p-6 rounded-xl flex flex-col items-center justify-center text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mb-2" />
                    <span className="text-xl font-bold text-red-700">DNC Matched</span>
                    <span className="text-red-600 mt-1">{result.phone} is on the Do Not Call list.</span>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-100 p-6 rounded-xl flex flex-col items-center justify-center text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                    <span className="text-xl font-bold text-green-700">Clean Number</span>
                    <span className="text-green-600 mt-1">{result.phone} is safe to call.</span>
                  </div>
                )}

                {/* CRM Sync Status Banner */}
                {result.status !== "Invalid" && (
                  <>
                    {result.crmSynced === true && (
                      <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        {result.crmSyncMessage || "Result synced with CRM successfully."}
                      </div>
                    )}
                    {result.crmSynced === false && (
                      <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm font-medium">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        {result.crmSyncMessage || "Check completed, but CRM sync failed."}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DNCScrubber;

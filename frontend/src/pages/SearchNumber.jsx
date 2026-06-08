import { useState } from 'react';
import axios from 'axios';
import { Search, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const SearchNumber = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!phone) {
      setError('Please enter a phone number.');
      return;
    }
    
    setError('');
    setResult(null);
    setLoading(true);

    try {
      // Pointing to our backend
      const response = await axios.post('http://localhost:5000/api/search', { phone });
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to search number. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Search Phone Number</h2>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enter Phone Number</label>
            <div className="flex space-x-3">
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 555-5555"
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
              <button 
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors flex items-center disabled:opacity-70"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" /> Search
                  </>
                )}
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>

        {result && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Search Result</h3>
            
            {result.status === 'DNC' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
                <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
                <div>
                  <p className="text-red-800 font-semibold text-lg">DNC (Do Not Call)</p>
                  <p className="text-red-600 text-sm">Number: {result.phone}</p>
                </div>
              </div>
            )}
            
            {result.status === 'Clean' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                <div>
                  <p className="text-green-800 font-semibold text-lg">Clean (Safe to Call)</p>
                  <p className="text-green-600 text-sm">Number: {result.phone}</p>
                </div>
              </div>
            )}

            {result.status === 'Invalid' && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center">
                <XCircle className="w-6 h-6 text-orange-500 mr-3" />
                <div>
                  <p className="text-orange-800 font-semibold text-lg">Invalid Number</p>
                  <p className="text-orange-600 text-sm">Number: {result.phone}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchNumber;

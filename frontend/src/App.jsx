import { useState } from 'react';
import './App.css';
import toast, { Toaster } from 'react-hot-toast';

import PasswordScreen from './components/PasswordScreen';
import TripForm from './components/TripForm';
import ItineraryDisplay from './components/ItineraryDisplay';

// Use VITE_API_BASE_URL for API calls
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (tripData) => {
    setLoading(true);
    setResult(null);
    
    toast.success('Planning your trip... This may take a few moments.', {
      duration: 3000,
    });
    
    try {
      const endpoint = tripData.routePreference === 'No' ? '/plan_relaxed_trip' : '/plan_trip';
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip: tripData }),
      });
      const data = await res.json();

      if (!data.feasible) {
        toast.error('Route not feasible: ' + data.answer);
        setResult(data.answer);
        setLoading(false);
        return;
      }

      // Poll for job status
      const jobId = data.job_id;
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_BASE_URL}/job_status/${jobId}`);
          const statusData = await statusRes.json();
          if (statusData.status === "completed") {
            clearInterval(pollInterval);
            toast.success('Trip itinerary generated successfully!');
            setResult(statusData.result.answer);
            setLoading(false);
          } else if (statusData.status === "error") {
            clearInterval(pollInterval);
            toast.error('Error generating itinerary: ' + statusData.result);
            setResult('Error: ' + statusData.result);
            setLoading(false);
          }
        } catch (pollErr) {
          clearInterval(pollInterval);
          toast.error('Connection error while generating itinerary');
          setResult('Error polling status: ' + pollErr.message);
          setLoading(false);
        }
      }, 2000);
    } catch (err) {
      toast.error('Failed to start trip planning: ' + err.message);
      setResult('Error: ' + err.message);
      setLoading(false);
    }
  };

  if (!authenticated) {
    return <PasswordScreen onSuccess={() => setAuthenticated(true)} apiBaseUrl={API_BASE_URL} />;
  }

  return (
    <div className="max-w-4xl mx-auto my-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col min-h-[80vh]">
      <h1 className="text-center mb-6 text-2xl font-bold text-gray-900 dark:text-white">🗺️ Trip Planning Assistant</h1>

      <TripForm onSubmit={handleFormSubmit} loading={loading} />

      {result && <ItineraryDisplay content={result} />}
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            theme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

export default App;


import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const TripForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    duration: '',
    drivingHoursPerDay: '',
    routePreference: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Custom validation with toast messages
    if (!formData.from.trim()) {
      toast.error('Please enter a starting location');
      return;
    }
    
    if (!formData.to.trim()) {
      toast.error('Please enter a destination');
      return;
    }
    
    if (!formData.duration || formData.duration < 1) {
      toast.error('Please enter a valid trip duration (at least 1 day)');
      return;
    }
    
    if (!formData.drivingHoursPerDay || formData.drivingHoursPerDay < 1 || formData.drivingHoursPerDay > 12) {
      toast.error('Please enter driving hours per day (1-12 hours)');
      return;
    }
    
    if (!formData.routePreference) {
      toast.error('Please select your route preference');
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="from" className="block mb-1 font-semibold text-gray-900 dark:text-white">
          Starting Location:
        </label>
        <input
          type="text"
          id="from"
          name="from"
          value={formData.from}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., New York, NY"
        />
      </div>

      <div>
        <label htmlFor="to" className="block mb-1 font-semibold text-gray-900 dark:text-white">
          Destination:
        </label>
        <input
          type="text"
          id="to"
          name="to"
          value={formData.to}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Los Angeles, CA"
        />
      </div>

      <div>
        <label htmlFor="duration" className="block mb-1 font-semibold text-gray-900 dark:text-white">
          Trip Duration (days):
        </label>
        <input
          type="number"
          id="duration"
          name="duration"
          value={formData.duration}
          onChange={handleChange}
          min="1"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="drivingHoursPerDay" className="block mb-1 font-semibold text-gray-900 dark:text-white">
          Driving Hours Per Day:
        </label>
        <input
          type="number"
          id="drivingHoursPerDay"
          name="drivingHoursPerDay"
          value={formData.drivingHoursPerDay}
          onChange={handleChange}
          min="1"
          max="12"
          step="0.5"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block mb-3 font-semibold text-gray-900 dark:text-white">
          Are you in a hurry to reach your destination?
        </label>
        <div className="flex gap-3">
          <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
            formData.routePreference === 'Yes'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
          }`}>
            <input
              type="radio"
              name="routePreference"
              value="Yes"
              checked={formData.routePreference === 'Yes'}
              onChange={handleChange}
              className="sr-only"
            />
            <span className="font-medium">Yes, I'm in a hurry</span>
          </label>
          <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
            formData.routePreference === 'No'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
          }`}>
            <input
              type="radio"
              name="routePreference"
              value="No"
              checked={formData.routePreference === 'No'}
              onChange={handleChange}
              className="sr-only"
            />
            <span className="font-medium">No, I can take my time</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`px-6 py-3 rounded-md font-medium transition-colors ${
          loading
            ? 'bg-gray-400 cursor-not-allowed text-gray-700'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? 'Planning Trip...' : 'Plan My Trip'}
      </button>
      
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
            duration: 4000,
            theme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </form>
  );
};

export default TripForm;
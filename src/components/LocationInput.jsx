import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const LocationInput = ({ refreshOnboardingStatus }) => {
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    console.log('LocationInput: Saving city and completing onboarding');

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { error: updateError } = await supabase
        .from('users')
        .update({ city, onboarding_completed: true })
        .eq('id', user.id);

      if (updateError) {
        console.error('LocationInput: Error updating user data:', updateError.message);
        if (updateError.message.includes('onboarding_completed')) {
          setError('Failed to save location: Database schema issue (onboarding_completed column missing). Please contact support.');
        } else {
          setError('Failed to save location: ' + updateError.message);
        }
        return;
      }

      await refreshOnboardingStatus();
      navigate('/dashboard');
    } catch (err) {
      console.error('LocationInput: Error:', err.message);
      setError('An unexpected error occurred: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Enter Your Location</h2>
        {error && (
          <p className="text-red-500 text-center mb-4">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter your city"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save and Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default LocationInput;
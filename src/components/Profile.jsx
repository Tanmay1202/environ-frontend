import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // Added AnimatePresence for mobile sidebar animations
import { FaSun, FaMoon, FaBars, FaTimes, FaLeaf, FaUserCircle, FaCity, FaEnvelope, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { supabase } from '../supabase';
import toast, { Toaster } from 'react-hot-toast'; // Added for better user feedback

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({ fullName: '', email: '', city: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Added for loading state during form submission
  const navigate = useNavigate();

  // Check for dark mode preference on mount
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
  }, []);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/');
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .select('full_name, email, city')
          .eq('id', user.id)
          .single();

        if (error) {
          setError('Failed to fetch user data: ' + error.message);
          toast.error('Failed to load profile data.');
          return;
        }

        setUserData(data);
        setFormData({
          fullName: data.full_name || '',
          email: data.email || user.email || '', // Fallback to auth email
          city: data.city || '',
        });
      } catch (err) {
        setError('An unexpected error occurred: ' + err.message);
        toast.error('An unexpected error occurred while fetching profile data.');
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updates = {
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        city: formData.city.trim(),
      };

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        setError('Failed to update profile: ' + error.message);
        toast.error('Failed to update profile.');
        return;
      }

      setSuccess('Profile updated successfully!');
      toast.success('Profile updated successfully!');
      setUserData(updates); // Update local state to reflect changes
    } catch (err) {
      setError('An unexpected error occurred: ' + err.message);
      toast.error('An unexpected error occurred while updating your profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully!');
      navigate('/');
    } catch (err) {
      toast.error('Failed to sign out: ' + err.message);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 to-gray-100'} flex flex-col`}>
      <Toaster position="bottom-right" /> {/* Added Toaster for toast notifications */}
      
      {/* Header */}
      <header className={`flex justify-between items-center p-4 md:p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-teal-500 to-blue-500'} shadow-lg`}>
        <div className="flex items-center space-x-4">
          <button onClick={toggleSidebar} className="md:hidden text-white focus:outline-none" aria-label="Toggle Sidebar">
            {isSidebarOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
          </button>
          <motion.div
            className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} p-2 rounded-full shadow-md`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaLeaf className={`h-6 w-6 ${isDarkMode ? 'text-teal-300' : 'text-teal-500'}`} />
          </motion.div>
          <h1 className="text-xl md:text-2xl font-bold text-white">EnviRon</h1>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/dashboard" className="text-white hover:text-gray-200 transition-colors">
            Dashboard
          </Link>
          <Link to="/classify" className="text-white hover:text-gray-200 transition-colors">
            Classify Waste
          </Link>
          <Link to="/community" className="text-white hover:text-gray-200 transition-colors">
            Community
          </Link>
          <motion.button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700 text-yellow-300' : 'bg-white text-gray-800'}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <FaSun /> : <FaMoon />}
          </motion.button>
          <motion.button
            onClick={handleSignOut}
            className="px-4 py-2 text-white font-medium rounded-full bg-red-500 hover:bg-red-600 transition-colors shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Sign Out"
          >
            Sign Out
          </motion.button>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            className={`md:hidden fixed inset-y-0 left-0 w-64 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg z-50 p-6`}
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Menu</h2>
              <button onClick={toggleSidebar} className={`${isDarkMode ? 'text-white' : 'text-gray-800'} focus:outline-none`} aria-label="Close Sidebar">
                <FaTimes className="h-6 w-6" />
              </button>
            </div>
            <nav className="space-y-4">
              <Link
                to="/dashboard"
                onClick={toggleSidebar}
                className={`block text-lg ${isDarkMode ? 'text-gray-200 hover:text-teal-300' : 'text-gray-800 hover:text-teal-500'} transition-colors`}
              >
                Dashboard
              </Link>
              <Link
                to="/classify"
                onClick={toggleSidebar}
                className={`block text-lg ${isDarkMode ? 'text-gray-200 hover:text-teal-300' : 'text-gray-800 hover:text-teal-500'} transition-colors`}
              >
                Classify Waste
              </Link>
              <Link
                to="/community"
                onClick={toggleSidebar}
                className={`block text-lg ${isDarkMode ? 'text-gray-200 hover:text-teal-300' : 'text-gray-800 hover:text-teal-500'} transition-colors`}
              >
                Community
              </Link>
              <button
                onClick={() => {
                  toggleDarkMode();
                  toggleSidebar();
                }}
                className={`flex items-center space-x-2 text-lg ${isDarkMode ? 'text-gray-200 hover:text-teal-300' : 'text-gray-800 hover:text-teal-500'} transition-colors`}
              >
                {isDarkMode ? <FaSun /> : <FaMoon />}
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button
                onClick={() => {
                  handleSignOut();
                  toggleSidebar();
                }}
                className="flex items-center space-x-2 text-lg text-red-500 hover:text-red-600 transition-colors"
              >
                <span>Sign Out</span>
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          className={`w-full max-w-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-8 border relative overflow-hidden`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Subtle Inner Glow Effect */}
          <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(45,212,191,0.3)] rounded-2xl pointer-events-none" />

          {/* Profile Header with Avatar */}
          <div className="flex flex-col items-center mb-6">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <FaUserCircle className={`h-20 w-20 ${isDarkMode ? 'text-teal-300' : 'text-teal-500'}`} />
              <div className={`absolute inset-0 rounded-full shadow-[0_0_15px_rgba(45,212,191,0.5)] opacity-50`} />
            </motion.div>
            <h2 className={`text-2xl md:text-3xl font-bold text-center mt-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Your Profile
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              Update your details below
            </p>
          </div>

          {/* Toast Notifications */}
          {error && (
            <motion.div
              className="flex items-center space-x-2 text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-300 p-3 rounded-lg mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FaExclamationCircle className="h-5 w-5" />
              <p>{error}</p>
            </motion.div>
          )}
          {success && (
            <motion.div
              className="flex items-center space-x-2 text-green-500 bg-green-100 dark:bg-green-900 dark:text-green-300 p-3 rounded-lg mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FaCheckCircle className="h-5 w-5" />
              <p>{success}</p>
            </motion.div>
          )}

          {/* Profile Form */}
          {userData ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name Field */}
              <div className="space-y-2">
                <label htmlFor="fullName" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} flex items-center space-x-2`}>
                  <FaUserCircle className="h-4 w-4" />
                  <span>Full Name</span>
                </label>
                <motion.input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-gray-100 border-gray-300 text-gray-800 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all`}
                  placeholder="Enter your full name"
                  whileFocus={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  required
                  aria-required="true"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} flex items-center space-x-2`}>
                  <FaEnvelope className="h-4 w-4" />
                  <span>Email</span>
                </label>
                <motion.input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-gray-100 border-gray-300 text-gray-800 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all opacity-50 cursor-not-allowed`}
                  disabled
                  aria-disabled="true"
                  whileFocus={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                />
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Email cannot be changed.
                </p>
              </div>

              {/* City Field */}
              <div className="space-y-2">
                <label htmlFor="city" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} flex items-center space-x-2`}>
                  <FaCity className="h-4 w-4" />
                  <span>City (for Weather)</span>
                </label>
                <motion.input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-gray-100 border-gray-300 text-gray-800 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all`}
                  placeholder="e.g., London"
                  whileFocus={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                />
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                className={`w-full py-3 rounded-lg font-semibold text-white ${isDarkMode ? 'bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700' : 'bg-gradient-to-r from-teal-400 to-blue-400 hover:from-teal-500 hover:to-blue-500'} transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-teal-500 focus:outline-none`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isLoading}
                aria-label="Update Profile"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Updating...</span>
                  </span>
                ) : (
                  'Update Profile'
                )}
              </motion.button>
            </form>
          ) : (
            <div className="flex justify-center items-center h-40">
              <svg className={`animate-spin h-8 w-8 ${isDarkMode ? 'text-teal-300' : 'text-teal-500'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
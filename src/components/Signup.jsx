import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaSun, FaMoon, FaBars, FaTimes, FaLeaf } from 'react-icons/fa';
import { supabase } from '../supabase';

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) navigate('/welcome');
    };
    checkUser();
  }, [navigate]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      const userId = data.user.id;
      const { error: insertError } = await supabase.from('users').insert({
        id: userId,
        full_name: fullName,
        email,
        points: 0,
        level: 1,
        badges: [],
        city: null,
        onboarding_completed: false, // Ensure this field is set
      });
      if (insertError) throw insertError;

      navigate('/welcome');
    } catch (err) {
      setError('Signup failed: ' + err.message);
    }
  };

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-l from-blue-300 to-teal-300'}`}>
      <header className={`flex justify-between items-center p-3 shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-l from-blue-400 to-teal-400'}`}>
        <div className="flex items-center space-x-3">
          <button onClick={toggleSidebar} className="md:hidden text-white focus:outline-none">
            {isSidebarOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
          </button>
          <motion.div
            className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} p-2 rounded-full shadow-md`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaLeaf className={`h-6 w-6 ${isDarkMode ? 'text-teal-300' : 'text-teal-500'}`} />
          </motion.div>
          <h1 className="text-lg font-bold text-white">EnviRon</h1>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/" className="text-white hover:text-gray-200 transition-colors">
            Login
          </Link>
          <motion.button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700 text-yellow-300' : 'bg-white text-gray-800'}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isDarkMode ? <FaSun /> : <FaMoon />}
          </motion.button>
        </div>
      </header>

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
            <button onClick={toggleSidebar} className={`${isDarkMode ? 'text-white' : 'text-gray-800'} focus:outline-none`}>
              <FaTimes className="h-6 w-6" />
            </button>
          </div>
          <nav className="space-y-4">
            <Link
              to="/"
              onClick={toggleSidebar}
              className={`block text-lg ${isDarkMode ? 'text-gray-200 hover:text-teal-300' : 'text-gray-800 hover:text-teal-500'}`}
            >
              Login
            </Link>
            <button
              onClick={toggleDarkMode}
              className={`flex items-center space-x-2 text-lg ${isDarkMode ? 'text-gray-200 hover:text-teal-300' : 'text-gray-800 hover:text-teal-500'}`}
            >
              {isDarkMode ? <FaSun /> : <FaMoon />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </nav>
        </motion.div>
      )}

      <main className="flex-1 flex items-center justify-center px-4 -mt-4">
        <motion.div
          className={`w-[360px] ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className={`text-2xl font-bold text-center mb-1 ${isDarkMode ? 'text-white' : 'bg-gradient-to-l from-blue-400 to-teal-400 bg-clip-text text-transparent'}`}>
            Create Account
          </h2>
          <p className={`text-center mb-6 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Join EnviRon to start your journey
          </p>
          {error && (
            <motion.p
              className="text-red-500 text-center mb-4 p-2 bg-red-100 rounded-lg text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.p>
          )}
          <form onSubmit={handleSignup} className="flex flex-col space-y-4">
            <div className="space-y-1.5">
              <label className={`block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                  </svg>
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className={`w-full pl-9 pr-4 py-1.5 border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-200 text-gray-600'} rounded-md focus:outline-none focus:border-blue-400 text-sm`}
                  placeholder="Enter your full name"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={`block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full pl-9 pr-4 py-1.5 border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-200 text-gray-600'} rounded-md focus:outline-none focus:border-blue-400 text-sm`}
                  placeholder="Enter your email"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={`block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                  </svg>
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full pl-9 pr-4 py-1.5 border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-200 text-gray-600'} rounded-md focus:outline-none focus:border-blue-400 text-sm`}
                  placeholder="Create a password"
                />
              </div>
            </div>
            <motion.button
              type="submit"
              className={`w-full py-2 text-white font-medium rounded-md text-sm mt-2 ${isDarkMode ? 'bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700' : 'bg-gradient-to-l from-blue-400 to-teal-400 hover:opacity-90'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Create Account
            </motion.button>
          </form>
          <p className={`text-center mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Already have an account?{' '}
            <Link to="/" className={`${isDarkMode ? 'text-teal-300 hover:text-teal-400' : 'text-blue-500 hover:text-blue-600'} font-medium`}>
              Sign in
            </Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default Signup;
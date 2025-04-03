import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaMedal, FaStar, FaLeaf, FaSun, FaMoon, FaRecycle, FaTrash, FaTree, FaComment, FaBars, FaTimes, FaCloud, FaMapMarkerAlt } from 'react-icons/fa';
import Confetti from 'react-confetti';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import Modal from 'react-modal';
import { supabase } from '../supabase';
import Sidebar from './Sidebar';

Modal.setAppElement('#root');

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [fullLeaderboard, setFullLeaderboard] = useState([]);
  const [classificationHistory, setClassificationHistory] = useState([]);
  const [leaderboardError, setLeaderboardError] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [userRank, setUserRank] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [weather, setWeather] = useState(null);
  const [weatherTab, setWeatherTab] = useState('current');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const prevLevelRef = useRef(null);
  const navigate = useNavigate();

  // State for Carbon Footprint Calculator
  const [carbonInputs, setCarbonInputs] = useState({
    carMiles: 0,
    electricityKwh: 0,
    diet: 'average', // Options: 'vegan', 'vegetarian', 'average', 'meat-heavy'
  });
  const [carbonFootprint, setCarbonFootprint] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/'); // Redirect to login if user is not authenticated
          return;
        }

        setCurrentUserEmail(user.email);

        const { data, error } = await supabase
          .from('users')
          .select('full_name, points, level, badges, email, city')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
          return;
        }

        setUserData(data);

        if (prevLevelRef.current !== null && data.level > prevLevelRef.current) {
          setShowConfetti(true);
        }
        prevLevelRef.current = data.level;

        const { data: historyData, error: historyError } = await supabase
          .from('classifications')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false });

        if (historyError) {
          console.error('Error fetching classification history:', historyError);
          return;
        }

        setClassificationHistory(historyData);

        const recyclableCount = historyData.filter(c => c.result === 'Recyclable').length;
        const co2Saved = recyclableCount * 0.2;
        let badges = data.badges || [];
        if (co2Saved >= 5 && !badges.includes('Climate Champion')) {
          badges.push('Climate Champion');
          await supabase
            .from('users')
            .update({ badges })
            .eq('id', user.id);
          setUserData({ ...data, badges });
        }
      } catch (err) {
        console.error('Error in fetchUserData:', err);
      }
    };

    const fetchLeaderboard = async () => {
      try {
        const { data: allUsers, error: allUsersError } = await supabase
          .from('users')
          .select('full_name, points, email')
          .order('points', { ascending: false });

        if (allUsersError) {
          throw allUsersError;
        }

        setFullLeaderboard(allUsers);

        const { data: { user } } = await supabase.auth.getUser();
        const currentUserIndex = allUsers.findIndex(u => u.email === user.email);
        setUserRank(currentUserIndex + 1);

        const { data: leaderboardData, error: leaderboardError } = await supabase
          .from('users')
          .select('full_name, points, email')
          .order('points', { ascending: false })
          .limit(5);

        if (leaderboardError) {
          throw leaderboardError;
        }

        setLeaderboard(leaderboardData);
        setLeaderboardError(null);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setLeaderboardError('Unable to load leaderboard. Please try again later.');
      }
    };

    const fetchWeather = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: userData } = await supabase
          .from('users')
          .select('city')
          .eq('id', user.id)
          .single();

        const city = userData?.city || 'London'; // Fallback to London if city is not set
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}&units=metric`
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch weather data');
        }
        setWeather(data);
      } catch (error) {
        console.error('Error fetching weather:', error);
        setWeather({ error: error.message });
      }
    };

    fetchUserData();
    fetchLeaderboard();
    fetchWeather();

    const leaderboardSubscription = supabase
      .channel('public:users')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    const historySubscription = supabase
      .channel('public:classifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'classifications' },
        (payload) => {
          fetchUserData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leaderboardSubscription);
      supabase.removeChannel(historySubscription);
    };
  }, [navigate]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) {
      setChatError('Please enter a message.');
      return;
    }

    setChatLoading(true);
    setChatError('');

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an eco-friendly chatbot for the EnviRon app. Provide a concise eco-tip or answer related to sustainability, recycling, or climate change based on the user's input. Keep the response under 100 words and focus on actionable advice. User input: "${chatMessage}"`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to get response from Gemini API');
      }

      const chatReply = data.candidates[0].content.parts[0].text;
      setChatHistory([...chatHistory, { user: chatMessage, bot: chatReply }]);

      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from('users')
        .select('badges')
        .eq('id', user.id)
        .single();

      let badges = userData.badges || [];
      if (chatHistory.length + 1 >= 3 && !badges.includes('Eco Learner')) {
        badges.push('Eco Learner');
        await supabase
          .from('users')
          .update({ badges })
          .eq('id', user.id);
        setUserData({ ...userData, badges });
      }
    } catch (err) {
      setChatError('Error fetching eco-tip: ' + err.message);
    } finally {
      setChatLoading(false);
      setChatMessage('');
    }
  };

  const pointsToNextLevel = userData ? (userData.level * 100) - userData.points : 0;
  const progressPercentage = userData ? (userData.points / (userData.level * 100)) * 100 : 0;
  const treeGrowth = userData ? Math.min(userData.points / 1000, 1) * 100 : 0;

  const calculateImpact = () => {
    const recyclableCount = classificationHistory.filter(c => c.result === 'Recyclable').length;
    const co2Saved = recyclableCount * 0.2;
    const totalClassifications = classificationHistory.length;
    const potentialCo2Savings = totalClassifications * 0.2;

    return { co2Saved, potentialCo2Savings, recyclableCount, totalClassifications };
  };

  const generateClimateTips = () => {
    if (!weather || weather.error) return [];
    const temp = weather.main.temp;
    const condition = weather.weather[0].description.toLowerCase();
    const { co2Saved } = calculateImpact();

    const tips = [];
    if (temp > 25) {
      tips.push('It’s hot today! Reduce energy use by using fans instead of air conditioning.');
    } else if (temp < 10) {
      tips.push('It’s cold today! Insulate your home to reduce heating energy consumption.');
    } else {
      tips.push('Mild weather today—perfect for air-drying clothes instead of using a dryer!');
    }

    if (condition.includes('rain')) {
      tips.push('Rainy weather is great for indoor activities—try composting your food waste!');
    } else if (condition.includes('clear') || condition.includes('sun')) {
      tips.push('Sunny weather is ideal for solar-powered devices—charge your gadgets sustainably!');
    }

    tips.push(`You’ve saved ${co2Saved.toFixed(1)} kg of CO2 by recycling. Keep it up by classifying more items!`);

    return tips;
  };

  // Carbon Footprint Calculator Logic
  const calculateCarbonFootprint = () => {
    const { carMiles, electricityKwh, diet } = carbonInputs;

    // Simplified assumptions (kg CO2e per unit)
    const carEmissionFactor = 0.4; // kg CO2e per mile (average car)
    const electricityEmissionFactor = 0.5; // kg CO2e per kWh (average grid)
    const dietFactors = {
      vegan: 1000, // kg CO2e per year
      vegetarian: 1500,
      average: 2500,
      'meat-heavy': 3500,
    };

    const carFootprint = carMiles * carEmissionFactor;
    const electricityFootprint = electricityKwh * electricityEmissionFactor;
    const dietFootprint = dietFactors[diet] || 2500;

    const totalFootprint = (carFootprint + electricityFootprint + dietFootprint).toFixed(2);
    setCarbonFootprint(totalFootprint);
  };

  const handleCarbonInputChange = (e) => {
    const { name, value } = e.target;
    setCarbonInputs((prev) => ({ ...prev, [name]: value }));
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const openLeaderboardModal = () => {
    setIsLeaderboardModalOpen(true);
  };

  const closeLeaderboardModal = () => {
    setIsLeaderboardModalOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 to-gray-100'} flex`}>
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}
      <Sidebar isDarkMode={isDarkMode} isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className={`flex-1 ${isSidebarOpen ? 'md:ml-72' : 'md:ml-0'} transition-all duration-300`}>
        <header className={`flex justify-between items-center p-4 md:p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-teal-500 to-blue-500'} shadow-lg`}>
          <div className="flex items-center space-x-4">
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
            <h1 className="text-xl md:text-2xl font-bold text-white">EnviRon</h1>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/profile" className="text-white hover:text-gray-200 transition-colors">
              Profile
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
                <button onClick={toggleSidebar} className={`${isDarkMode ? 'text-white' : 'text-gray-800'} focus:outline-none`}>
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>
              <nav className="space-y-4">
                <Link
                  to="/profile"
                  onClick={toggleSidebar}
                  className={`block text-lg ${isDarkMode ? 'text-gray-200 hover:text-teal-300' : 'text-gray-800 hover:text-teal-500'} transition-colors`}
                >
                  Profile
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
                  onClick={toggleDarkMode}
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

        <main className="flex-1 max-w-7xl mx-auto p-4 md:p-6 space-y-8">
          {userData ? (
            <>
              <section className="space-y-6">
                <h2 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} flex items-center space-x-2`}>
                  <FaStar className="text-yellow-400" />
                  <span>Your Progress</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div
                    className={`col-span-1 md:col-span-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border relative overflow-hidden`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(45,212,191,0.3)] rounded-2xl pointer-events-none" />
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Welcome, {userData.full_name}!</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Email:</span>
                        <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {userData.email}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FaMedal className="text-yellow-400 animate-pulse" />
                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Points:</span>
                        <span className={`font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {userData.points || 0}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 relative">
                          <CircularProgressbar
                            value={progressPercentage}
                            text={`${userData.level || 1}`}
                            styles={buildStyles({
                              pathColor: isDarkMode ? '#60A5FA' : '#2DD4BF',
                              textColor: isDarkMode ? '#fff' : '#2DD4BF',
                              trailColor: isDarkMode ? '#4B5563' : '#E5E7EB',
                              pathTransitionDuration: 1,
                            })}
                          />
                          <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                          >
                            <FaStar className="text-yellow-400 opacity-50" />
                          </motion.div>
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Level {userData.level || 1} • {pointsToNextLevel} points to next level
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FaLeaf className="text-green-500" />
                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Green Impact:</span>
                        <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          You’ve helped recycle {classificationHistory.length} items!
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <motion.div
                          className="relative w-8 h-8"
                          initial={{ scale: 0 }}
                          animate={{ scale: treeGrowth / 100 }}
                          transition={{ duration: 1 }}
                        >
                          <FaTree className="text-green-500 w-full h-full" />
                        </motion.div>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Your Eco Tree: {Math.round(treeGrowth)}% grown
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className={`col-span-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border relative overflow-hidden`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(45,212,191,0.3)] rounded-2xl pointer-events-none" />
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4 flex items-center space-x-2`}>
                      <FaMedal className="text-yellow-400" />
                      <span>Badges</span>
                    </h3>
                    {userData.badges?.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {userData.badges.map((badge, index) => (
                          <motion.div
                            key={index}
                            className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center space-x-2 shadow-md`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <FaMedal className="text-yellow-400" />
                            <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{badge}</span>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No badges yet. Keep classifying!</p>
                    )}
                  </motion.div>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} flex items-center space-x-2`}>
                  <FaTrophy className="text-yellow-400" />
                  <span>Community & Environment</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div
                    className={`col-span-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border relative overflow-hidden`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(45,212,191,0.3)] rounded-2xl pointer-events-none" />
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4 flex items-center space-x-2`}>
                      <FaTrophy className="text-yellow-400 animate-bounce" />
                      <span>Leaderboard</span>
                    </h3>
                    {leaderboardError ? (
                      <p className="text-red-500">{leaderboardError}</p>
                    ) : leaderboard.length > 0 ? (
                      <>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Your Rank: {userRank || 'N/A'}</p>
                        <ul className="space-y-3">
                          {leaderboard.map((user, index) => (
                            <motion.li
                              key={index}
                              className={`flex items-center space-x-3 p-2 rounded-lg ${
                                user.email === currentUserEmail
                                  ? isDarkMode
                                    ? 'bg-yellow-900 border-yellow-700'
                                    : 'bg-yellow-100 border-yellow-200'
                                  : index === 0
                                  ? isDarkMode
                                    ? 'bg-yellow-900 border-yellow-700'
                                    : 'bg-yellow-50 border-yellow-200'
                                  : isDarkMode
                                  ? 'border-gray-700'
                                  : 'border-transparent'
                              } border`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                              <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{index + 1}.</span>
                              {index === 0 && <FaTrophy className="text-yellow-400" />}
                              <span className={`flex-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                {user.full_name || 'Unknown'}
                              </span>
                              <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {user.points || 0} pts
                              </span>
                            </motion.li>
                          ))}
                        </ul>
                        <motion.button
                          onClick={openLeaderboardModal}
                          className={`mt-4 px-4 py-2 text-white font-medium rounded-full ${
                            isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                          } transition-colors shadow-lg`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          aria-label="View Full Leaderboard"
                        >
                          View Full Leaderboard
                        </motion.button>
                      </>
                    ) : (
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No users to display in the leaderboard.</p>
                    )}
                  </motion.div>

                  <motion.div
                    className={`col-span-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border relative overflow-hidden`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(45,212,191,0.3)] rounded-2xl pointer-events-none" />
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4 flex items-center space-x-2`}>
                      <FaCloud className="text-blue-400 animate-pulse" />
                      <span>Weather & Climate</span>
                    </h3>
                    <div className="flex space-x-2 mb-4">
                      <button
                        onClick={() => setWeatherTab('current')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          weatherTab === 'current'
                            ? isDarkMode
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-500 text-white'
                            : isDarkMode
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        Current Weather
                      </button>
                      <button
                        onClick={() => setWeatherTab('impact')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          weatherTab === 'impact'
                            ? isDarkMode
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-500 text-white'
                            : isDarkMode
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        Climate Impact
                      </button>
                    </div>
                    {weatherTab === 'current' ? (
                      <div>
                        {weather ? (
                          weather.error ? (
                            <p className={`${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{weather.error}</p>
                          ) : (
                            <p className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                              Today in {weather.name}: {weather.main.temp}°C, {weather.weather[0].description}
                            </p>
                          )
                        ) : (
                          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading weather...</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {weather ? (
                          weather.error ? (
                            <p className={`${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{weather.error}</p>
                          ) : (
                            <>
                              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Your Impact</h4>
                                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                  You’ve classified {classificationHistory.length} items.{' '}
                                  {calculateImpact().co2Saved.toFixed(1)} kg of CO2 saved by recycling!
                                </p>
                                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                  If all items were recycled, you could have saved{' '}
                                  {calculateImpact().potentialCo2Savings.toFixed(1)} kg of CO2.
                                </p>
                                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                  Warmer temperatures like today’s {weather.main.temp}°C in {weather.name} increase energy use—your efforts help reduce emissions!
                                </p>
                              </div>
                              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-green-900' : 'bg-green-100'}`}>
                                <h4 className={`font-medium ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>Climate Tips</h4>
                                <ul className="list-disc list-inside space-y-1">
                                  {generateClimateTips().map((tip, index) => (
                                    <li key={index} className={`${isDarkMode ? 'text-green-200' : 'text-green-600'}`}>
                                      {tip}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </>
                          )
                        ) : (
                          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading weather...</p>
                        )}
                      </div>
                    )}
                  </motion.div>

                  <motion.div
                    className={`col-span-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border relative overflow-hidden`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(45,212,191,0.3)] rounded-2xl pointer-events-none" />
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4 flex items-center space-x-2`}>
                      <FaLeaf className="text-green-500" />
                      <span>Quick Actions</span>
                    </h3>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      animate={{ y: [0, -10, 0], transition: { repeat: Infinity, duration: 1.5 } }}
                    >
                      <Link
                        to="/classify"
                        className={`block w-full py-3 px-4 text-center text-white font-medium rounded-full ${
                          isDarkMode
                            ? 'bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700'
                            : 'bg-gradient-to-r from-teal-400 to-blue-400 hover:from-teal-500 hover:to-blue-500'
                        } transition-all flex items-center justify-center space-x-2 shadow-lg`}
                        aria-label="Classify Waste"
                      >
                        <FaLeaf className="text-white" />
                        <span>Classify Waste</span>
                      </Link>
                    </motion.div>
                  </motion.div>

                  {/* New Placeholder for Waste Disposal Locations */}
                  <motion.div
                    className={`col-span-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border relative overflow-hidden`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(45,212,191,0.3)] rounded-2xl pointer-events-none" />
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4 flex items-center space-x-2`}>
                      <FaMapMarkerAlt className="text-blue-500 animate-pulse" />
                      <span>Nearby Waste Disposal Locations</span>
                    </h3>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Coming soon! We’ll help you find places to dispose of your waste responsibly based on your location.
                    </p>
                  </motion.div>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} flex items-center space-x-2`}>
                  <FaComment className="text-blue-500" />
                  <span>Tools & Insights</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    className={`col-span-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border relative overflow-hidden`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(45,212,191,0.3)] rounded-2xl pointer-events-none" />
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4 flex items-center space-x-2`}>
                      <FaComment className="text-blue-500 animate-pulse" />
                      <span>Eco-Tips Chatbot</span>
                    </h3>
                    <div className="max-h-60 overflow-y-auto mb-4 space-y-3">
                      {chatHistory.map((chat, index) => (
                        <div key={index}>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>You: {chat.user}</p>
                          <motion.div
                            className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'} shadow-md`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <p>Bot: {chat.bot}</p>
                          </motion.div>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleChatSubmit} className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="text"
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          placeholder="Ask for an eco-tip (e.g., 'How can I reduce waste?')"
                          className={`flex-1 p-3 rounded-lg border ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400'
                              : 'bg-gray-100 border-gray-300 text-gray-800 placeholder-gray-500'
                          } focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all`}
                        />
                        <motion.button
                          type="submit"
                          disabled={chatLoading}
                          className={`px-4 py-2 text-white font-medium rounded-full ${
                            chatLoading
                              ? 'bg-gray-500 cursor-not-allowed'
                              : isDarkMode
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-blue-500 hover:bg-blue-600'
                          } transition-colors shadow-lg flex items-center space-x-2`}
                          whileHover={{ scale: chatLoading ? 1 : 1.05 }}
                          whileTap={{ scale: chatLoading ? 1 : 0.95 }}
                        >
                          {chatLoading ? (
                            <svg
                              className="animate-spin h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                              />
                            </svg>
                          ) : (
                            <span>Send</span>
                          )}
                        </motion.button>
                      </div>
                      {chatError && (
                        <motion.p
                          className="text-red-500 text-sm p-2 bg-red-100 rounded-lg"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          {chatError}
                        </motion.p>
                      )}
                    </form>
                  </motion.div>

                  <motion.div
                    className={`col-span-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border relative overflow-hidden`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(45,212,191,0.3)] rounded-2xl pointer-events-none" />
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4 flex items-center space-x-2`}>
                      <FaLeaf className="text-green-500 animate-pulse" />
                      <span>Lifestyle Recommender</span>
                    </h3>
                    <Link
                      to="/lifestyle-survey"
                      className={`block w-full py-3 px-4 text-center text-white font-medium rounded-full ${
                        isDarkMode
                          ? 'bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700'
                          : 'bg-gradient-to-r from-teal-400 to-blue-400 hover:from-teal-500 hover:to-blue-500'
                      } transition-all flex items-center justify-center space-x-2 shadow-lg`}
                    >
                      <FaLeaf className="text-white" />
                      <span>Take the Lifestyle Survey</span>
                    </Link>
                  </motion.div>
                </div>
              </section>

              {/* Carbon Footprint Calculator Section */}
              <section className="space-y-6">
                <h2 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} flex items-center space-x-2`}>
                  <FaLeaf className="text-green-500" />
                  <span>Carbon Footprint Calculator</span>
                </h2>
                <motion.div
                  className={`col-span-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border relative overflow-hidden`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(45,212,191,0.3)] rounded-2xl pointer-events-none" />
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Calculate Your Carbon Footprint</h3>
                  <form className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Car Miles Driven Per Year
                      </label>
                      <input
                        type="number"
                        name="carMiles"
                        value={carbonInputs.carMiles}
                        onChange={handleCarbonInputChange}
                        className={`w-full p-3 rounded-lg border ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-200'
                            : 'bg-gray-100 border-gray-300 text-gray-800'
                        } focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all`}
                        placeholder="e.g., 10000"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Electricity Usage (kWh Per Year)
                      </label>
                      <input
                        type="number"
                        name="electricityKwh"
                        value={carbonInputs.electricityKwh}
                        onChange={handleCarbonInputChange}
                        className={`w-full p-3 rounded-lg border ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-200'
                            : 'bg-gray-100 border-gray-300 text-gray-800'
                        } focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all`}
                        placeholder="e.g., 4000"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Diet Type
                      </label>
                      <select
                        name="diet"
                        value={carbonInputs.diet}
                        onChange={handleCarbonInputChange}
                        className={`w-full p-3 rounded-lg border ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-200'
                            : 'bg-gray-100 border-gray-300 text-gray-800'
                        } focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all`}
                      >
                        <option value="vegan">Vegan</option>
                        <option value="vegetarian">Vegetarian</option>
                        <option value="average">Average</option>
                        <option value="meat-heavy">Meat-Heavy</option>
                      </select>
                    </div>
                    <motion.button
                      type="button"
                      onClick={calculateCarbonFootprint}
                      className={`w-full py-3 px-4 text-white font-medium rounded-full ${
                        isDarkMode
                          ? 'bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700'
                          : 'bg-gradient-to-r from-teal-400 to-blue-400 hover:from-teal-500 hover:to-blue-500'
                      } transition-all shadow-lg`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Calculate Footprint
                    </motion.button>
                  </form>
                  {carbonFootprint && (
                    <motion.div
                      className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-green-900' : 'bg-green-100'}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <h4 className={`font-medium ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                        Your Estimated Carbon Footprint
                      </h4>
                      <p className={`${isDarkMode ? 'text-green-200' : 'text-green-600'}`}>
                        {carbonFootprint} kg CO2e per year
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        The average person emits about 5000 kg CO2e per year. Try reducing your footprint by using public transport, conserving energy, or adopting a plant-based diet!
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              </section>

              <section className="space-y-6">
                <h2 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} flex items-center space-x-2`}>
                  <FaLeaf className="text-green-500" />
                  <span>History & Goals</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    className={`col-span-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border relative overflow-hidden`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(45,212,191,0.3)] rounded-2xl pointer-events-none" />
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4 flex items-center space-x-2`}>
                      <FaLeaf className="text-green-500 animate-pulse" />
                      <span>Recent Classifications</span>
                    </h3>
                    {classificationHistory.length > 0 ? (
                      <ul className="space-y-3">
                        {classificationHistory.slice(0, 5).map((entry, index) => (
                          <motion.li
                            key={index}
                            className={`flex items-center space-x-3 p-2 rounded-lg ${
                              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                            } transition-colors`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            {entry.result.includes('Recyclable') ? (
                              <FaRecycle className="text-green-500 animate-bounce" />
                            ) : (
                              <FaTrash className="text-red-500 animate-bounce" />
                            )}
                            <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {new Date(entry.timestamp).toLocaleDateString()}
                            </span>
                            <span className={`flex-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                              {entry.item || 'Unknown Item'}
                            </span>
                            <span
                              className={`text-sm font-medium px-2 py-1 rounded-full ${
                                entry.result.includes('Recyclable')
                                  ? isDarkMode
                                    ? 'bg-green-900 text-green-300'
                                    : 'bg-green-100 text-green-700'
                                  : isDarkMode
                                  ? 'bg-red-900 text-red-300'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {entry.result.split(' - ')[1]}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    ) : (
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        No classifications yet. Start by classifying waste!
                      </p>
                    )}
                  </motion.div>

                  <motion.div
                    className={`col-span-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border relative overflow-hidden`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(45,212,191,0.3)] rounded-2xl pointer-events-none" />
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4 flex items-center space-x-2`}>
                      <FaStar className="text-yellow-400" />
                      <span>Unlockable Features</span>
                    </h3>
                    <div className="space-y-3">
                      <Link to="/teaser">
                        <div
                          className={`p-3 rounded-lg ${
                            userData.level >= 5 ? (isDarkMode ? 'bg-green-900' : 'bg-green-100') : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                          } cursor-pointer hover:bg-opacity-80 transition-all`}
                        >
                          <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Advanced Analytics</p>
                          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                            {userData.level >= 5 ? 'Unlocked! View detailed stats below.' : 'Reach Level 5 to unlock detailed analytics.'}
                          </p>
                        </div>
                      </Link>
                      <Link to="/teaser">
                        <div
                          className={`p-3 rounded-lg ${
                            userData.level >= 3 ? (isDarkMode ? 'bg-green-900' : 'bg-green-100') : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                          } cursor-pointer hover:bg-opacity-80 transition-all`}
                        >
                          <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Community Challenges</p>
                          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                            {userData.level >= 3
                              ? 'Unlocked! Check them out in the Community section.'
                              : 'Reach Level 3 to unlock community challenges.'}
                          </p>
                        </div>
                      </Link>
                    </div>
                  </motion.div>
                </div>
              </section>

              {userData.level >= 5 && (
                <section className="space-y-6">
                  <h2 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} flex items-center space-x-2`}>
                    <FaStar className="text-yellow-400" />
                    <span>Advanced Analytics</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                      className={`col-span-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border relative overflow-hidden`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.9 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(45,212,191,0.3)] rounded-2xl pointer-events-none" />
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Total Items Classified</h3>
                      <p className={`text-3xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {calculateImpact().totalClassifications}
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                        Keep classifying to make a bigger impact!
                      </p>
                    </motion.div>

                    <motion.div
                      className={`col-span-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border relative overflow-hidden`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1.0 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(45,212,191,0.3)] rounded-2xl pointer-events-none" />
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Recyclable vs Non-Recyclable</h3>
                      <div className="space-y-2">
                        <p className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          Recyclable: {calculateImpact().recyclableCount} items
                        </p>
                        <p className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          Non-Recyclable: {calculateImpact().totalClassifications - calculateImpact().recyclableCount} items
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-green-500 h-4 rounded-full"
                            style={{
                              width: `${
                                calculateImpact().totalClassifications > 0
                                  ? (calculateImpact().recyclableCount / calculateImpact().totalClassifications) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className={`col-span-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border relative overflow-hidden`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(45,212,191,0.3)] rounded-2xl pointer-events-none" />
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>CO2 Savings</h3>
                      <p className={`text-3xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {calculateImpact().co2Saved.toFixed(1)} kg
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                        Equivalent to planting {Math.round(calculateImpact().co2Saved / 0.5)} trees!
                      </p>
                    </motion.div>
                  </div>
                </section>
              )}
            </>
          ) : (
            <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</p>
          )}
        </main>
      </div>

      <Modal
        isOpen={isLeaderboardModalOpen}
        onRequestClose={closeLeaderboardModal}
        className={`m-4 md:m-auto md:w-1/2 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-2xl shadow-lg p-6 relative`}
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Full Leaderboard</h2>
        <button onClick={closeLeaderboardModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <FaTimes />
        </button>
        {fullLeaderboard.length > 0 ? (
          <ul className="space-y-3 max-h-96 overflow-y-auto">
            {fullLeaderboard.map((user, index) => (
              <motion.li
                key={index}
                className={`flex items-center space-x-3 p-2 rounded-lg ${
                  user.email === currentUserEmail
                    ? isDarkMode
                      ? 'bg-yellow-900 border-yellow-700'
                      : 'bg-yellow-100 border-yellow-200'
                    : index === 0
                    ? isDarkMode
                      ? 'bg-yellow-900 border-yellow-700'
                      : 'bg-yellow-50 border-yellow-200'
                    : isDarkMode
                    ? 'border-gray-700'
                    : 'border-transparent'
                } border`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{index + 1}.</span>
                {index === 0 && <FaTrophy className="text-yellow-400" />}
                <span className={`flex-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {user.full_name || 'Unknown'}
                </span>
                <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {user.points || 0} pts
                </span>
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No users to display in the leaderboard.</p>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
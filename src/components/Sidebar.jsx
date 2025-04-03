import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMedal, FaLock, FaChevronDown, FaChevronUp, FaBars } from 'react-icons/fa';
import { supabase } from '../supabase';

const Sidebar = ({ isDarkMode, isSidebarOpen, toggleSidebar }) => {
  const [userData, setUserData] = useState({ level: 1, badges: [], points: 0 });
  const [challengesCompleted, setChallengesCompleted] = useState(0);
  const [postsShared, setPostsShared] = useState(0);
  const [referralsCount, setReferralsCount] = useState(0);

  // State for collapsible sections
  const [isLevelOpen, setIsLevelOpen] = useState(true);
  const [isBadgesOpen, setIsBadgesOpen] = useState(true);
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch user data
        const { data: userInfo } = await supabase
          .from('users')
          .select('level, badges, points')
          .eq('id', user.id)
          .single();

        // Fetch completed challenges
        const { data: completedChallenges } = await supabase
          .from('challenge_participants')
          .select('id')
          .eq('user_id', user.id)
          .eq('completed', true);

        // Fetch posts shared
        const { data: userPosts } = await supabase
          .from('posts')
          .select('id')
          .eq('user_id', user.id);

        // Fetch referrals
        const { data: referralsData } = await supabase
          .from('referrals')
          .select('id')
          .eq('referrer_id', user.id);

        setUserData(userInfo || { level: 1, badges: [], points: 0 });
        setChallengesCompleted(completedChallenges ? completedChallenges.length : 0);
        setPostsShared(userPosts ? userPosts.length : 0);
        setReferralsCount(referralsData ? referralsData.length : 0);
      } catch (err) {
        console.error('Error fetching user data:', err.message);
      }
    };

    fetchUserData();
  }, []);

  const roadmap = [
    {
      level: 1,
      title: 'Eco-Novice',
      requirements: 'Complete 1 challenge',
      pointsRequired: 0,
      isUnlocked: userData.level >= 1,
      features: 'Basic Challenges, Community Forum',
    },
    {
      level: 2,
      title: 'Eco-Apprentice',
      requirements: `Complete 3 challenges (${challengesCompleted}/3), Earn 50 points (${userData.points}/50)`,
      pointsRequired: 50,
      isUnlocked: userData.level >= 2,
      features: 'Unlock more climate tools (coming soon!)',
    },
    {
      level: 3,
      title: 'Eco-Guardian',
      requirements: `Complete 5 challenges (${challengesCompleted}/5), Earn 100 points (${userData.points}/100)`,
      pointsRequired: 100,
      isUnlocked: userData.level >= 3,
      features: 'Personalized Climate Risk Dashboard',
    },
    {
      level: 4,
      title: 'Eco-Champion',
      requirements: `Complete 7 challenges (${challengesCompleted}/7), Earn 150 points (${userData.points}/150), Share 3 posts (${postsShared}/3)`,
      pointsRequired: 150,
      isUnlocked: userData.level >= 4,
      features: 'Sustainable Lifestyle Recommender',
    },
    {
      level: 5,
      title: 'Eco-Hero',
      requirements: `Complete 10 challenges (${challengesCompleted}/10), Earn 200 points (${userData.points}/200), Invite 1 friend (${referralsCount}/1)`,
      pointsRequired: 200,
      isUnlocked: userData.level >= 5,
      features: 'Enhanced Community Hub',
    },
  ];

  return (
    <div className="relative">
      {/* Toggle Button (Visible when Sidebar is Collapsed) */}
      <motion.button
        onClick={toggleSidebar}
        className={`fixed top-4 left-4 z-50 p-2 rounded-full shadow-lg transition-colors duration-200 ${
          isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100'
        } ${isSidebarOpen ? 'hidden' : 'block'}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
      >
        <FaBars className="h-6 w-6" />
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            className={`fixed top-0 left-0 h-screen md:w-72 ${
              isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
            } p-6 space-y-4 shadow-lg border-r ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            } z-40 overflow-y-auto`} // Added h-screen and overflow-y-auto for scrolling
            initial={{ x: -288 }}
            animate={{ x: 0 }}
            exit={{ x: -288 }}
            transition={{ duration: 0.3 }}
          >
            {/* Close Button Inside Sidebar */}
            <motion.button
              onClick={toggleSidebar}
              className={`absolute top-4 right-4 p-2 rounded-full ${
                isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } transition-colors duration-200`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Close Sidebar"
            >
              <FaBars className="h-5 w-5" />
            </motion.button>

            {/* Current Level and Progress Section */}
            <div className="rounded-lg overflow-hidden">
              <button
                onClick={() => setIsLevelOpen(!isLevelOpen)}
                className={`w-full flex justify-between items-center p-3 ${
                  isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                } transition-colors duration-200`}
              >
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  Level {userData.level}: {roadmap[userData.level - 1]?.title}
                </h3>
                {isLevelOpen ? (
                  <FaChevronUp className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                ) : (
                  <FaChevronDown className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                )}
              </button>
              <AnimatePresence>
                {isLevelOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-3"
                  >
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Points: {userData.points}
                    </p>
                    <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-3 mt-2 overflow-hidden`}>
                      <motion.div
                        className="bg-gradient-to-r from-green-400 to-teal-500 h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(userData.points / (roadmap[userData.level]?.pointsRequired || 50)) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Badges Section */}
            <div className="rounded-lg overflow-hidden">
              <button
                onClick={() => setIsBadgesOpen(!isBadgesOpen)}
                className={`w-full flex justify-between items-center p-3 ${
                  isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                } transition-colors duration-200`}
              >
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  Badges ({userData.badges?.length || 0})
                </h3>
                {isBadgesOpen ? (
                  <FaChevronUp className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                ) : (
                  <FaChevronDown className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                )}
              </button>
              <AnimatePresence>
                {isBadgesOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-3"
                  >
                    <div className="flex flex-wrap gap-3">
                      {userData.badges?.length > 0 ? (
                        userData.badges.map((badge, index) => (
                          <motion.div
                            key={index}
                            className="relative group"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                          >
                            <FaMedal className="text-yellow-400 h-8 w-8 drop-shadow-md" />
                            <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg p-2 -top-10 left-1/2 transform -translate-x-1/2 shadow-lg">
                              {badge}
                            </span>
                          </motion.div>
                        ))
                      ) : (
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          No badges yet! Keep going!
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Roadmap Section */}
            <div className="rounded-lg overflow-hidden">
              <button
                onClick={() => setIsRoadmapOpen(!isRoadmapOpen)}
                className={`w-full flex justify-between items-center p-3 ${
                  isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                } transition-colors duration-200`}
              >
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  Roadmap
                </h3>
                {isRoadmapOpen ? (
                  <FaChevronUp className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                ) : (
                  <FaChevronDown className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                )}
              </button>
              <AnimatePresence>
                {isRoadmapOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-3 space-y-3"
                  >
                    {roadmap.map((level) => (
                      <motion.div
                        key={level.level}
                        className={`p-4 rounded-lg shadow-sm transition-all duration-200 ${
                          level.isUnlocked
                            ? isDarkMode
                              ? 'bg-gray-700'
                              : 'bg-white'
                            : isDarkMode
                            ? 'bg-gray-800 opacity-60'
                            : 'bg-gray-100 opacity-60'
                        }`}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-start space-x-3">
                          {level.isUnlocked ? (
                            <FaMedal className="text-green-500 h-5 w-5 mt-1" />
                          ) : (
                            <FaLock className="text-gray-500 h-5 w-5 mt-1" />
                          )}
                          <div>
                            <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                              Level {level.level}: {level.title}
                            </h4>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                              {level.requirements}
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-teal-300' : 'text-teal-600'} mt-1`}>
                              Unlocks: {level.features}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sidebar;
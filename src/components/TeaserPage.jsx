import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaLock, FaStar, FaArrowLeft } from 'react-icons/fa';

const TeaserPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      name: 'AI-Driven Climate Insights',
      description: 'Get personalized climate impact predictions using advanced AI models.',
      levelRequired: 5,
    },
    {
      name: 'Global Carbon Offset Tracker',
      description: 'Track and contribute to global carbon offset projects in real-time.',
      levelRequired: 6,
    },
    {
      name: 'Eco-Community Leaderboard',
      description: 'Compete with friends and global users in eco-challenges.',
      levelRequired: 4,
    },
    {
      name: 'Sustainable Investment Guide',
      description: 'Discover eco-friendly investment opportunities to support green initiatives.',
      levelRequired: 7,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-white flex flex-col">
      <header className="p-6 flex items-center space-x-4 bg-gradient-to-r from-teal-500 to-blue-500 shadow-lg">
        <motion.button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-white text-gray-800 hover:bg-gray-200 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Go Back"
        >
          <FaArrowLeft className="h-6 w-6" />
        </motion.button>
        <h1 className="text-2xl font-bold text-white">Unlockable Features</h1>
      </header>
      <main className="flex-1 max-w-5xl mx-auto p-6 space-y-8">
        <section className="text-center">
          <h2 className="text-3xl font-bold mb-4">Level Up to Unlock Amazing Features!</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Reach higher levels to access powerful tools and insights that will supercharge your sustainability journey.
          </p>
        </section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(45,212,191,0.3)] rounded-2xl pointer-events-none" />
              <div className="flex items-center space-x-3">
                <FaLock className="text-gray-500 h-6 w-6" />
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">{feature.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{feature.description}</p>
                  <p className="text-sm text-teal-600 dark:text-teal-300 mt-1">
                    Unlock at Level {feature.levelRequired}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="text-center">
          <Link
            to="/dashboard"
            className="inline-block px-6 py-3 text-white font-medium rounded-full bg-gradient-to-r from-teal-400 to-blue-400 hover:from-teal-500 hover:to-blue-500 transition-all shadow-lg"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
};

export default TeaserPage;
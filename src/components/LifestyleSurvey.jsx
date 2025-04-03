import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaLeaf, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';

const LifestyleSurvey = () => {
  const navigate = useNavigate();
  const [recQuestions, setRecQuestions] = useState([
    { question: 'Do you recycle?', answer: '' },
    { question: 'Do you use reusable bags?', answer: '' },
    { question: 'Do you use public transportation?', answer: '' },
  ]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [isDarkMode] = useState(false); // You can pass this as a prop or use a context if needed
  const [error, setError] = useState(''); // For input validation

  const handleRecSubmit = (e) => {
    e.preventDefault();
    const currentQuestion = recQuestions[currentQuestionIndex];
    const answer = currentQuestion.answer.toLowerCase().trim();

    // Validate input
    if (!answer || !['yes', 'no'].includes(answer)) {
      setError('Please answer "yes" or "no".');
      return;
    }

    setError('');

    // Generate recommendation based on the answer
    let recommendation = '';
    if (currentQuestion.question.includes('recycle')) {
      recommendation = answer === 'yes' ? 'Great! Try composting next.' : 'Start recycling to save 0.2 kg CO2e!';
    } else if (currentQuestion.question.includes('reusable bags')) {
      recommendation = answer === 'yes' ? 'Awesome! Consider using a reusable water bottle too.' : 'Switch to reusable bags to reduce plastic waste!';
    } else if (currentQuestion.question.includes('public transportation')) {
      recommendation = answer === 'yes' ? 'Excellent! Try biking or walking for short trips.' : 'Use public transportation to reduce your carbon footprint!';
    }

    setRecommendations([...recommendations, recommendation]);

    // Move to the next question or finish the survey
    if (currentQuestionIndex < recQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }

    // Clear the current answer
    const updatedQuestions = [...recQuestions];
    updatedQuestions[currentQuestionIndex].answer = '';
    setRecQuestions(updatedQuestions);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setRecommendations([]);
    setRecQuestions(recQuestions.map((q) => ({ ...q, answer: '' })));
    setError('');
  };

  const isSurveyComplete = recommendations.length === recQuestions.length;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 to-gray-100'} flex flex-col`}>
      <header className={`p-6 flex items-center space-x-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-teal-500 to-blue-500'} shadow-lg`}>
        <motion.button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-white text-gray-800 hover:bg-gray-200 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Go Back"
        >
          <FaArrowLeft className="h-6 w-6" />
        </motion.button>
        <h1 className="text-2xl font-bold text-white">Lifestyle Survey</h1>
      </header>
      <main className="flex-1 max-w-5xl mx-auto p-6 space-y-8">
        <section className="text-center">
          <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Let’s Improve Your Lifestyle!
          </h2>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Answer a few questions to get personalized recommendations for a more sustainable lifestyle.
          </p>
        </section>

        {/* Progress Indicator */}
        <div className="flex justify-center items-center space-x-2">
          {recQuestions.map((_, index) => (
            <div
              key={index}
              className={`h-3 w-3 rounded-full ${
                index <= currentQuestionIndex ? 'bg-teal-500' : 'bg-gray-300'
              } ${isDarkMode && index <= currentQuestionIndex ? 'bg-teal-300' : ''}`}
            />
          ))}
        </div>

        {/* Survey Form or Summary */}
        {!isSurveyComplete ? (
          <motion.div
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 relative overflow-hidden`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(45,212,191,0.3)] rounded-2xl pointer-events-none" />
            <form onSubmit={handleRecSubmit} className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={recQuestions[currentQuestionIndex].answer}
                  onChange={(e) => {
                    const updatedQuestions = [...recQuestions];
                    updatedQuestions[currentQuestionIndex].answer = e.target.value;
                    setRecQuestions(updatedQuestions);
                    setError(''); // Clear error on input change
                  }}
                  placeholder={recQuestions[currentQuestionIndex].question}
                  className={`flex-1 p-3 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400'
                      : 'bg-gray-100 border-gray-300 text-gray-800 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all`}
                />
                <motion.button
                  type="submit"
                  className={`px-4 py-2 text-white font-medium rounded-full ${
                    isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                  } transition-colors shadow-lg`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Submit
                </motion.button>
              </div>
              {error && (
                <motion.p
                  className="text-red-500 text-sm p-2 bg-red-100 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {error}
                </motion.p>
              )}
            </form>
          </motion.div>
        ) : (
          <motion.div
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 relative overflow-hidden`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(45,212,191,0.3)] rounded-2xl pointer-events-none" />
            <div className="text-center">
              <FaCheckCircle className="text-green-500 h-12 w-12 mx-auto mb-4" />
              <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>
                Survey Complete!
              </h3>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                Here are your personalized recommendations to live a more sustainable lifestyle:
              </p>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center space-x-2 shadow-md`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <FaLeaf className="text-green-500" />
                    <p className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{rec}</p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 flex justify-center space-x-4">
                <motion.button
                  onClick={handleRestart}
                  className={`px-6 py-2 text-white font-medium rounded-full ${
                    isDarkMode ? 'bg-teal-600 hover:bg-teal-700' : 'bg-teal-500 hover:bg-teal-600'
                  } transition-colors shadow-lg`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Restart Survey
                </motion.button>
                <Link
                  to="/dashboard"
                  className={`px-6 py-2 text-white font-medium rounded-full ${
                    isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                  } transition-colors shadow-lg`}
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Display Recommendations as They Are Added */}
        {recommendations.length > 0 && !isSurveyComplete && (
          <motion.div
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 relative overflow-hidden`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(45,212,191,0.3)] rounded-2xl pointer-events-none" />
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4 flex items-center space-x-2`}>
              <FaLeaf className="text-green-500" />
              <span>Your Recommendations So Far</span>
            </h3>
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center space-x-2 shadow-md`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <FaLeaf className="text-green-500" />
                  <p className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{rec}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default LifestyleSurvey;
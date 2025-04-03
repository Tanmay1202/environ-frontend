import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Introduction = ({ refreshOnboardingStatus }) => {
  const navigate = useNavigate();

  const handleNext = () => {
    console.log('Introduction: Navigating to /location');
    navigate('/location');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-l from-blue-300 to-teal-300 px-4">
      <motion.div
        className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold bg-gradient-to-l from-blue-400 to-teal-400 bg-clip-text text-transparent mb-4">
          Are You Ready?
        </h2>
        <p className="text-gray-800 mb-6">
        Welcome to EnviRon, hero of the planet! 🌍protect the environment, earn badges, and save the Earth—one level at a time. EnviRon makes you the ultimate eco-warrior in a fun, rewarding quest to make the world greener! 🚀💚
        </p>
        <motion.button
          onClick={handleNext}
          className="px-6 py-3 text-white font-medium rounded-md bg-gradient-to-l from-blue-400 to-teal-400 hover:opacity-90"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Continue
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Introduction;
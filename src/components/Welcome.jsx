import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaLeaf } from 'react-icons/fa';

const Welcome = ({ refreshOnboardingStatus }) => {
  const navigate = useNavigate();

  const handleNext = () => {
    console.log('Welcome: Navigating to /introduction');
    navigate('/introduction');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-l from-blue-300 to-teal-300">
      <motion.div
        className="bg-white p-4 rounded-full shadow-md mb-8"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <FaLeaf className="h-12 w-12 text-teal-500" />
      </motion.div>
      <motion.h1
        className="text-4xl font-bold text-white mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Welcome to EnviRon!
      </motion.h1>
      <motion.button
        onClick={handleNext}
        className="px-6 py-3 text-white font-medium rounded-md bg-gradient-to-l from-blue-400 to-teal-400 hover:opacity-90"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        Start Playing
      </motion.button>
    </div>
  );
};

export default Welcome;
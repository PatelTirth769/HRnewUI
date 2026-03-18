import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AccordionPanel = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-md mb-2 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-3 sm:p-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-medium text-gray-800 text-sm sm:text-base">{title}</span>
        <svg
          className={`w-4 h-4 sm:w-5 sm:h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-3 sm:p-4 bg-white text-sm sm:text-base">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccordionPanel;
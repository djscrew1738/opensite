import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

/**
 * SuccessAnimation — Animated success checkmark with optional confetti
 * Use for file uploads, form submissions, and action confirmations
 */

const circleVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      type: 'spring',
      stiffness: 200,
      damping: 15,
      delay: 0.1
    }
  },
  exit: { 
    scale: 0, 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

const checkVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { 
    pathLength: 1, 
    opacity: 1,
    transition: { 
      pathLength: { delay: 0.3, duration: 0.4, ease: 'easeOut' },
      opacity: { delay: 0.3, duration: 0.1 }
    }
  }
};

const particleVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i) => ({
    scale: [0, 1, 0],
    opacity: [0, 1, 0],
    x: [0, (i % 2 === 0 ? 1 : -1) * (20 + Math.random() * 20)],
    y: [0, -30 - Math.random() * 20],
    transition: {
      duration: 0.6,
      delay: 0.4 + i * 0.05,
      ease: 'easeOut'
    }
  })
};

export function SuccessAnimation({ 
  size = 'md',
  showParticles = true,
  className = ''
}) {
  const sizes = {
    sm: { wrapper: 'w-10 h-10', icon: 'w-5 h-5', stroke: 2 },
    md: { wrapper: 'w-16 h-16', icon: 'w-8 h-8', stroke: 2.5 },
    lg: { wrapper: 'w-24 h-24', icon: 'w-12 h-12', stroke: 3 },
    xl: { wrapper: 'w-32 h-32', icon: 'w-16 h-16', stroke: 4 }
  };

  const s = sizes[size];

  return (
    <motion.div 
      className={`relative inline-flex items-center justify-center ${s.wrapper} ${className}`}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Background circle */}
      <motion.div
        className="absolute inset-0 rounded-full bg-emerald-100 dark:bg-emerald-900/30"
        variants={circleVariants}
      />
      
      {/* Success ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-emerald-500 dark:border-emerald-400"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ 
          scale: [0.8, 1.1, 1],
          opacity: [0, 1, 1]
        }}
        transition={{ duration: 0.4, delay: 0.1 }}
      />

      {/* Checkmark */}
      <motion.svg
        className={`${s.icon} text-emerald-600 dark:text-emerald-400 relative z-10`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={s.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d="M5 13l4 4L19 7"
          variants={checkVariants}
        />
      </motion.svg>

      {/* Particles */}
      {showParticles && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-emerald-500"
              style={{ 
                left: '50%', 
                top: '50%',
                marginLeft: -3,
                marginTop: -3
              }}
              custom={i}
              variants={particleVariants}
            />
          ))}
        </>
      )}
    </motion.div>
  );
}

/**
 * SuccessToast — Compact success indicator for inline use
 */
export function SuccessToast({ 
  message = 'Success!',
  submessage,
  onClose,
  duration = 3000,
  className = ''
}) {
  return (
    <motion.div
      className={`flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 ${className}`}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <SuccessAnimation size="sm" showParticles={false} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-emerald-900 dark:text-emerald-300">
          {message}
        </p>
        {submessage && (
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            {submessage}
          </p>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors"
        >
          <span className="sr-only">Dismiss</span>
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </motion.div>
  );
}

/**
 * UploadSuccess — Full upload success state with file details
 */
export function UploadSuccess({ 
  fileName,
  fileSize,
  onUploadAnother,
  onViewResults,
  className = ''
}) {
  return (
    <motion.div
      className={`bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-8 text-center ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <div className="flex justify-center mb-6">
        <SuccessAnimation size="lg" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h4 className="text-xl font-semibold text-emerald-900 dark:text-emerald-300 mb-2">
          Upload Complete!
        </h4>
        
        {fileName && (
          <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-1">
            {fileName}
            {fileSize && <span className="text-emerald-600/70 dark:text-emerald-500/70"> ({fileSize})</span>}
          </p>
        )}
        
        <p className="text-sm text-emerald-600 dark:text-emerald-500">
          Your file has been successfully uploaded and is being processed.
        </p>
      </motion.div>

      <motion.div
        className="flex flex-wrap justify-center gap-3 mt-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {onViewResults && (
          <button
            onClick={onViewResults}
            className="btn-primary flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            View Results
          </button>
        )}
        {onUploadAnother && (
          <button
            onClick={onUploadAnother}
            className="btn-secondary"
          >
            Upload Another
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

export default SuccessAnimation;

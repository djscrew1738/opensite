import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload } from 'lucide-react';
import UploadModal from './UploadModal';

export default function UploadFAB() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setShowModal(true)}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-24 right-6 z-30 w-12 h-12 rounded-full
                   bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/25
                   flex items-center justify-center
                   hover:bg-[#2563EB] transition-colors"
        aria-label="Upload files"
      >
        <Upload className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {showModal && <UploadModal isOpen onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </>
  );
}

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore, type Toast as ToastType } from '../store/toastStore';

const ToastItem = ({ toast }: { toast: ToastType }) => {
  const removeToast = useToastStore((state) => state.removeToast);

  const icons = {
    success: <CheckCircle className="text-emerald-400" size={20} />,
    error: <AlertTriangle className="text-red-400" size={20} />,
    info: <Info className="text-blue-400" size={20} />
  };

  const borders = {
    success: 'border-emerald-400',
    error: 'border-red-400',
    info: 'border-blue-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`flex items-start gap-3 bg-gray-900 border border-gray-800 border-l-4 ${borders[toast.type]} shadow-2xl rounded-xl p-4 pr-10 relative pointer-events-auto max-w-sm w-full`}
    >
      <div className="mt-0.5 shrink-0">{icons[toast.type]}</div>
      <p className="text-sm font-medium text-gray-200 leading-relaxed">{toast.message}</p>
      <button 
        onClick={() => removeToast(toast.id)} 
        className="absolute right-3 top-4 text-gray-500 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};

export const ToastContainer = () => {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="fixed bottom-6 right-6 z-[11000] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

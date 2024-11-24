import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const Alert = ({ children, variant = 'default' }) => {
  const baseStyles = 'fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out flex items-center gap-2 min-w-[320px] animate-slideIn';
  
  const alertStyles = {
    default: 'bg-green-500 text-white',
    destructive: 'bg-red-500 text-white',
    loading: 'bg-blue-500 text-white'
  };

  return (
    <div className={`${baseStyles} ${alertStyles[variant]}`}>
      {variant === 'default' && <CheckCircle className="w-5 h-5" />}
      {variant === 'destructive' && <AlertCircle className="w-5 h-5" />}
      {children}
    </div>
  );
};

export const AlertDescription = ({ children }) => (
  <div className="text-sm font-medium text-white">{children}</div>
);

// Add keyframes for slide-in animation to your CSS:
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(0);
      opacity: 0;
    }
    to {
      transform: translateX(90%);
      opacity: 1;
    }
  }
  
  .animate-slideIn {
    animation: slideIn 0.5s ease-out forwards;
  }
`;
document.head.appendChild(styleSheet);

export default Alert;
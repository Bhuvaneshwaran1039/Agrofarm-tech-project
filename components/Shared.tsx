import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-card dark:bg-slate-800 p-6 rounded-lg shadow-md w-full ${className}`}>
    {children}
  </div>
);

export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}> = ({ children, onClick, className, disabled, type = 'button' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    type={type}
    className={`px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);
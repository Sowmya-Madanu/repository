import React from 'react';

const LoadingSpinner = ({ size = 'md', text = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className={`spinner ${sizeClasses[size]}`}></div>
      {text && <p className="text-sm text-muted">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
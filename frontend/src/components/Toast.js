import React, { useEffect } from 'react';

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="toast-message">
      {message}
      <button className="toast-close" onClick={onClose}>&times;</button>
    </div>
  );
};

export default Toast;
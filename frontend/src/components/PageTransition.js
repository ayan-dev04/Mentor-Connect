import React, { useEffect } from 'react';

const PageTransition = ({ children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return <div className="page-transition">{children}</div>;
};

export default PageTransition;
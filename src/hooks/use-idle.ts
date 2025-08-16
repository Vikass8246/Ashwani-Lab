
"use client";

import { useState, useEffect, useCallback } from 'react';

const useIdle = (timeout: number) => {
  const [isIdle, setIsIdle] = useState(false);

  const handleIdle = useCallback(() => {
    setIsIdle(true);
  }, []);

  const handleActive = useCallback(() => {
    setIsIdle(false);
  }, []);

  useEffect(() => {
    let idleTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(idleTimer);
      handleActive();
      idleTimer = setTimeout(handleIdle, timeout);
    };

    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    
    resetTimer(); // Initialize timer

    return () => {
      clearTimeout(idleTimer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [timeout, handleActive, handleIdle]);

  return isIdle;
};

export default useIdle;

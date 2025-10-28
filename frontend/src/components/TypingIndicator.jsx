import { useState, useEffect } from 'react';

function TypingIndicator() {
  const [dots, setDots] = useState('');
  useEffect(() => {
    let mounted = true;
    let count = 0;
    const iv = setInterval(() => {
      if (!mounted) return;
      count = (count + 1) % 4;
      setDots('.'.repeat(count));
    }, 400);
    return () => { mounted = false; clearInterval(iv); };
  }, []);
  return <span style={{ display: 'inline-block', minWidth: 36 }}>{dots}</span>;
}

export default TypingIndicator;

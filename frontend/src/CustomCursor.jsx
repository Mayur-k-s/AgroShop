// CustomCursor.jsx
import React, { useEffect, useRef } from 'react';
import './CustomCursor.css';

const CustomCursor = () => {
  const dotRef = useRef(null);
  const ballRef = useRef(null);
  const requestRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const ball = useRef({ x: 0, y: 0 });
  
  // Physics: Lower = slower/smoother trail
  const speed = 0.1; 

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      // Move dot instantly
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
    };

    const handleMouseOver = (e) => {
      // Trigger hover effect for interactive elements
      const target = e.target.tagName.toLowerCase();
      if (['a', 'button', 'input', 'select', 'textarea', 'tr'].includes(target) || e.target.closest('button')) {
        ballRef.current?.classList.add('hovering');
      }
    };

    const handleMouseOut = () => {
      ballRef.current?.classList.remove('hovering');
    };

    const animate = () => {
      // Lerp (Linear Interpolation) for smooth trailing
      ball.current.x += (mouse.current.x - ball.current.x) * speed;
      ball.current.y += (mouse.current.y - ball.current.y) * speed;

      if (ballRef.current) {
        ballRef.current.style.transform = `translate3d(${ball.current.x}px, ${ball.current.y}px, 0) translate(-50%, -50%)`;
      }
      requestRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <>
      <div 
        ref={dotRef} 
        className="cursor-dot" 
        style={{ pointerEvents: 'none' }}
      ></div>
      <div 
        ref={ballRef} 
        className="cursor-ball" 
        style={{ pointerEvents: 'none' }}
      ></div>
    </>
  );
};

export default CustomCursor;
import React, { useMemo } from 'react';

const NerdBackground = ({ count = 75 }) => {
  const nerds = useMemo(() => {
    const nerdColors = [
      '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', 
      '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899'
    ];

    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      width: `${Math.random() * 10 + 5}px`,
      height: `${Math.random() * 10 + 5}px`,
      backgroundColor: nerdColors[Math.floor(Math.random() * nerdColors.length)],
      borderRadius: `${Math.floor(Math.random() * 50) + 50}% ${Math.floor(Math.random() * 50) + 50}% / ${Math.floor(Math.random() * 50) + 50}% ${Math.floor(Math.random() * 50) + 50}%`,
      animation: `nerd-float ${Math.random() * 20 + 15}s ${Math.random() * -30}s infinite ease-in-out alternate`,
    }));
  }, [count]);

  return (
    <>
      <style>
        {`
          @keyframes nerd-float {
            from {
              transform: translateY(20px) translateX(10px) rotate(var(--start-rotate, 0deg));
              opacity: 0.1;
            }
            to {
              transform: translateY(-20px) translateX(-10px) rotate(var(--end-rotate, 45deg));
              opacity: 0.3;
            }
          }
        `}
      </style>
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        {nerds.map(nerd => (
          <div
            key={nerd.id}
            className="absolute"
            style={{
              ...nerd,
              '--start-rotate': `${Math.random() * 360}deg`,
              '--end-rotate': `${Math.random() * 360}deg`,
            }}
          />
        ))}
      </div>
    </>
  );
};

export default NerdBackground;
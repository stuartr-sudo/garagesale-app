import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FireworkParticle = ({ children, delay = 0, direction = 'radial' }) => {
  const getAnimation = () => {
    if (direction === 'radial') {
      // Classic firework explosion - particles fly out in all directions
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * 150 + 50;
      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        scale: [1, 1.2, 0],
        opacity: [1, 0.8, 0],
        rotate: Math.random() * 360,
      };
    } else if (direction === 'fountain') {
      // Fountain effect - particles shoot upward and fall
      return {
        x: (Math.random() - 0.5) * 100,
        y: [-Math.random() * 120 - 50, Math.random() * 50 + 100],
        scale: [1, 1.5, 0],
        opacity: [1, 0.9, 0],
        rotate: Math.random() * 720,
      };
    } else {
      // Burst effect - quick explosive outward motion
      return {
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
        scale: [1, 2, 0],
        opacity: [1, 0.7, 0],
        rotate: Math.random() * 360,
      };
    }
  };

  return (
    <motion.div
      className="absolute"
      initial={{ scale: 1, opacity: 1, x: 0, y: 0, rotate: 0 }}
      animate={getAnimation()}
      transition={{
        duration: Math.random() * 0.8 + 0.8, // 0.8-1.6 seconds
        ease: "easeOut",
        delay: delay,
      }}
    >
      {children}
    </motion.div>
  );
};

const ExplosionEffect = ({ isExploding, particleCount = 60, intensity = "high" }) => {
  const fireworkColors = [
    '#ff0040', '#ff4000', '#ff8000', '#ffff00', '#80ff00', '#00ff80',
    '#00ffff', '#0080ff', '#4000ff', '#ff00ff', '#ff0080', '#ffffff',
    '#ffd700', '#ff6347', '#32cd32', '#1e90ff', '#ff69b4', '#ffa500'
  ];

  const getParticleCount = () => {
    switch (intensity) {
      case 'low': return Math.min(particleCount, 30);
      case 'medium': return Math.min(particleCount, 45);
      case 'high': return particleCount;
      case 'epic': return particleCount * 1.5;
      default: return particleCount;
    }
  };

  const createParticle = (index) => {
    const size = Math.random() * 12 + 4; // 4-16px
    const isLarge = Math.random() > 0.7; // 30% chance of large particles
    const actualSize = isLarge ? size * 1.5 : size;
    
    const shape = Math.random();
    let particleElement;
    
    if (shape < 0.6) {
      // Circle particles (60%)
      particleElement = (
        <div
          style={{
            width: `${actualSize}px`,
            height: `${actualSize}px`,
            backgroundColor: fireworkColors[Math.floor(Math.random() * fireworkColors.length)],
            borderRadius: '50%',
            boxShadow: `0 0 ${actualSize/2}px currentColor`,
          }}
        />
      );
    } else if (shape < 0.8) {
      // Star particles (20%)
      particleElement = (
        <div
          style={{
            width: `${actualSize}px`,
            height: `${actualSize}px`,
            color: fireworkColors[Math.floor(Math.random() * fireworkColors.length)],
            fontSize: `${actualSize}px`,
            textShadow: `0 0 ${actualSize/2}px currentColor`,
          }}
        >
          ✦
        </div>
      );
    } else {
      // Diamond/square particles (20%)
      particleElement = (
        <div
          style={{
            width: `${actualSize}px`,
            height: `${actualSize}px`,
            backgroundColor: fireworkColors[Math.floor(Math.random() * fireworkColors.length)],
            borderRadius: '2px',
            transform: 'rotate(45deg)',
            boxShadow: `0 0 ${actualSize/2}px currentColor`,
          }}
        />
      );
    }

    // Determine explosion pattern
    let direction = 'radial';
    if (index < getParticleCount() * 0.6) {
      direction = 'radial'; // 60% radial explosion
    } else if (index < getParticleCount() * 0.8) {
      direction = 'fountain'; // 20% fountain effect
    } else {
      direction = 'burst'; // 20% burst effect
    }

    return (
      <FireworkParticle 
        key={`${index}-${Date.now()}`} 
        delay={Math.random() * 0.2}
        direction={direction}
      >
        {particleElement}
      </FireworkParticle>
    );
  };

  return (
    <AnimatePresence>
      {isExploding && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 1.2, opacity: 0 }}
        >
          {/* Main explosion wave */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-white"
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          
          {/* Secondary explosion ring */}
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-yellow-400"
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          />
          
          {/* Particles */}
          {Array.from({ length: getParticleCount() }).map((_, index) => 
            createParticle(index)
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExplosionEffect;
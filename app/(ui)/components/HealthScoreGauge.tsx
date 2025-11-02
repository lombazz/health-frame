"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface HealthScoreGaugeProps {
  score: number;
  className?: string;
}

export default function HealthScoreGauge({ score, className = '' }: HealthScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Animate score counting on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setAnimatedScore(prev => {
          if (prev >= score) {
            clearInterval(interval);
            return score;
          }
          return prev + 1;
        });
      }, 20);
      return () => clearInterval(interval);
    }, 300);

    return () => clearTimeout(timer);
  }, [score]);

  // Calculate gauge properties
  const radius = 85;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // emerald-500
    if (score >= 60) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 60) return 'Needs Attention';
    return 'Poor';
  };

  const gaugeVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <motion.div
        className="relative"
        variants={gaugeVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Overall health score: ${score} out of 100`}
        tabIndex={0}
        style={{
          filter: isHovered 
            ? 'drop-shadow(0 20px 40px rgba(16, 185, 129, 0.2))' 
            : 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.1))'
        }}
      >
        {/* Background glow effect */}
        <div 
          className="absolute inset-0 rounded-full transition-all duration-300"
          style={{
            background: isHovered 
              ? `radial-gradient(circle, ${getScoreColor(score)}15 0%, transparent 70%)`
              : 'transparent',
            transform: 'scale(1.2)'
          }}
        />
        
        {/* SVG Gauge */}
        <svg
          height={200}
          width={200}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            stroke="#e2e8f0"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={100}
            cy={100}
          />
          
          {/* Progress circle */}
          <motion.circle
            stroke={getScoreColor(score)}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={100}
            cy={100}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.3 }}
            style={{
              filter: isHovered ? 'brightness(1.1)' : 'brightness(1)'
            }}
          />
          
          {/* Gradient definition for shine effect */}
          <defs>
            <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          
          {/* Shine overlay when hovered */}
          {isHovered && (
            <motion.circle
              fill="url(#shineGradient)"
              r={normalizedRadius}
              cx={100}
              cy={100}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="text-5xl font-bold text-slate-900"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            {animatedScore}
          </motion.div>
          <div className="text-sm font-medium text-slate-600">out of 100</div>
        </div>
      </motion.div>

      {/* Score grade and description */}
      <motion.div 
        className="text-center space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <div 
          className="text-xl font-semibold"
          style={{ color: getScoreColor(score) }}
        >
          {getScoreGrade(score)}
        </div>
        <div className="text-sm text-slate-600 max-w-xs">
          Your overall health score based on key biomarker analysis
        </div>
      </motion.div>
    </div>
  );
}
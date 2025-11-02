"use client";

import { motion } from 'framer-motion';
import { useState } from 'react';
import StatusChip from './StatusChip';

interface BiomarkerCardProps {
  name: string;
  value: number;
  unit: string;
  refLow?: number;
  refHigh?: number;
  status: 'normal' | 'high' | 'low' | 'unknown';
  note?: string;
  clinicalSignificance?: 'high' | 'medium' | 'low';
  className?: string;
}

export default function BiomarkerCard({
  name,
  value,
  unit,
  refLow,
  refHigh,
  status,
  note,
  clinicalSignificance = 'medium',
  className = ''
}: BiomarkerCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate position percentage for visual indicator
  const getPositionPercentage = () => {
    if (refLow === undefined || refHigh === undefined) return 50;
    const range = refHigh - refLow;
    const position = ((value - refLow) / range) * 100;
    return Math.min(Math.max(position, 0), 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return '#10b981'; // emerald-500
      case 'high': return '#ef4444';   // red-500
      case 'low': return '#f59e0b';    // amber-500
      default: return '#6b7280';       // gray-500
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'low': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const cardVariants = {
    hover: {
      y: -4,
      boxShadow: "0 12px 24px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.2 }
    }
  };

  const shineVariants = {
    hover: {
      background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%)",
      transition: { duration: 0.3 }
    }
  };

  const positionPercentage = getPositionPercentage();

  return (
    <motion.div
      className={`relative border border-slate-200 rounded-xl p-6 space-y-4 bg-white cursor-pointer ${className}`}
      variants={cardVariants}
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      role="article"
      aria-labelledby={`biomarker-${name.replace(/\s+/g, '-').toLowerCase()}-title`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsHovered(!isHovered);
        }
      }}
    >
      {/* Shine overlay effect */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        variants={shineVariants}
        animate={isHovered ? "hover" : ""}
      />

      {/* Header with name and status */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div className="flex items-center gap-3">
          <h3 
            id={`biomarker-${name.replace(/\s+/g, '-').toLowerCase()}-title`}
            className="font-semibold text-slate-900 text-lg"
          >
            {name}
          </h3>
          <StatusChip status={status}>
            {status.toUpperCase()}
          </StatusChip>
          
          {/* Clinical significance indicator */}
          {clinicalSignificance === 'high' && (
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" 
                 title="High clinical significance" />
          )}
        </div>
        
        <div className="text-left sm:text-right">
          <div className="font-bold text-2xl text-slate-900">
            {value} <span className="text-lg font-medium text-slate-600">{unit}</span>
          </div>
          {refLow !== undefined && refHigh !== undefined && (
            <div className="text-sm text-slate-500">
              Normal: {refLow} - {refHigh} {unit}
            </div>
          )}
        </div>
      </div>

      {/* Visual indicator bar */}
      {refLow !== undefined && refHigh !== undefined && (
        <div className="relative" role="img" aria-label={`Value position: ${positionPercentage.toFixed(0)}% through normal range`}>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            {/* Gradient background showing zones */}
            <div 
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(to right, #fbbf24 0%, #10b981 20%, #10b981 80%, #ef4444 100%)'
              }}
            />
          </div>
          
          {/* Value position marker */}
          <motion.div 
            className="absolute top-0 w-1 h-3 bg-slate-900 rounded-full shadow-sm"
            style={{
              left: `${positionPercentage}%`,
              transform: 'translateX(-50%)'
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.2 }}
          />
          
          {/* Range labels */}
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>Low</span>
            <span>Normal</span>
            <span>High</span>
          </div>
        </div>
      )}

      {/* Note/Description */}
      {note && (
        <motion.p 
          className="text-slate-600 text-sm leading-relaxed"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: isHovered ? 1 : 0.8 }}
          transition={{ duration: 0.2 }}
        >
          {note}
        </motion.p>
      )}

      {/* Hover enhancement indicator */}
      <motion.div
        className="absolute top-2 right-2 w-2 h-2 rounded-full"
        style={{ backgroundColor: getStatusColor(status) }}
        animate={{
          scale: isHovered ? [1, 1.2, 1] : 1,
          opacity: isHovered ? [0.5, 1, 0.5] : 0.3
        }}
        transition={{
          duration: isHovered ? 1.5 : 0.3,
          repeat: isHovered ? Infinity : 0
        }}
      />
    </motion.div>
  );
}
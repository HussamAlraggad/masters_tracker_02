/**
 * Progress Ring Component
 * Circular progress indicator for degree completion
 */

'use client';

import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, Award, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MajorConfig } from '@/types';

interface ProgressRingProps {
  completedCredits: number;
  totalCredits: number;
  courseCredits: number;
  thesisCredits: number;
  major: MajorConfig;
  thesisTrackId: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ProgressRing({
  completedCredits,
  totalCredits,
  courseCredits,
  thesisCredits,
  major,
  thesisTrackId,
  size = 200,
  strokeWidth = 12,
  className,
}: ProgressRingProps) {
  const progress = totalCredits > 0 ? completedCredits / totalCredits : 0;
  const courseProgress = courseCredits > 0 ? Math.min(completedCredits, courseCredits) / courseCredits : 0;
  const thesisProgress = thesisCredits > 0 ? Math.max(0, completedCredits - courseCredits) / thesisCredits : 0;
  
  const thesisTrack = major.thesisPatterns.find(t => t.id === thesisTrackId);
  const circumference = 2 * Math.PI * (size / 2 - strokeWidth);
  const dashOffset = circumference * (1 - progress);
  
  const radius = size / 2 - strokeWidth;
  const center = size / 2;

  return (
    <div className={cn('relative flex flex-col items-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--glass-border)"
            strokeWidth={strokeWidth}
          />
          
          {/* Course progress ring */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--status-passed)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - courseProgress)}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - courseProgress) }}
            transition={{ duration: 1.5, delay: 0.2, ease: 'easeOut' }}
            className="filter drop-shadow-[0_0_8px_var(--status-passed)]"
          />
          
          {/* Thesis progress ring (inner) */}
          {thesisCredits > 0 && (
            <motion.circle
              cx={center}
              cy={center}
              r={radius * 0.6}
              fill="none"
              stroke="var(--nebula-primary)"
              strokeWidth={strokeWidth * 0.8}
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * radius * 0.6}
              strokeDashoffset={2 * Math.PI * radius * 0.6 * (1 - thesisProgress)}
              initial={{ strokeDashoffset: 2 * Math.PI * radius * 0.6 }}
              animate={{ strokeDashoffset: 2 * Math.PI * radius * 0.6 * (1 - thesisProgress) }}
              transition={{ duration: 1.5, delay: 0.4, ease: 'easeOut' }}
              className="filter drop-shadow-[0_0_8px_var(--nebula-primary)]"
            />
          )}
          
          {/* Overall progress ring (outer glow) */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--nebula-primary)"
            strokeWidth={2}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            opacity={0.3}
            initial={{ strokeDashoffset: circumference }}
            animate={{ 
              strokeDashoffset: dashOffset,
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ 
              duration: 1.5, 
              delay: 0.1, 
              ease: 'easeOut',
              repeat: Infinity,
              repeatDelay: 2,
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="glass-strong flex items-center justify-center"
            style={{
              width: size * 0.45,
              height: size * 0.45,
              borderRadius: '50%',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 15, delay: 0.5 }}
          >
            <GraduationCap className="text-nebula-primary" size={size * 0.18} />
          </motion.div>
          
          <div className="absolute bottom-[-50px] left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <motion.div
              className="glass-strong px-4 py-2 rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-star-white font-heading text-xl font-bold font-mono">
                {completedCredits} / {totalCredits}
              </p>
              <p className="text-starlight-dim text-xs">Credits Completed</p>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Stats breakdown */}
      <div className="grid grid-cols-2 gap-3 mt-6 w-full max-w-xs">
        <motion.div
          className="glass p-4 rounded-xl text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <BookOpen className="text-status-passed mx-auto mb-2" size={24} />
          <p className="text-star-white font-heading text-2xl font-bold font-mono">
            {Math.min(completedCredits, courseCredits)}
          </p>
          <p className="text-starlight-dim text-sm mt-1">Course Credits</p>
          <p className="text-starlight-muted text-xs mt-0.5">
            of {courseCredits} required
          </p>
        </motion.div>
        
        <motion.div
          className="glass p-4 rounded-xl text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Award className="text-nebula-primary mx-auto mb-2" size={24} />
          <p className="text-star-white font-heading text-2xl font-bold font-mono">
            {Math.max(0, completedCredits - courseCredits)}
          </p>
          <p className="text-starlight-dim text-sm mt-1">Thesis Credits</p>
          <p className="text-starlight-muted text-xs mt-0.5">
            of {thesisCredits} required ({thesisTrack?.label})
          </p>
        </motion.div>
      </div>
      
      {/* Percentage */}
      <motion.div
        className="mt-4 glass px-6 py-2 rounded-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <p className="text-center">
          <span className="font-heading text-2xl font-bold text-nebula-primary font-mono">
            {Math.round(progress * 100)}%
          </span>
          <span className="text-starlight-dim ml-2">Degree Complete</span>
        </p>
      </motion.div>
    </div>
  );
}

// ============================================================
// Mini Progress Ring (for compact spaces)
// ============================================================

interface MiniProgressRingProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
}

export function MiniProgressRing({
  completed,
  total,
  size = 60,
  strokeWidth = 6,
  showLabel = true,
  className,
}: MiniProgressRingProps) {
  const progress = total > 0 ? completed / total : 0;
  const circumference = 2 * Math.PI * (size / 2 - strokeWidth);
  const dashOffset = circumference * (1 - progress);
  const radius = size / 2 - strokeWidth;
  const center = size / 2;

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--glass-border)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--nebula-primary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="filter drop-shadow-[0_0_6px_var(--nebula-primary)]"
        />
      </svg>
      
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="font-heading font-bold font-mono text-star-white text-sm">
            {Math.round(progress * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Semester Progress Card
// ============================================================

interface SemesterProgressCardProps {
  semester: string;
  plannedCredits: number;
  completedCredits: number;
  maxCredits: number;
  coursesCount: number;
  status: 'planning' | 'confirmed' | 'completed';
  onClick?: () => void;
}

export function SemesterProgressCard({
  semester,
  plannedCredits,
  completedCredits,
  maxCredits,
  coursesCount,
  status,
  onClick,
}: SemesterProgressCardProps) {
  const progress = maxCredits > 0 ? completedCredits / maxCredits : 0;
  const circumference = 2 * Math.PI * 30;
  const dashOffset = circumference * (1 - progress);
  
  const statusConfig = {
    planning: { icon: Target, color: 'var(--status-pending)', label: 'Planning' },
    confirmed: { icon: BookOpen, color: 'var(--status-registered)', label: 'Confirmed' },
    completed: { icon: Award, color: 'var(--status-passed)', label: 'Completed' },
  };
  
  const { icon: StatusIcon, color, label } = statusConfig[status];

  return (
    <motion.button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'glass p-4 rounded-xl flex items-center gap-4 transition-all',
        'hover:border-nebula-muted/50 hover:shadow-lg',
        'active:scale-[0.98]',
        onClick ? 'cursor-pointer' : 'cursor-default opacity-70'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="relative flex-shrink-0" style={{ width: 70, height: 70 }}>
        <svg width={70} height={70} className="transform -rotate-90">
          <circle cx={35} cy={35} r={30} fill="none" stroke="var(--glass-border)" strokeWidth={6} />
          <motion.circle
            cx={35}
            cy={35}
            r={30}
            fill="none"
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="filter"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <StatusIcon className="text-star-white" size={20} />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-heading font-medium text-star-white truncate">
            {semester.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </p>
          <span className={cn('px-2 py-1 rounded text-xs font-medium', `status-${status}`)}>
            {label}
          </span>
        </div>
        <p className="text-starlight-dim text-sm mt-1">
          {completedCredits} / {plannedCredits} credits completed
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs text-starlight-muted">
          <span className="flex items-center gap-1">
            <BookOpen size={10} /> {coursesCount} courses
          </span>
          <span className="flex items-center gap-1">
            <Target size={10} /> {maxCredits} credits planned
          </span>
        </div>
      </div>
    </motion.button>
  );
}
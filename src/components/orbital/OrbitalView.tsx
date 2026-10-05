/**
 * Orbital Course Visualization - Main Canvas Component
 * Courses orbit around a central degree core
 */

'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, BookOpen, GraduationCap, AlertCircle, Clock, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Course, CourseStatus, MajorConfig } from '@/types';

// ============================================================
// TYPES
// ============================================================

interface OrbitNodeProps {
  course: Course;
  status: CourseStatus;
  index: number;
  total: number;
  radius: number;
  centerX: number;
  centerY: number;
  onClick: () => void;
  isSelected: boolean;
  animationDelay: number;
}

interface DegreeCoreProps {
  major: MajorConfig;
  thesisTrackId: string;
  completedCredits: number;
  totalCredits: number;
  centerX: number;
  centerY: number;
  size: number;
}

interface StarProps {
  x: number;
  y: number;
  size: number;
  opacity: number;
  delay: number;
}

// ============================================================
// STARFIELD BACKGROUND
// ============================================================

function Starfield({ width, height, starCount = 150 }: { width: number; height: number; starCount?: number }) {
  const stars = useMemo(() => 
    Array.from({ length: starCount }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      delay: Math.random() * 4,
      twinkleSpeed: Math.random() * 2 + 1,
    }))
  , [width, height, starCount]);

  return (
    <svg width={width} height={height} className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <defs>
        <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      {stars.map((star, i) => (
        <motion.circle
          key={i}
          cx={star.x}
          cy={star.y}
          r={star.size}
          fill="url(#starGlow)"
          opacity={star.opacity}
          animate={{
            opacity: [star.opacity, star.opacity * 2, star.opacity],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={{
            duration: star.twinkleSpeed * 2,
            delay: star.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </svg>
  );
}

// ============================================================
// ORBIT PATH
// ============================================================

function OrbitPath({ radius, centerX, centerY, color = 'var(--glass-border)' }: { 
  radius: number; 
  centerX: number; 
  centerY: number; 
  color?: string;
}) {
  return (
    <circle
      cx={centerX}
      cy={centerY}
      r={radius}
      fill="none"
      stroke={color}
      strokeWidth="1"
      strokeDasharray="4 4"
      className="opacity-30"
    />
  );
}

// ============================================================
// DEGREE CORE (CENTER)
// ============================================================

function DegreeCore({ 
  major, 
  thesisTrackId, 
  completedCredits, 
  totalCredits, 
  centerX, 
  centerY, 
  size 
}: DegreeCoreProps) {
  const progress = totalCredits > 0 ? completedCredits / totalCredits : 0;
  const thesisTrack = major.thesisPatterns.find(t => t.id === thesisTrackId);
  
  return (
    <g transform={`translate(${centerX}, ${centerY})`}>
      {/* Outer glow ring */}
      <motion.circle
        r={size + 20}
        fill="none"
        stroke="var(--nebula-primary)"
        strokeWidth={2}
        opacity={0.3}
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Progress ring background */}
      <circle
        r={size + 8}
        fill="none"
        stroke="var(--glass-border)"
        strokeWidth={6}
      />
      
      {/* Progress ring foreground */}
      <motion.circle
        r={size + 8}
        fill="none"
        stroke="var(--nebula-primary)"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={`${2 * Math.PI * (size + 8)}`}
        strokeDashoffset={`${2 * Math.PI * (size + 8) * (1 - progress)}`}
        transform="rotate(-90)"
        initial={{ strokeDashoffset: 2 * Math.PI * (size + 8) }}
        animate={{ strokeDashoffset: 2 * Math.PI * (size + 8) * (1 - progress) }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="animate-pulse-glow"
      />
      
      {/* Core circle */}
      <motion.div
        className="glass-strong flex items-center justify-center"
        style={{
          width: size * 2,
          height: size * 2,
          borderRadius: '50%',
          left: -size,
          top: -size,
          position: 'absolute',
        }}
        animate={{ 
          scale: [1, 1.02, 1],
          boxShadow: [
            '0 0 20px var(--nebula-primary/0.3)',
            '0 0 30px var(--nebula-primary/0.5)',
            '0 0 20px var(--nebula-primary/0.3)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <GraduationCap className="text-nebula-primary" size={size * 0.6} />
      </motion.div>
      
      {/* Progress text */}
      <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <p className="text-star-white font-heading text-lg font-bold">
          {completedCredits} / {totalCredits} Credits
        </p>
        <p className="text-starlight-dim text-xs mt-1">
          {thesisTrack?.label || 'Thesis'} Track
        </p>
      </div>
    </g>
  );
}

// ============================================================
// ORBIT NODE (COURSE)
// ============================================================

function OrbitNode({ 
  course, 
  status, 
  index, 
  total, 
  radius, 
  centerX, 
  centerY, 
  onClick, 
  isSelected,
  animationDelay 
}: OrbitNodeProps) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);
  
  const statusConfig: Record<CourseStatus, { icon: React.ReactNode; color: string; label: string }> = {
    pending: { icon: <Clock size={14} />, color: 'var(--status-pending)', label: 'Pending' },
    registered: { icon: <BookOpen size={14} />, color: 'var(--status-registered)', label: 'Registered' },
    passed: { icon: <Check size={14} />, color: 'var(--status-passed)', label: 'Passed' },
    failed: { icon: <AlertCircle size={14} />, color: 'var(--status-failed)', label: 'Failed' },
  };
  
  const { icon, color, label } = statusConfig[status];
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Orbit line from center */}
      <line
        x1={0}
        y1={0}
        x2={-radius * Math.cos(angle)}
        y2={-radius * Math.sin(angle)}
        stroke="var(--glass-border)"
        strokeWidth={1}
        strokeDasharray="2 4"
        opacity={0.2}
      />
      
      {/* Course node */}
      <motion.g
        onClick={onClick}
        style={{ cursor: 'pointer' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          delay: animationDelay, 
          duration: 0.5, 
          type: 'spring', 
          stiffness: 100, 
          damping: 15 
        }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Status ring */}
        <motion.circle
          r={32}
          fill="none"
          stroke={color}
          strokeWidth={isSelected ? 3 : 2}
          opacity={isSelected ? 1 : 0.6}
          animate={{ 
            rotate: [0, 360],
            strokeDasharray: ['0 100', '50 50', '0 100'],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Node core */}
        <motion.div
          className={cn(
            'glass-strong flex items-center justify-center orbit-node-core',
            'border-2 transition-all duration-300',
            isSelected ? 'border-nebula-primary scale-110' : `border-${color.replace('var(--', '').replace(')', '')}/50`
          )}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            left: -28,
            top: -28,
            position: 'absolute',
            boxShadow: isSelected 
              ? `0 0 24px ${color}` 
              : '0 0 12px var(--nebula-primary/0.2)',
          }}
          animate={{ 
            boxShadow: isSelected 
              ? [`0 0 24px ${color}`, `0 0 32px ${color}`, `0 0 24px ${color}`]
              : [`0 0 12px var(--nebula-primary/0.2)`, `0 0 16px var(--nebula-primary/0.3)`, `0 0 12px var(--nebula-primary/0.2)`],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {icon}
        </motion.div>
        
        {/* Course code label */}
        <motion.div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 whitespace-nowrap"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isSelected ? 1 : 0, y: isSelected ? 0 : 10 }}
          transition={{ duration: 0.2 }}
        >
          <span className="glass px-2 py-1 rounded text-xs font-mono text-starlight-dim">
            {course.code}
          </span>
        </motion.div>
        
        {/* Status badge */}
        <motion.div
          className="absolute bottom-[-28px] left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <span className={cn('status-badge text-xs', `status-${status}`)}>
            {label}
          </span>
        </motion.div>
      </motion.g>
    </g>
  );
}

// ============================================================
// TOOLTIP
// ============================================================

function CourseTooltip({ 
  course, 
  status, 
  x, 
  y, 
  visible 
}: { 
  course: Course; 
  status: CourseStatus; 
  x: number; 
  y: number; 
  visible: boolean;
}) {
  if (!visible) return null;
  
  const statusConfig: Record<CourseStatus, { color: string; label: string }> = {
    pending: { color: 'var(--status-pending)', label: 'Pending' },
    registered: { color: 'var(--status-registered)', label: 'Registered' },
    passed: { color: 'var(--status-passed)', label: 'Passed' },
    failed: { color: 'var(--status-failed)', label: 'Failed' },
  };
  
  const { color, label } = statusConfig[status];
  
  return (
    <motion.div
      className="glass-strong pointer-events-none z-50"
      style={{
        left: x + 40,
        top: y - 60,
        position: 'absolute',
        maxWidth: 280,
        padding: '16px',
        borderRadius: '12px',
        border: `1px solid ${color}`,
      }}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start gap-3">
        <div className="glass-strong p-3 rounded-xl flex-shrink-0" style={{ borderColor: color }}>
          <Target className="text-nebula-primary" size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-star-white font-medium truncate">{course.nameEn}</p>
          <p className="text-starlight-dim text-sm truncate mt-0.5">{course.nameAr}</p>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="flex items-center gap-1 text-starlight-dim">
              <BookOpen size={10} /> {course.credits} credits
            </span>
            <span className={cn('px-2 py-0.5 rounded text-xs font-medium', `status-${status}`)}>
              {label}
            </span>
          </div>
          {course.description && (
            <p className="text-starlight-muted text-sm mt-3 line-clamp-2">{course.description}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// MAIN ORBITAL VIEW
// ============================================================

interface OrbitalViewProps {
  courses: Course[];
  progress: Map<string, CourseStatus>;
  major: MajorConfig;
  thesisTrackId: string;
  completedCredits: number;
  totalCredits: number;
  selectedCourseId: string | null;
  onCourseClick: (courseId: string) => void;
  className?: string;
}

export function OrbitalView({
  courses,
  progress,
  major,
  thesisTrackId,
  completedCredits,
  totalCredits,
  selectedCourseId,
  onCourseClick,
  className,
}: OrbitalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredCourse, setHoveredCourse] = useState<Course | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  
  // Non-thesis courses for orbit
  const orbitCourses = useMemo(() => 
    courses.filter(c => !c.isThesis).sort((a, b) => a.courseId.localeCompare(b.courseId))
  , [courses]);
  
  // Calculate responsive dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;
  const coreSize = Math.min(dimensions.width, dimensions.height) * 0.12;
  const maxRadius = Math.min(dimensions.width, dimensions.height) * 0.4;
  const minRadius = coreSize + 60;
  
  // Distribute courses across 2-3 orbital rings
  const getOrbitRadius = useCallback((index: number, total: number) => {
    if (total <= 6) {
      return minRadius + (maxRadius - minRadius) * 0.5;
    }
    const ringCount = total > 12 ? 3 : 2;
    const ringIndex = Math.floor(index / (total / ringCount));
    const ringProgress = ringIndex / (ringCount - 1);
    return minRadius + (maxRadius - minRadius) * (0.3 + ringProgress * 0.6);
  }, [minRadius, maxRadius]);
  
  if (dimensions.width === 0 || dimensions.height === 0) {
    return (
      <div 
        ref={containerRef} 
        className={cn('relative glass rounded-3xl', className)}
        style={{ minHeight: 400, minWidth: 400 }}
        role="img"
        aria-label="Course orbital visualization loading"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="glass-strong p-6 rounded-2xl flex flex-col items-center gap-4"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <GraduationCap className="text-nebula-primary" size={48} />
            <p className="text-star-white font-heading">Loading constellation...</p>
          </motion.div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef} 
      className={cn('relative glass rounded-3xl overflow-hidden', className)}
      style={{ minHeight: 500 }}
      onMouseMove={(e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setHoverPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }
      }}
      onMouseLeave={() => setHoveredCourse(null)}
    >
      {/* Starfield background */}
      <Starfield width={dimensions.width} height={dimensions.height} starCount={120} />
      
      {/* SVG Canvas for orbits and nodes */}
      <svg 
        width={dimensions.width} 
        height={dimensions.height} 
        className="absolute inset-0 pointer-events-none"
        role="img"
        aria-label={`Course constellation for ${major.name}. ${orbitCourses.length} courses orbiting the degree core.`}
      >
        {/* Orbital paths */}
        {orbitCourses.map((course, index) => {
          const radius = getOrbitRadius(index, orbitCourses.length);
          return <OrbitPath key={course.courseId} radius={radius} centerX={centerX} centerY={centerY} />;
        })}
        
        {/* Degree core */}
        <DegreeCore
          major={major}
          thesisTrackId={thesisTrackId}
          completedCredits={completedCredits}
          totalCredits={totalCredits}
          centerX={centerX}
          centerY={centerY}
          size={coreSize}
        />
        
        {/* Course nodes */}
        {orbitCourses.map((course, index) => {
          const radius = getOrbitRadius(index, orbitCourses.length);
          const angle = (index / orbitCourses.length) * Math.PI * 2 - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          const status = progress.get(course.courseId) || 'pending';
          const isSelected = selectedCourseId === course.courseId;
          
          return (
            <OrbitNode
              key={course.courseId}
              course={course}
              status={status}
              index={index}
              total={orbitCourses.length}
              radius={radius}
              centerX={centerX}
              centerY={centerY}
              onClick={() => onCourseClick(course.courseId)}
              isSelected={isSelected}
              animationDelay={index * 0.08}
            />
          );
        })}
      </svg>
      
      {/* Tooltip */}
      <AnimatePresence>
        {hoveredCourse && (
          <CourseTooltip
            course={hoveredCourse}
            status={progress.get(hoveredCourse.courseId) || 'pending'}
            x={hoverPosition.x}
            y={hoverPosition.y}
            visible={true}
          />
        )}
      </AnimatePresence>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap justify-center gap-2 pointer-events-none">
        <div className="glass px-4 py-2 rounded-xl flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--status-pending)' }} />
            <span className="text-starlight-dim">Pending</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--status-registered)' }} />
            <span className="text-starlight-dim">Registered</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--status-passed)' }} />
            <span className="text-starlight-dim">Passed</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--status-failed)' }} />
            <span className="text-starlight-dim">Failed</span>
          </span>
        </div>
      </div>
    </div>
  );
}
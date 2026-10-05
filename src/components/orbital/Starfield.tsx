/**
 * Starfield Background Component
 * Animated starfield with twinkling stars
 */

'use client';

import { useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StarfieldProps {
  width: number;
  height: number;
  starCount?: number;
  className?: string;
}

export function Starfield({ width, height, starCount = 150, className }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const starsRef = useRef<Array<{
    x: number;
    y: number;
    size: number;
    opacity: number;
    baseOpacity: number;
    speed: number;
    phase: number;
  }>>([]);

  // Initialize stars
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Generate stars
    starsRef.current = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.4 + 0.1,
      baseOpacity: Math.random() * 0.4 + 0.1,
      speed: Math.random() * 0.002 + 0.001,
      phase: Math.random() * Math.PI * 2,
    }));

    // Animation loop
    const animate = () => {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, width, height);
      
      starsRef.current.forEach(star => {
        // Twinkle effect
        star.opacity = star.baseOpacity + Math.sin(Date.now() * star.speed + star.phase) * star.baseOpacity * 0.5;
        
        // Draw star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();
        
        // Subtle glow for larger stars
        if (star.size > 1) {
          const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3);
          gradient.addColorStop(0, `rgba(180, 190, 255, ${star.opacity * 0.3})`);
          gradient.addColorStop(1, 'rgba(180, 190, 255, 0)');
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height, starCount]);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
    }
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
      aria-hidden="true"
    />
  );
}

// ============================================================
// CSS-BASED STARFIELD (Alternative, lighter weight)
// ============================================================

interface CSSStarfieldProps {
  starCount?: number;
  className?: string;
}

export function CSSStarfield({ starCount = 80, className }: CSSStarfieldProps) {
  const stars = useMemo(() => {
    return Array.from({ length: starCount }, (_, i) => ({
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 0.5}px`,
      opacity: Math.random() * 0.5 + 0.1,
      delay: `${Math.random() * 4}s`,
      duration: `${Math.random() * 3 + 2}s`,
      color: Math.random() > 0.7 ? 'var(--nebula-primary)' : 'white',
    }));
  }, [starCount]);

  return (
    <div 
      className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}
      aria-hidden="true"
      style={{ 
        background: `
          radial-gradient(ellipse at 20% 20%, var(--nebula-primary/0.03) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, var(--nebula-secondary/0.03) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, var(--space-deep) 0%, var(--space-void) 100%)
        `
      }}
    >
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: star.x,
            top: star.y,
            width: star.size,
            height: star.size,
            backgroundColor: star.color,
            opacity: star.opacity,
            filter: star.color !== 'white' ? 'blur(1px)' : 'none',
          }}
          animate={{
            opacity: [star.opacity, star.opacity * 1.5, star.opacity],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={{
            duration: parseFloat(star.duration),
            delay: parseFloat(star.delay),
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
/**
 * Semester Planner Panel
 * Shows offered courses for a semester, allows picking 2-3 courses
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Minus, 
  CheckCircle, 
  BookOpen, 
  Target, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Course, CourseStatus, SemesterSeason, MajorConfig } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface SemesterPlannerProps {
  semester: string;
  season: SemesterSeason;
  year: number;
  offeredCourses: Course[];
  allCourses: Course[];
  selectedCourseIds: string[];
  courseStatuses: Map<string, CourseStatus>;
  major: MajorConfig;
  thesisTrackId: string;
  maxCredits: number;
  minCredits: number;
  creditsPerCourse: number;
  onSelectionChange: (courseIds: string[]) => void;
  onCourseClick?: (course: Course) => void;
  isReadOnly?: boolean;
}

const SEASON_LABELS: Record<SemesterSeason, string> = {
  fall: 'Fall',
  spring: 'Spring',
  summer: 'Summer',
};

const SEASON_ICONS: Record<SemesterSeason, React.ReactNode> = {
  fall: <span className="text-amber-400">🍂</span>,
  spring: <span className="text-green-400">🌱</span>,
  summer: <span className="text-yellow-400">☀️</span>,
};

export function SemesterPlanner({
  semester,
  season,
  year,
  offeredCourses,
  allCourses,
  selectedCourseIds,
  courseStatuses,
  major,
  thesisTrackId,
  maxCredits,
  minCredits,
  creditsPerCourse,
  onSelectionChange,
  onCourseClick,
  isReadOnly = false,
}: SemesterPlannerProps) {
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [showAllCourses, setShowAllCourses] = useState(false);
  
  const selectedCount = selectedCourseIds.length;
  const selectedCredits = selectedCount * creditsPerCourse;
  const canAddMore = selectedCount < (maxCredits / creditsPerCourse);
  const meetsMinimum = selectedCount >= (minCredits / creditsPerCourse);
  const isThesisSelected = selectedCourseIds.some(id => {
    const course = allCourses.find(c => c.courseId === id);
    return course?.isThesis;
  });

  // Get thesis course for this track
  const thesisCourse = useMemo(() => 
    allCourses.find(c => c.isThesis && c.thesisPatternId === thesisTrackId)
  , [allCourses, thesisTrackId]);

  // Courses already completed/registered (not selectable)
  const unavailableCourseIds = useMemo(() => {
    const ids = new Set<string>();
    courseStatuses.forEach((status, courseId) => {
      if (status === 'passed' || status === 'registered') {
        ids.add(courseId);
      }
    });
    return ids;
  }, [courseStatuses]);

  // Filter offered courses - exclude unavailable
  const availableOffered = useMemo(() => 
    offeredCourses.filter(c => !unavailableCourseIds.has(c.courseId))
  , [offeredCourses, unavailableCourseIds]);

  // Other courses not offered this semester (for "show all" mode)
  const otherCourses = useMemo(() => 
    allCourses.filter(c => 
      !c.isThesis && 
      !offeredCourses.some(oc => oc.courseId === c.courseId) &&
      !unavailableCourseIds.has(c.courseId)
    )
  , [allCourses, offeredCourses, unavailableCourseIds]);

  const toggleCourse = useCallback((courseId: string) => {
    if (isReadOnly) return;
    
    const isSelected = selectedCourseIds.includes(courseId);
    const newSelection = isSelected
      ? selectedCourseIds.filter(id => id !== courseId)
      : [...selectedCourseIds, courseId];
    
    // Validate credit limit
    if (newSelection.length * creditsPerCourse > maxCredits) return;
    
    onSelectionChange(newSelection);
  }, [selectedCourseIds, maxCredits, creditsPerCourse, onSelectionChange, isReadOnly]);

  const toggleThesis = useCallback(() => {
    if (isReadOnly || !thesisCourse) return;
    
    const isSelected = selectedCourseIds.includes(thesisCourse.courseId);
    const newSelection = isSelected
      ? selectedCourseIds.filter(id => id !== thesisCourse.courseId)
      : [...selectedCourseIds, thesisCourse.courseId];
    
    onSelectionChange(newSelection);
  }, [selectedCourseIds, thesisCourse, onSelectionChange, isReadOnly]);

  const getStatusBadge = (status: CourseStatus) => {
    const config = {
      pending: { label: 'Available', className: 'status-pending' },
      registered: { label: 'Registered', className: 'status-registered' },
      passed: { label: 'Completed', className: 'status-passed' },
      failed: { label: 'Failed', className: 'status-failed' },
    };
    return config[status];
  };

  return (
    <Card className="glass-card h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-glass-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="glass-strong p-3 rounded-xl">
              {SEASON_ICONS[season]}
            </div>
            <div>
              <CardTitle className="text-star-white font-heading text-lg">
                {SEASON_LABELS[season]} {year}
              </CardTitle>
              <p className="text-starlight-dim text-sm">
                {availableOffered.length} courses offered • Pick {minCredits/creditsPerCourse}-{maxCredits/creditsPerCourse} courses
              </p>
            </div>
          </div>
          
          {/* Credit counter */}
          <div className="glass-strong px-4 py-2 rounded-xl flex items-center gap-2">
            <CreditCard className="text-nebula-primary" size={16} />
            <span className={cn(
              'font-mono font-bold text-lg',
              selectedCredits > maxCredits ? 'text-status-failed' : 
              meetsMinimum ? 'text-status-passed' : 'text-status-pending'
            )}>
              {selectedCredits}/{maxCredits}
            </span>
            <span className="text-starlight-dim text-sm">credits</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-starlight-dim">Credit Load</span>
            <span className="font-mono text-star-white">
              {selectedCredits} / {maxCredits} ({minCredits} min)
            </span>
          </div>
          <div className="h-2 glass-strong rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: selectedCredits > maxCredits 
                  ? 'var(--status-failed)' 
                  : meetsMinimum 
                    ? 'var(--status-passed)' 
                    : 'var(--nebula-primary)',
                width: `${Math.min(100, (selectedCredits / maxCredits) * 100)}%`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (selectedCredits / maxCredits) * 100)}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Thesis option */}
        {thesisCourse && (
          <motion.div
            className={cn(
              'glass mb-4 p-4 rounded-xl border-2 transition-all',
              isThesisSelected ? 'border-nebula-primary bg-nebula-primary/10' : 'border-glass-border'
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Label className="flex items-center gap-3 cursor-pointer w-full">
              <Checkbox
                checked={isThesisSelected}
                onCheckedChange={toggleThesis}
                disabled={isReadOnly}
                className="data-[state=checked]:bg-nebula-primary data-[state=checked]:border-nebula-primary"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Target className="text-nebula-primary" size={18} />
                  <span className="text-star-white font-medium">{thesisCourse.nameEn}</span>
                  <Badge variant="outline" className="text-xs ml-auto">
                    {thesisCourse.credits} credits
                  </Badge>
                </div>
                <p className="text-starlight-dim text-sm mt-1 ml-6">
                  {thesisCourse.description || 'Thesis requirement for graduation'}
                </p>
              </div>
            </Label>
          </motion.div>
        )}

        {/* Offered Courses Section */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-starlight-dim font-medium text-sm uppercase tracking-wider">
              Courses Offered This Semester
            </h3>
            <Badge variant="outline" className="text-xs">
              {availableOffered.length} available
            </Badge>
          </div>

          <ScrollArea className="flex-1 pr-1">
            <div className="space-y-2">
              {availableOffered.map((course, index) => {
                const status = courseStatuses.get(course.courseId) || 'pending';
                const isSelected = selectedCourseIds.includes(course.courseId);
                const isUnavailable = unavailableCourseIds.has(course.courseId);
                const badge = getStatusBadge(status);
                
                return (
                  <motion.div
                    key={course.courseId}
                    className={cn(
                      'glass group relative overflow-hidden rounded-xl transition-all',
                      isSelected ? 'border-nebula-primary/50 bg-nebula-primary/5' : 'border-glass-border hover:border-nebula-muted/30',
                      isUnavailable && !isSelected ? 'opacity-50' : ''
                    )}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    layout
                  >
                    <button
                      onClick={() => {
                        if (!isUnavailable || isSelected) {
                          toggleCourse(course.courseId);
                        }
                        onCourseClick?.(course);
                      }}
                      disabled={isReadOnly || (isUnavailable && !isSelected)}
                      className="w-full p-4 flex items-center gap-4 text-left"
                      aria-pressed={isSelected}
                      aria-label={`${course.nameEn}, ${badge.label}, ${course.credits} credits`}
                    >
                      {/* Selection indicator */}
                      <motion.div
                        className={cn(
                          'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                          isSelected 
                            ? 'bg-nebula-primary border-nebula-primary' 
                            : 'bg-space-deep border-glass-border'
                        )}
                        animate={{ scale: isSelected ? 1.05 : 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      >
                        {isSelected ? (
                          <CheckCircle className="text-space-void" size={18} />
                        ) : (
                          <BookOpen className="text-starlight-dim" size={18} />
                        )}
                      </motion.div>

                      {/* Course info */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'font-medium truncate',
                          isSelected ? 'text-star-white' : 'text-starlight-dim'
                        )}>
                          {course.code}: {course.nameEn}
                        </p>
                        <p className="text-starlight-muted text-sm truncate mt-0.5">
                          {course.nameAr}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs text-starlight-muted">
                            <BookOpen size={10} /> {course.credits} credits
                          </span>
                          <Badge 
                            variant="outline" 
                            className={cn('text-xs', badge.className)}
                          >
                            {badge.label}
                          </Badge>
                          {course.type === 'core' && (
                            <Badge variant="secondary" className="text-xs">
                              Core
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Expand toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCourseId(expandedCourseId === course.courseId ? null : course.courseId);
                        }}
                        className="flex-shrink-0 p-1 text-starlight-muted hover:text-star-white transition-colors"
                        aria-expanded={expandedCourseId === course.courseId}
                        aria-label="Show details"
                      >
                        {expandedCourseId === course.courseId ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                    </button>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {expandedCourseId === course.courseId && (
                        <motion.div
                          className="glass px-4 pb-4 border-t border-glass-border"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-starlight-muted">Type:</span>
                              <span className="ml-2 text-star-white capitalize">{course.type}</span>
                            </div>
                            <div>
                              <span className="text-starlight-muted">Offered:</span>
                              <span className="ml-2 text-star-white">
                                {course.semesterOffered.map(s => SEASON_LABELS[s]).join(', ')}
                              </span>
                            </div>
                            {course.description && (
                              <div className="col-span-2 mt-2 p-3 glass-strong rounded-lg">
                                <p className="text-starlight-dim">{course.description}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {availableOffered.length === 0 && (
                <div className="glass text-center py-8 rounded-xl">
                  <AlertTriangle className="text-status-pending mx-auto mb-2" size={32} />
                  <p className="text-starlight-dim">No courses available for selection</p>
                  <p className="text-starlight-muted text-sm mt-1">
                    All offered courses are already completed or registered
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Show all courses toggle */}
        {otherCourses.length > 0 && (
          <button
            onClick={() => setShowAllCourses(!showAllCourses)}
            className="glass px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-starlight-dim hover:text-star-white transition-colors mt-2"
          >
            {showAllCourses ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>{showAllCourses ? 'Hide' : 'Show'} other courses ({otherCourses.length})</span>
          </button>
        )}

        {/* All other courses */}
        <AnimatePresence>
          {showAllCourses && otherCourses.length > 0 && (
            <motion.div
              className="mt-3 space-y-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Separator className="my-2" />
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-starlight-dim font-medium text-sm uppercase tracking-wider">
                  Other Courses (Not Offered This Semester)
                </h3>
                <Badge variant="secondary" className="text-xs">
                  Register if available
                </Badge>
              </div>
              <ScrollArea className="max-h-48 pr-1">
                <div className="space-y-1">
                  {otherCourses.map((course, index) => {
                    const status = courseStatuses.get(course.courseId) || 'pending';
                    const isSelected = selectedCourseIds.includes(course.courseId);
                    const badge = getStatusBadge(status);
                    
                    return (
                      <motion.div
                        key={course.courseId}
                        className={cn(
                          'glass group p-3 rounded-lg flex items-center gap-3 transition-colors',
                          isSelected ? 'border-nebula-primary/50' : 'hover:border-nebula-muted/30'
                        )}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleCourse(course.courseId)}
                          disabled={isReadOnly || unavailableCourseIds.has(course.courseId)}
                          className="data-[state=checked]:bg-nebula-primary data-[state=checked]:border-nebula-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={cn('font-medium text-sm truncate', isSelected ? 'text-star-white' : 'text-starlight-dim')}>
                            {course.code}: {course.nameEn}
                          </p>
                          <p className="text-starlight-muted text-xs truncate">{course.nameAr}</p>
                        </div>
                        <Badge variant="outline" className={cn('text-xs', badge.className)}>
                          {badge.label}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {course.credits} cr
                        </Badge>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Validation messages */}
        <AnimatePresence>
          {!meetsMinimum && selectedCount > 0 && (
            <motion.div
              className="glass border-status-pending/30 p-3 rounded-xl mt-3 flex items-center gap-2 text-status-pending"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AlertTriangle size={16} />
              <span className="text-sm">
                Minimum {minCredits/creditsPerCourse} courses ({minCredits} credits) required
              </span>
            </motion.div>
          )}
          {selectedCredits > maxCredits && (
            <motion.div
              className="glass border-status-failed/30 p-3 rounded-xl mt-3 flex items-center gap-2 text-status-failed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AlertTriangle size={16} />
              <span className="text-sm">
                Exceeds maximum {maxCredits/creditsPerCourse} courses ({maxCredits} credits)
              </span>
            </motion.div>
          )}
          {meetsMinimum && selectedCredits <= maxCredits && selectedCount > 0 && (
            <motion.div
              className="glass border-status-passed/30 p-3 rounded-xl mt-3 flex items-center gap-2 text-status-passed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <CheckCircle size={16} />
              <span className="text-sm">Valid selection - ready to confirm</span>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
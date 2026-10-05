/**
 * Suggestion Panel Component
 * Shows AI/rule-based course suggestions for next semester
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  BookOpen, 
  Award, 
  Zap, 
  Brain, 
  Filter,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Course, CourseStatus, CourseSuggestion, SuggestionReason } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SuggestionPanelProps {
  suggestions: CourseSuggestion[];
  selectedCourseIds: string[];
  onToggleCourse: (courseId: string) => void;
  onApplyAll: () => void;
  isLoading?: boolean;
  maxCredits: number;
  creditsPerCourse: number;
  className?: string;
}

const PRIORITY_CONFIG = {
  high: { icon: Zap, color: 'var(--status-passed)', label: 'High Priority', bg: 'bg-status-passed/10 border-status-passed/30' },
  medium: { icon: Target, color: 'var(--status-registered)', label: 'Recommended', bg: 'bg-status-registered/10 border-status-registered/30' },
  low: { icon: BookOpen, color: 'var(--status-pending)', label: 'Optional', bg: 'bg-status-pending/10 border-status-pending/30' },
};

const REASON_ICONS: Record<string, React.ReactNode> = {
  required_for_graduation: <Award className="text-status-passed" size={14} />,
  fits_credit_budget: <Target className="text-status-registered" size={14} />,
  offered_this_semester: <BookOpen className="text-nebula-primary" size={14} />,
  thesis_track_requirement: <Zap className="text-nebula-primary" size={14} />,
  completes_course_requirements: <CheckCircle className="text-status-passed" size={14} />,
};

export function SuggestionPanel({
  suggestions,
  selectedCourseIds,
  onToggleCourse,
  onApplyAll,
  isLoading,
  maxCredits,
  creditsPerCourse,
  className,
}: SuggestionPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  
  const selectedCredits = selectedCourseIds.length * creditsPerCourse;
  const remainingCredits = maxCredits - selectedCredits;
  
  const filteredSuggestions = suggestions.filter(s => 
    filter === 'all' || s.priority === filter
  );
  
  const highPriority = suggestions.filter(s => s.priority === 'high').length;
  const mediumPriority = suggestions.filter(s => s.priority === 'medium').length;
  const lowPriority = suggestions.filter(s => s.priority === 'low').length;

  const toggleExpanded = (courseId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card className={cn('glass-card', className)}>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <motion.div
              className="glass-strong p-4 rounded-xl"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Brain className="text-nebula-primary" size={32} />
            </motion.div>
            <p className="text-starlight-dim">Analyzing your progress...</p>
            <p className="text-starlight-muted text-sm">Generating personalized recommendations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card className={cn('glass-card', className)}>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <motion.div
              className="glass-strong p-4 rounded-xl"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Target className="text-starlight-muted" size={32} />
            </motion.div>
            <p className="text-star-white font-medium">No suggestions available</p>
            <p className="text-starlight-dim text-sm">
              All courses for this semester are already planned or completed
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('glass-card h-full flex flex-col', className)}>
      <CardHeader className="pb-3 border-b border-glass-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="glass-strong p-3 rounded-xl">
              <Brain className="text-nebula-primary" size={20} />
            </div>
            <div>
              <CardTitle className="text-star-white font-heading text-lg">Smart Suggestions</CardTitle>
              <p className="text-starlight-dim text-sm">
                {suggestions.length} recommendations • {remainingCredits} credits remaining
              </p>
            </div>
          </div>
          
          {/* Priority filter tabs */}
          <Tabs value={filter} onValueChange={setFilter} className="ml-auto">
            <TabsList className="glass-strong p-1 rounded-lg">
              <TabsTrigger value="all" className="px-3 py-1 text-xs">
                All ({suggestions.length})
              </TabsTrigger>
              <TabsTrigger value="high" className="px-3 py-1 text-xs">
                High ({highPriority})
              </TabsTrigger>
              <TabsTrigger value="medium" className="px-3 py-1 text-xs">
                Med ({mediumPriority})
              </TabsTrigger>
              <TabsTrigger value="low" className="px-3 py-1 text-xs">
                Low ({lowPriority})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col">
        {/* Apply all button */}
        {suggestions.some(s => !selectedCourseIds.includes(s.courseId)) && (
          <motion.div className="mb-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Button
              onClick={onApplyAll}
              className="w-full btn-space-primary gap-2"
              size="lg"
            >
              <CheckCircle size={18} />
              Apply All Suggestions
              <span className="font-mono text-xs glass px-2 py-0.5 rounded">
                +{suggestions.filter(s => !selectedCourseIds.includes(s.courseId)).length * creditsPerCourse} credits
              </span>
            </Button>
          </motion.div>
        )}

        {/* Suggestions list */}
        <ScrollArea className="flex-1 pr-1">
          <div className="space-y-2">
            {filteredSuggestions.map((suggestion, index) => {
              const { course, reason, score, priority } = suggestion;
              const isSelected = selectedCourseIds.includes(course.courseId);
              const config = PRIORITY_CONFIG[priority];
              const PriorityIcon = config.icon;
              const ReasonIcon = REASON_ICONS[reason] || <Info className="text-starlight-dim" size={14} />;
              
              return (
                <motion.div
                  key={course.courseId}
                  className={cn(
                    'glass group relative overflow-hidden rounded-xl transition-all',
                    isSelected ? 'border-nebula-primary/50 bg-nebula-primary/5' : config.bg,
                    expandedIds.has(course.courseId) ? 'border-nebula-primary/30' : ''
                  )}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  layout
                >
                  <button
                    onClick={() => onToggleCourse(course.courseId)}
                    className="w-full p-4 flex items-start gap-4 text-left"
                    aria-pressed={isSelected}
                  >
                    {/* Priority indicator */}
                    <motion.div
                      className={cn(
                        'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                        isSelected 
                          ? 'bg-nebula-primary border-nebula-primary' 
                          : `bg-${config.color.replace('var(--', '').replace(')', '')}/20 border-${config.color.replace('var(--', '').replace(')', '')}/30`
                      )}
                      animate={{ scale: isSelected ? 1.05 : 1 }}
                    >
                      <PriorityIcon className={cn(config.color.replace('var(--', '').replace(')', ''), isSelected ? 'text-space-void' : '')} size={18} />
                    </motion.div>

                    {/* Course info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn('font-medium truncate flex-1', isSelected ? 'text-star-white' : 'text-starlight-dim')}>
                          {course.code}: {course.nameEn}
                        </p>
                        <Badge variant="outline" className={cn('text-xs', config.bg.replace('bg-', '').replace('border-', ''))}>
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-starlight-muted text-sm truncate mt-0.5">{course.nameAr}</p>
                      
                      {/* Reason */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="flex items-center gap-1 text-xs text-starlight-dim">
                          {ReasonIcon}
                          <span>{reason.replace(/_/g, ' ')}</span>
                        </span>
                        <motion.div
                          className="flex-1 h-1 glass-strong rounded overflow-hidden"
                          initial={{ width: 0 }}
                          animate={{ width: `${score * 100}%` }}
                          transition={{ delay: 0.2, duration: 0.5 }}
                        >
                          <motion.div
                            className="h-full rounded"
                            style={{ background: config.color }}
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                          />
                        </motion.div>
                        <span className="font-mono text-xs text-star-white">{Math.round(score * 100)}%</span>
                      </div>
                    </div>

                    {/* Selection checkbox */}
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleCourse(course.courseId)}
                      className="flex-shrink-0 mt-1 data-[state=checked]:bg-nebula-primary data-[state=checked]:border-nebula-primary"
                    />

                    {/* Expand toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        toggleExpanded(course.courseId);
                      }}
                      className="flex-shrink-0 p-1 text-starlight-muted hover:text-star-white transition-colors ml-2"
                    >
                      {expandedIds.has(course.courseId) ? (
                        <ChevronRight size={16} className="rotate-90" />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>
                  </button>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {expandedIds.has(course.courseId) && (
                      <motion.div
                        className="glass px-4 pb-4 border-t border-glass-border"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <span className="text-starlight-muted">Type:</span>
                            <span className="ml-2 text-star-white capitalize">{course.type}</span>
                          </div>
                          <div>
                            <span className="text-starlight-muted">Credits:</span>
                            <span className="ml-2 text-star-white">{course.credits}</span>
                          </div>
                          <div>
                            <span className="text-starlight-muted">Offered:</span>
                            <span className="ml-2 text-star-white">
                              {course.semesterOffered.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}
                            </span>
                          </div>
                          <div>
                            <span className="text-starlight-muted">Priority:</span>
                            <span className="ml-2 text-star-white capitalize">{priority}</span>
                          </div>
                        </div>
                        {course.description && (
                          <div className="p-3 glass-strong rounded-lg">
                            <p className="text-starlight-dim">{course.description}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-starlight-dim mt-2">
                          <Info size={12} />
                          <span>Reason: {reason.replace(/_/g, ' ')}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Summary */}
        <Separator className="my-3" />
        <div className="glass p-3 rounded-xl">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="glass-strong p-2 rounded-lg">
              <p className="font-heading text-lg font-bold text-status-passed">{highPriority}</p>
              <p className="text-starlight-muted text-xs">High Priority</p>
            </div>
            <div className="glass-strong p-2 rounded-lg">
              <p className="font-heading text-lg font-bold text-status-registered">{mediumPriority}</p>
              <p className="text-starlight-muted text-xs">Recommended</p>
            </div>
            <div className="glass-strong p-2 rounded-lg">
              <p className="font-heading text-lg font-bold text-status-pending">{lowPriority}</p>
              <p className="text-starlight-muted text-xs">Optional</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Suggestion Algorithm (Rule-based)
// ============================================================

export function generateSuggestions(
  context: {
    majorId: string;
    thesisTrackId: string;
    targetSemester: string;
    targetCredits: number;
    completedCourseIds: string[];
    registeredCourseIds: string[];
    failedCourseIds: string[];
    plannedCourseIds: string[];
    offeredCourseIds: string[];
    allCourses: Course[];
  }
): CourseSuggestion[] {
  const {
    thesisTrackId,
    targetCredits,
    completedCourseIds,
    registeredCourseIds,
    failedCourseIds,
    plannedCourseIds,
    offeredCourseIds,
    allCourses,
  } = context;

  const excludedIds = new Set([
    ...completedCourseIds,
    ...registeredCourseIds,
    ...plannedCourseIds,
  ]);

  // Get thesis course
  const thesisCourse = allCourses.find(c => c.isThesis && c.thesisPatternId === thesisTrackId);
  
  // Filter available offered courses
  const availableOffered = allCourses.filter(c => 
    offeredCourseIds.includes(c.courseId) && 
    !excludedIds.has(c.courseId) &&
    !c.isThesis
  );

  // Score each course
  const scored: CourseSuggestion[] = availableOffered.map(course => {
    let score = 0;
    let reason: CourseSuggestion['reason'] = 'offered_this_semester';
    const reasons: CourseSuggestion['reason'][] = [];

    // 1. Core course requirement (highest priority)
    if (course.type === 'core') {
      score += 0.4;
      reasons.push('required_for_graduation');
      reason = 'required_for_graduation';
    }

    // 2. Fits credit budget
    if (course.credits <= targetCredits) {
      score += 0.25;
      if (!reasons.includes('fits_credit_budget')) {
        reasons.push('fits_credit_budget');
        if (reason === 'offered_this_semester') reason = 'fits_credit_budget';
      }
    }

    // 3. Offered this semester
    score += 0.2;
    if (!reasons.includes('offered_this_semester')) {
      reasons.push('offered_this_semester');
    }

    // 4. Not failed before (boost)
    if (!failedCourseIds.includes(course.courseId)) {
      score += 0.1;
    }

    // 5. Elective variety (slight boost for electives if we have many core)
    const coreCompleted = completedCourseIds.filter(id => {
      const c = allCourses.find(cr => cr.courseId === id);
      return c?.type === 'core';
    }).length;
    const coreTotal = allCourses.filter(c => c.type === 'core').length;
    if (course.type === 'elective' && coreCompleted >= coreTotal * 0.7) {
      score += 0.05;
    }

    return {
      courseId: course.courseId,
      course,
      reason: reason as SuggestionReason,
      score: Math.min(1, score),
      priority: score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low',
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Add thesis course at top if not completed
  if (thesisCourse && !completedCourseIds.includes(thesisCourse.courseId) && !registeredCourseIds.includes(thesisCourse.courseId)) {
    scored.unshift({
      courseId: thesisCourse.courseId,
      course: thesisCourse,
      reason: 'thesis_track_requirement' as SuggestionReason,
      score: 1.0,
      priority: 'high' as const,
    });
  }

  return scored;
}
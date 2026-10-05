"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  BookOpen, 
  Target, 
  Brain, 
  Settings, 
  User, 
  LogOut, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { SyncButton } from '@/components/orbital/SyncButton';
import { cn } from '@/lib/utils';
import type { Course, CourseStatus, MajorConfig, SemesterSeason, GuestProgress } from '@/types';
import { MAJOR_CONFIGS } from '@/types';
import { OrbitalView } from '@/components/orbital/OrbitalView';
import { SemesterPlanner } from '@/components/panels/SemesterPlanner';
import { ProgressRing } from '@/components/panels/ProgressRing';
import { SuggestionPanel } from '@/components/panels/SuggestionPanel';
import { AuthForm, GuestBanner, MajorSelector } from '@/components/auth/AuthForms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth, useCourses, useProgress, useSemesterPlans, useSettings, useSuggestions } from '@/hooks/use-pocketbase';
import { getLocalStorage, setLocalStorage, removeLocalStorage, formatSemester, getCurrentAcademicSemester, getSemesterRange, calculateCreditsEarned } from '@/lib/utils';

// ============================================================
// MAIN APP COMPONENT
// ============================================================

export default function Home() {
  // Auth state
  const { 
    authState, 
    isLoading: authLoading, 
    signIn, 
    signUp, 
    signOut, 
    upgradeGuest, 
    setGuestMajor,
    isAuthenticated,
    isGuest 
  } = useAuth();

  // Major selection
  const [selectedMajorId, setSelectedMajorId] = useState<string>(authState.majorId || 'swe');
  const [selectedThesisTrack, setSelectedThesisTrack] = useState<string>('9hr');
  const [showMajorSelector, setShowMajorSelector] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'upgrade'>('signin');

  // Semester planning
  const [currentSemester, setCurrentSemester] = useState<string>(getCurrentAcademicSemester());
  const [semesterPlans, setSemesterPlans] = useState<Record<string, string[]>>({});
  const [showAllSemesters, setShowAllSemesters] = useState(false);

  // Data fetching
  const { courses, isLoading: coursesLoading } = useCourses(selectedMajorId);
  const { progress, guestProgress, updateStatus, getCourseStatus, cycleStatus } = useProgress(
    authState.userId, 
    selectedMajorId
  );
  const { plans, upsertPlan, getPlan } = useSemesterPlans(authState.userId, selectedMajorId);
  const { settings } = useSettings(authState.userId);

  // Major config
  const majorConfig = MAJOR_CONFIGS[selectedMajorId] || MAJOR_CONFIGS.swe;
  const thesisTrack = majorConfig.thesisPatterns.find(t => t.id === selectedThesisTrack) || majorConfig.thesisPatterns[0];

  // Derived state
  const courseStatuses = useMemo(() => {
    const map = new Map<string, CourseStatus>();
    if (isAuthenticated) {
      progress.forEach(p => map.set(p.courseId, p.status as CourseStatus));
    } else if (guestProgress) {
      Object.entries(guestProgress.courseStatus).forEach(([id, status]) => map.set(id, status as CourseStatus));
    }
    return map;
  }, [progress, guestProgress, isAuthenticated]);

  const completedCourseIds = useMemo(() => 
    Array.from(courseStatuses.entries())
      .filter(([, status]) => status === 'passed')
      .map(([id]) => id)
  , [courseStatuses]);

  const registeredCourseIds = useMemo(() => 
    Array.from(courseStatuses.entries())
      .filter(([, status]) => status === 'registered')
      .map(([id]) => id)
  , [courseStatuses]);

  const failedCourseIds = useMemo(() => 
    Array.from(courseStatuses.entries())
      .filter(([, status]) => status === 'failed')
      .map(([id]) => id)
  , [courseStatuses]);

  const completedCredits = useMemo(() => 
    calculateCreditsEarned(
      Array.from(courseStatuses.entries()).map(([courseId, status]) => ({
        status,
        credits: courses.find(c => c.courseId === courseId)?.credits || 3
      }))
    )
  , [courseStatuses, courses]);

  const totalCredits = majorConfig.totalCreditsRequired;
  const courseCreditsRequired = majorConfig.courseCreditsRequired;
  const thesisCreditsRequired = thesisTrack.credits;

  // Current semester plan
  const currentPlan = getPlan(currentSemester);
  const selectedCourseIds = currentPlan?.courseIds || [];
  const targetCredits = currentPlan?.targetCredits || majorConfig.maxCoursesPerSemester * majorConfig.creditsPerCourse;

  // Offered courses for current semester (simulate department offering 4 courses)
  const offeredCourseIds = useMemo(() => {
    const season = currentSemester.split('-')[1] as SemesterSeason;
    const seasonalCourses = courses.filter(c => 
      !c.isThesis && 
      c.semesterOffered.includes(season)
    );
    // Take first 4 as "offered this semester"
    return seasonalCourses.slice(0, majorConfig.typicalCoursesOffered).map(c => c.courseId);
  }, [courses, currentSemester, majorConfig.typicalCoursesOffered]);

  // Suggestions
  const { suggestions, isLoading: suggestionsLoading } = useSuggestions(
    selectedMajorId,
    selectedThesisTrack,
    currentSemester,
    targetCredits,
    completedCourseIds,
    registeredCourseIds,
    failedCourseIds,
    selectedCourseIds,
    offeredCourseIds
  );

  // Handle course status change
  const handleCourseClick = useCallback((courseId: string) => {
    const currentStatus = getCourseStatus(courseId);
    const nextStatus = cycleStatus(currentStatus);
    updateStatus(courseId, nextStatus, currentSemester);
  }, [getCourseStatus, cycleStatus, updateStatus, currentSemester]);

  // Handle semester plan change
  const handlePlanChange = useCallback((courseIds: string[]) => {
    upsertPlan(currentSemester, courseIds, targetCredits);
    setSemesterPlans(prev => ({ ...prev, [currentSemester]: courseIds }));
  }, [upsertPlan, currentSemester, targetCredits]);

  // Apply all suggestions
  const handleApplyAll = useCallback(() => {
    const newCourses = suggestions
      .filter(s => !selectedCourseIds.includes(s.courseId))
      .map(s => s.courseId);
    const updated = [...selectedCourseIds, ...newCourses].slice(0, majorConfig.maxCoursesPerSemester);
    handlePlanChange(updated);
  }, [suggestions, selectedCourseIds, majorConfig.maxCoursesPerSemester, handlePlanChange]);

  // Sync guest data to localStorage
  useEffect(() => {
    if (isGuest && guestProgress) {
      setLocalStorage('masters-tracker-guest', guestProgress);
    }
  }, [guestProgress, isGuest]);

  // Show major selector on first visit
  useEffect(() => {
    if (isGuest && !authState.majorId && !showMajorSelector) {
      setShowMajorSelector(true);
    }
  }, [isGuest, authState.majorId, showMajorSelector]);

  // Loading state
  if (authLoading || coursesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="glass-strong p-8 rounded-2xl flex flex-col items-center gap-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="glass-strong p-4 rounded-xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <GraduationCap className="text-nebula-primary" size={48} />
          </motion.div>
          <p className="text-star-white font-heading text-xl">Loading your constellation...</p>
          <p className="text-starlight-dim">Fetching courses and progress</p>
        </motion.div>
      </div>
    );
  }

  // Show auth/major selector modals
  if (showAuth) {
    return (
      <TooltipProvider>
        <div className="min-h-screen flex items-center justify-center p-4 bg-space-void">
          <motion.div
            className="glass-card w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <AuthForm
              mode={authMode}
              majors={Object.values(MAJOR_CONFIGS)}
              onGuestEnter={async (majorId) => {
                setGuestMajor(majorId);
                setShowAuth(false);
              }}
              onSignIn={signIn}
              onSignUp={signUp}
              onUpgrade={upgradeGuest}
              onBack={() => setShowAuth(false)}
              isLoading={authLoading}
            />
          </motion.div>
        </div>
      </TooltipProvider>
    );
  }

  if (showMajorSelector) {
    return (
      <TooltipProvider>
        <div className="min-h-screen flex items-center justify-center p-4 bg-space-void">
          <motion.div
            className="glass-card w-full max-w-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <MajorSelector
              majors={Object.values(MAJOR_CONFIGS)}
              onSelect={(majorId, thesisTrackId) => {
                setSelectedMajorId(majorId);
                setSelectedThesisTrack(thesisTrackId);
                setGuestMajor(majorId);
                setShowMajorSelector(false);
              }}
              isGuest={true}
            />
          </motion.div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-space-void">
        {/* Top Bar */}
        <header className="glass border-b border-glass-border px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <motion.div
                className="glass-strong p-2 rounded-xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <GraduationCap className="text-nebula-primary" size={24} />
              </motion.div>
              <div>
                <h1 className="font-heading text-star-white text-lg">Masters Tracker</h1>
                <p className="text-starlight-dim text-xs">{majorConfig.name}</p>
              </div>
            </div>

            {/* Semester Selector */}
            <div className="flex items-center gap-4">
              <Select value={currentSemester} onValueChange={(value: string | null) => value && setCurrentSemester(value)}>
                <SelectTrigger className="glass-input w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong">
                  {getSemesterRange(currentSemester, 3).map(sem => (
                    <SelectItem key={sem} value={sem}>
                      {formatSemester(sem)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* User Menu / Auth */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" className="gap-2" size="sm">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">{authState.email?.split('@')[0]}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="glass-strong" align="end">
                    <DropdownMenuItem onClick={() => setShowMajorSelector(true)}>
                      <Settings className="h-4 w-4" />
                      Change Major
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-status-failed">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : isGuest ? (
                <Button variant="ghost" size="sm" onClick={() => { setAuthMode('upgrade'); setShowAuth(true); }}>
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">Upgrade</span>
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => { setAuthMode('signin'); setShowAuth(true); }}>
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Guest Banner */}
        {isGuest && (
          <GuestBanner 
            onUpgrade={() => { setAuthMode('upgrade'); setShowAuth(true); }}
            onDismiss={() => removeLocalStorage('masters-tracker-guest-banner-dismissed')}
          />
        )}

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-6 pb-20 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Orbital View */}
            <div className="lg:col-span-2 space-y-6">
              {/* Orbital Visualization */}
              <Card className="glass-card overflow-hidden">
                <CardContent className="p-0">
                  <OrbitalView
                    courses={courses}
                    progress={courseStatuses}
                    major={majorConfig}
                    thesisTrackId={selectedThesisTrack}
                    completedCredits={completedCredits}
                    totalCredits={totalCredits}
                    selectedCourseId={null}
                    onCourseClick={handleCourseClick}
                    className="min-h-[500px]"
                  />
                </CardContent>
              </Card>

              {/* Progress Ring & Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="glass-card">
                  <CardContent className="p-6">
                    <ProgressRing
                      completedCredits={completedCredits}
                      totalCredits={totalCredits}
                      courseCredits={courseCreditsRequired}
                      thesisCredits={thesisCreditsRequired}
                      major={majorConfig}
                      thesisTrackId={selectedThesisTrack}
                      size={180}
                    />
                  </CardContent>
                </Card>

                <Card className="glass-card md:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-star-white font-heading">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatCard 
                        label="Completed" 
                        value={completedCourseIds.length} 
                        icon={<CheckCircle className="text-status-passed" />} 
                        color="var(--status-passed)"
                      />
                      <StatCard 
                        label="In Progress" 
                        value={registeredCourseIds.length} 
                        icon={<BookOpen className="text-status-registered" />} 
                        color="var(--status-registered)"
                      />
                      <StatCard 
                        label="Pending" 
                        value={courses.filter(c => !c.isThesis && (!courseStatuses.has(c.courseId) || courseStatuses.get(c.courseId) === 'pending')).length} 
                        icon={<Target className="text-status-pending" />} 
                        color="var(--status-pending)"
                      />
                      <StatCard 
                        label="Failed" 
                        value={failedCourseIds.length} 
                        icon={<AlertCircle className="text-status-failed" />} 
                        color="var(--status-failed)"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Panel - Planner & Suggestions */}
            <div className="space-y-6">
              {/* Semester Planner */}
              <Card className="glass-card h-[500px]">
                <SemesterPlanner
                  semester={currentSemester}
                  season={currentSemester.split('-')[1] as SemesterSeason}
                  year={parseInt(currentSemester.split('-')[0])}
                  offeredCourses={courses.filter(c => offeredCourseIds.includes(c.courseId))}
                  allCourses={courses}
                  selectedCourseIds={selectedCourseIds}
                  courseStatuses={courseStatuses}
                  major={majorConfig}
                  thesisTrackId={selectedThesisTrack}
                  maxCredits={targetCredits}
                  minCredits={majorConfig.minCoursesPerSemester * majorConfig.creditsPerCourse}
                  creditsPerCourse={majorConfig.creditsPerCourse}
                  onSelectionChange={handlePlanChange}
                  onCourseClick={(course: Course) => handleCourseClick(course.courseId)}
                />
              </Card>

              {/* Suggestions Panel */}
              <Card className="glass-card h-[400px]">
                <SuggestionPanel
                  suggestions={suggestions}
                  selectedCourseIds={selectedCourseIds}
                  onToggleCourse={(courseId) => handlePlanChange(
                    selectedCourseIds.includes(courseId)
                      ? selectedCourseIds.filter((id: string) => id !== courseId)
                      : [...selectedCourseIds, courseId]
                  )}
                  onApplyAll={handleApplyAll}
                  isLoading={suggestionsLoading}
                  maxCredits={targetCredits}
                  creditsPerCourse={majorConfig.creditsPerCourse}
                />
              </Card>

              {/* Semester History */}
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-star-white font-heading">Semester History</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setShowAllSemesters(!showAllSemesters)}>
                      {showAllSemesters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-64 pr-1">
                    <div className="space-y-2">
                      {getSemesterRange(currentSemester, 2).map((sem, idx) => {
                        const plan = getPlan(sem);
                        const isCurrent = sem === currentSemester;
                        return (
                          <motion.div
                            key={sem}
                            className={cn(
                              'glass p-3 rounded-xl flex items-center justify-between transition-colors',
                              isCurrent && 'border-nebula-primary/30 bg-nebula-primary/5'
                            )}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="glass-strong p-2 rounded-lg">
                                <BookOpen className="text-nebula-primary" size={16} />
                              </div>
                              <div>
                                <p className="font-medium text-star-white">{formatSemester(sem)}</p>
                                <p className="text-starlight-dim text-sm">
                                  {plan?.courseIds.length || 0} courses • {plan?.targetCredits || 0} credits
                                </p>
                              </div>
                            </div>
                            {plan && (
                              <Badge variant="outline" className={cn('status-', plan.status)}>
                                {plan.status}
                              </Badge>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
          <Tooltip>
            <TooltipTrigger>
              <Button 
                variant="default" 
                size="icon" 
                className="btn-space-primary rounded-full shadow-2xl"
                onClick={() => setShowMajorSelector(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Settings</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger>
              <SyncButton 
                majorId={selectedMajorId} 
                isGuest={isGuest}
              />
            </TooltipTrigger>
            <TooltipContent side="left">Sync from HU</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger>
              <Button 
                variant="default" 
                size="icon" 
                className="btn-space-secondary rounded-full shadow-xl"
                onClick={() => { /* Export data */ }}
              >
                <Download className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Export Progress</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ============================================================
// STAT CARD COMPONENT
// ============================================================

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <motion.div
      className="glass p-4 rounded-xl text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        {icon}
      </div>
      <p className="font-heading text-3xl font-bold text-star-white" style={{ color }}>
        {value}
      </p>
      <p className="text-starlight-dim text-sm mt-1">{label}</p>
    </motion.div>
  );
}
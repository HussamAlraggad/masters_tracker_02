/**
 * React hooks for PocketBase integration and state management
 * Simplified types for build compatibility
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getPocketBase } from '@/lib/pocketbase/client';
import type { Course, CourseStatus, MajorConfig, SemesterSeason, GuestProgress, GuestSemesterPlan, AuthState, CourseSuggestion, SuggestionReason } from '@/types';
import { getLocalStorage, setLocalStorage, removeLocalStorage, generateId } from '@/lib/utils';

// ============================================================
// GUEST STORAGE KEYS
// ============================================================

const GUEST_STORAGE_KEY = 'masters-tracker-guest';
const GUEST_MAJOR_KEY = 'masters-tracker-guest-major';

// ============================================================
// AUTH HOOK
// ============================================================

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    mode: 'guest',
    isGuest: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const pb = getPocketBase();
    
    // Check if user is authenticated
    if (pb.authStore.isValid) {
      const user = pb.authStore.model as any;
      setAuthState({
        mode: 'authenticated',
        userId: user.id,
        email: user.email,
        majorId: user.majorId,
        isGuest: false,
      });
    } else {
      // Check for guest data
      const guestData = getLocalStorage<GuestProgress | null>(GUEST_STORAGE_KEY, null);
      const guestMajor = getLocalStorage<string | null>(GUEST_MAJOR_KEY, null);
      
      setAuthState({
        mode: 'guest',
        isGuest: true,
        majorId: guestMajor || undefined,
        guestData: guestData || undefined,
      });
    }
    
    setIsLoading(false);
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const pb = getPocketBase();
    const unsubscribe = pb.authStore.onChange(() => {
      if (pb.authStore.isValid) {
        const user = pb.authStore.model as any;
        setAuthState({
          mode: 'authenticated',
          userId: user.id,
          email: user.email,
          majorId: user.majorId,
          isGuest: false,
        });
      } else {
        const guestData = getLocalStorage<GuestProgress | null>(GUEST_STORAGE_KEY, null);
        const guestMajor = getLocalStorage<string | null>(GUEST_MAJOR_KEY, null);
        setAuthState({
          mode: 'guest',
          isGuest: true,
          majorId: guestMajor || undefined,
          guestData: guestData || undefined,
        });
      }
    });
    
    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const pb = getPocketBase();
    await pb.collection('users').authWithPassword(email, password);
  }, []);

  const signUp = useCallback(async (email: string, password: string, majorId: string, thesisTrackId: string) => {
    const pb = getPocketBase();
    await pb.collection('users').create({ email, password, passwordConfirm: password, majorId, thesisTrackId });
    await pb.collection('users').authWithPassword(email, password);
  }, []);

  const signOut = useCallback(async () => {
    const pb = getPocketBase();
    pb.authStore.clear();
  }, []);

  const upgradeGuest = useCallback(async (email: string, password: string) => {
    if (!authState.guestData || !authState.majorId) return;
    
    const pb = getPocketBase();
    const user = await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      majorId: authState.majorId,
      thesisTrackId: authState.guestData.thesisTrackId,
    });
    
    await pb.collection('users').authWithPassword(email, password);
    
    // Migrate guest data
    const { migrateGuestToUser } = await import('@/lib/pocketbase/client');
    await migrateGuestToUser(user.id, authState.guestData);
    
    // Clear guest data
    removeLocalStorage(GUEST_STORAGE_KEY);
    removeLocalStorage(GUEST_MAJOR_KEY);
  }, [authState.guestData, authState.majorId]);

  const setGuestMajor = useCallback((majorId: string) => {
    setLocalStorage(GUEST_MAJOR_KEY, majorId);
    setAuthState(prev => ({ ...prev, majorId }));
  }, []);

  return {
    authState,
    isLoading,
    signIn,
    signUp,
    signOut,
    upgradeGuest,
    setGuestMajor,
    isAuthenticated: authState.mode === 'authenticated',
    isGuest: authState.mode === 'guest',
  };
}

// ============================================================
// COURSES HOOK
// ============================================================

export function useCourses(majorId: string | undefined) {
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    if (!majorId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const pb = getPocketBase();
      const records = await pb.collection('courses').getFullList({
        filter: `majorId = "${majorId}"`,
        sort: 'courseId',
      });
      setCourses(records);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch courses');
    } finally {
      setIsLoading(false);
    }
  }, [majorId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Realtime subscription
  useEffect(() => {
    if (!majorId) return;
    
    const pb = getPocketBase();
    pb.collection('courses').subscribe('*', () => {
      fetchCourses();
    });
    
    return () => {
      pb.collection('courses').unsubscribe();
    };
  }, [majorId, fetchCourses]);

  return { courses, isLoading, error, refetch: fetchCourses };
}

// ============================================================
// PROGRESS HOOK
// ============================================================

export function useProgress(userId: string | undefined, majorId: string | undefined) {
  const [progress, setProgress] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProgress = useCallback(async () => {
    if (!userId || !majorId) {
      setProgress([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const pb = getPocketBase();
      const records = await pb.collection('user_progress').getFullList({
        filter: `userId = "${userId}" && majorId = "${majorId}"`,
        sort: '-updated',
        expand: 'courseId',
      });
      setProgress(records);
    } catch (err) {
      console.error('Failed to fetch progress:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, majorId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Realtime subscription
  useEffect(() => {
    if (!userId || !majorId) return;
    
    const pb = getPocketBase();
    pb.collection('user_progress').subscribe('*', (e) => {
      if (e.record.userId === userId && e.record.majorId === majorId) {
        fetchProgress();
      }
    });
    
    return () => {
      pb.collection('user_progress').unsubscribe();
    };
  }, [userId, majorId, fetchProgress]);

  // Guest progress (localStorage)
  const guestProgress = getLocalStorage<any | null>(GUEST_STORAGE_KEY, null);

  const updateStatus = useCallback(async (
    courseId: string,
    status: CourseStatus,
    semester?: string,
    grade?: number
  ) => {
    if (userId && majorId) {
      // Authenticated user - use PocketBase
      const { updateCourseStatus } = await import('@/lib/pocketbase/client');
      await updateCourseStatus(userId, majorId, courseId, status, semester, grade);
    } else if (majorId) {
      // Guest user - update localStorage
      const current = getLocalStorage<any | null>(GUEST_STORAGE_KEY, {
        majorId,
        courseStatus: {},
        semesterPlans: [],
        thesisTrackId: '9hr',
        updatedAt: Date.now(),
      });
      
      current.courseStatus[courseId] = status;
      current.updatedAt = Date.now();
      setLocalStorage(GUEST_STORAGE_KEY, current);
      
      // Trigger re-render
      setProgress(prev => [...prev]);
    }
  }, [userId, majorId]);

  const cycleStatus = useCallback((currentStatus: CourseStatus) => {
    const cycle: CourseStatus[] = ['pending', 'registered', 'passed', 'failed'];
    const idx = cycle.indexOf(currentStatus);
    return cycle[(idx + 1) % cycle.length];
  }, []);

  // Get status for a course
  const getCourseStatus = useCallback((courseId: string): CourseStatus => {
    if (userId) {
      const record = progress.find(p => p.courseId === courseId);
      return record?.status || 'pending';
    } else if (guestProgress) {
      return guestProgress.courseStatus[courseId] || 'pending';
    }
    return 'pending';
  }, [progress, userId, guestProgress]);

  return {
    progress,
    guestProgress,
    isLoading,
    updateStatus,
    cycleStatus,
    getCourseStatus,
    refetch: fetchProgress,
  };
}

// ============================================================
// SEMESTER PLANS HOOK
// ============================================================

export function useSemesterPlans(userId: string | undefined, majorId: string | undefined) {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPlans = useCallback(async () => {
    if (!userId || !majorId) {
      setPlans([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const pb = getPocketBase();
      const records = await pb.collection('semester_plans').getFullList({
        filter: `userId = "${userId}" && majorId = "${majorId}"`,
        sort: '-semester',
      });
      setPlans(records);
    } catch (err) {
      console.error('Failed to fetch semester plans:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, majorId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Realtime subscription
  useEffect(() => {
    if (!userId || !majorId) return;
    
    const pb = getPocketBase();
    pb.collection('semester_plans').subscribe('*', (e) => {
      if (e.record.userId === userId && e.record.majorId === majorId) {
        fetchPlans();
      }
    });
    
    return () => {
      pb.collection('semester_plans').unsubscribe();
    };
  }, [userId, majorId, fetchPlans]);

  // Guest plans
  const guestProgress = getLocalStorage<any | null>(GUEST_STORAGE_KEY, null);
  const guestPlans = guestProgress?.semesterPlans || [];

  const upsertPlan = useCallback(async (
    semester: string,
    courseIds: string[],
    targetCredits: number
  ) => {
    if (userId && majorId) {
      const { upsertSemesterPlan } = await import('@/lib/pocketbase/client');
      await upsertSemesterPlan(userId, majorId, semester, courseIds, targetCredits);
    } else if (majorId) {
      const current = getLocalStorage<any | null>(GUEST_STORAGE_KEY, {
        majorId,
        courseStatus: {},
        semesterPlans: [],
        thesisTrackId: '9hr',
        updatedAt: Date.now(),
      });
      
      const existingIdx = current.semesterPlans.findIndex((p: any) => p.semester === semester);
      const newPlan = {
        id: generateId(),
        semester,
        targetCredits,
        courseIds,
        status: 'planning',
        createdAt: Date.now(),
      };
      
      if (existingIdx >= 0) {
        current.semesterPlans[existingIdx] = newPlan;
      } else {
        current.semesterPlans.push(newPlan);
      }
      
      current.updatedAt = Date.now();
      setLocalStorage(GUEST_STORAGE_KEY, current);
      setPlans(prev => [...prev]);
    }
  }, [userId, majorId]);

  const getPlan = useCallback((semester: string): any | undefined => {
    if (userId) {
      return plans.find((p: any) => p.semester === semester);
    } else {
      return guestPlans.find((p: any) => p.semester === semester);
    }
  }, [plans, userId, guestPlans]);

  return {
    plans,
    guestPlans,
    isLoading,
    upsertPlan,
    getPlan,
    refetch: fetchPlans,
  };
}

// ============================================================
// SETTINGS HOOK
// ============================================================

export function useSettings(userId: string | undefined) {
  const [settings, setSettings] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!userId) {
      setSettings(null);
      return;
    }
    
    setIsLoading(true);
    try {
      const pb = getPocketBase();
      const records = await pb.collection('settings').getFullList({
        filter: `userId = "${userId}"`,
        perPage: 1,
      });
      setSettings(records[0] || null);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (data: any) => {
    if (!userId || !settings) return;
    
    const pb = getPocketBase();
    const updated = await pb.collection('settings').update(settings.id, data);
    setSettings(updated);
  }, [userId, settings]);

  return { settings, isLoading, updateSettings, refetch: fetchSettings };
}

// ============================================================
// MAJOR CONFIG HOOK
// ============================================================

export function useMajorConfig(majorId: string | undefined) {
  const [config, setConfig] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!majorId) {
      setConfig(null);
      return;
    }
    
    setIsLoading(true);
    const pb = getPocketBase();
    
    pb.collection('majors').getOne(majorId)
      .then(setConfig)
      .catch(() => setConfig(null))
      .finally(() => setIsLoading(false));
  }, [majorId]);

  return { config, isLoading };
}

// ============================================================
// SUGGESTION HOOK
// ============================================================

export function useSuggestions(
  majorId: string | undefined,
  thesisTrackId: string | undefined,
  targetSemester: string | undefined,
  targetCredits: number,
  completedCourseIds: string[],
  registeredCourseIds: string[],
  failedCourseIds: string[],
  plannedCourseIds: string[],
  offeredCourseIds: string[]
) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateSuggestions = useCallback(async () => {
    if (!majorId || !thesisTrackId || !targetSemester) {
      setSuggestions([]);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const pb = getPocketBase();
      
      // Get all courses for major
      const allCourses = await pb.collection('courses').getFullList({
        filter: `majorId = "${majorId}"`,
      });
      
      // Get thesis course
      const thesisCourse = allCourses.find(c => c.isThesis && c.thesisPatternId === thesisTrackId);
      
      // Filter offered courses that aren't already planned/completed
      const excludedIds = new Set([
        ...completedCourseIds,
        ...registeredCourseIds,
        ...plannedCourseIds,
      ]);
      
      const availableCourses = allCourses.filter(c => 
        offeredCourseIds.includes(c.courseId) && 
        !excludedIds.has(c.courseId) &&
        !c.isThesis
      );
      
      // Simple scoring algorithm
      const scored = availableCourses.map(course => {
        let score = 0;
        let reason = '';
        
        // Required for graduation (core courses)
        if (course.type === 'core') {
          score += 0.4;
          reason = 'required_for_graduation';
        }
        
        // Fits credit budget
        if (course.credits <= targetCredits) {
          score += 0.3;
          reason = reason ? `${reason}, fits credit budget` : 'fits credit budget';
        }
        
        // Offered this semester
        score += 0.2;
        reason = reason ? `${reason}, offered this semester` : 'offered this semester';
        
        // Not failed before
        if (!failedCourseIds.includes(course.courseId)) {
          score += 0.1;
        }
        
        const mapReason = (r: string): 'required_for_graduation' | 'fits_credit_budget' | 'offered_this_semester' | 'thesis_track_requirement' | 'completes_course_requirements' => {
          if (r.includes('core')) return 'required_for_graduation';
          if (r.includes('credit budget')) return 'fits_credit_budget';
          if (r.includes('semester')) return 'offered_this_semester';
          return 'offered_this_semester';
        };

        return {
          courseId: course.courseId,
          course,
          reason: mapReason(reason || 'Available'),
          score,
          priority: score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low',
        };
      });
      
      // Sort by score descending
      scored.sort((a, b) => b.score - a.score);
      
      // Add thesis course if not completed
      if (thesisCourse && !completedCourseIds.includes(thesisCourse.courseId) && !registeredCourseIds.includes(thesisCourse.courseId)) {
        scored.unshift({
          courseId: thesisCourse.courseId,
          course: thesisCourse,
          reason: 'thesis_track_requirement' as const,
          score: 1.0,
          priority: 'high' as const,
        });
      }
      
      setSuggestions(scored);
    } catch (err) {
      console.error('Failed to generate suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    majorId,
    thesisTrackId,
    targetSemester,
    targetCredits,
    completedCourseIds,
    registeredCourseIds,
    failedCourseIds,
    plannedCourseIds,
    offeredCourseIds,
  ]);

  useEffect(() => {
    generateSuggestions();
  }, [generateSuggestions]);

  return { suggestions, isLoading, regenerate: generateSuggestions };
}
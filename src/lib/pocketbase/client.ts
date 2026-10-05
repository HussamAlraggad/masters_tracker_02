/**
 * PocketBase client configuration and typed collections
 * Simplified for build compatibility
 */

import PocketBase from 'pocketbase';
import type { Course, UserProgress, SemesterPlan, UserSettings, MajorConfig } from '@/types';

// ============================================================
// POCKETBASE INSTANCE
// ============================================================

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

let pbInstance: PocketBase | null = null;

export function getPocketBase(): PocketBase {
  if (!pbInstance) {
    pbInstance = new PocketBase(PB_URL);
    
    if (typeof window !== 'undefined') {
      pbInstance.authStore.loadFromCookie(document.cookie);
    }
  }
  return pbInstance;
}

export function createServerPocketBase(): PocketBase {
  return new PocketBase(PB_URL);
}

// ============================================================
// COLLECTION NAMES
// ============================================================

export const COLLECTIONS = {
  MAJORS: 'majors',
  COURSES: 'courses',
  USER_PROGRESS: 'user_progress',
  SEMESTER_PLANS: 'semester_plans',
  SETTINGS: 'settings',
  USERS: 'users',
} as const;

// ============================================================
// COLLECTION HELPERS
// ============================================================

export async function getCoursesByMajor(majorId: string): Promise<any[]> {
  const pb = getPocketBase();
  return pb.collection(COLLECTIONS.COURSES).getFullList({
    filter: `majorId = "${majorId}"`,
    sort: 'courseId',
  });
}

export async function getUserProgress(userId: string, majorId: string): Promise<any[]> {
  const pb = getPocketBase();
  return pb.collection(COLLECTIONS.USER_PROGRESS).getFullList({
    filter: `userId = "${userId}" && majorId = "${majorId}"`,
    sort: '-updated',
    expand: 'courseId',
  });
}

export async function getUserSemesterPlans(userId: string, majorId: string): Promise<any[]> {
  const pb = getPocketBase();
  return pb.collection(COLLECTIONS.SEMESTER_PLANS).getFullList({
    filter: `userId = "${userId}" && majorId = "${majorId}"`,
    sort: '-semester',
  });
}

export async function getUserSettings(userId: string): Promise<any | null> {
  const pb = getPocketBase();
  try {
    const records = await pb.collection(COLLECTIONS.SETTINGS).getFullList({
      filter: `userId = "${userId}"`,
      perPage: 1,
    });
    return records[0] || null;
  } catch {
    return null;
  }
}

export async function getOrCreateUserSettings(userId: string, majorId: string, thesisTrackId: string): Promise<any> {
  const pb = getPocketBase();
  let settings = await getUserSettings(userId);
  
  if (!settings) {
    settings = await pb.collection(COLLECTIONS.SETTINGS).create({
      userId,
      majorId,
      thesisTrackId,
      maxCreditsPerSemester: 9,
      preferredSemesters: ['fall', 'spring'],
      notificationsEnabled: true,
      theme: 'space',
    });
  }
  
  return settings;
}

export async function updateCourseStatus(
  userId: string,
  majorId: string,
  courseId: string,
  status: UserProgress['status'],
  semester?: string,
  grade?: number
): Promise<any> {
  const pb = getPocketBase();
  
  const existing = await pb.collection(COLLECTIONS.USER_PROGRESS).getFirstListItem(
    `userId = "${userId}" && majorId = "${majorId}" && courseId = "${courseId}"`,
    { expand: 'courseId' }
  ).catch(() => null);
  
  const course = await pb.collection(COLLECTIONS.COURSES).getOne(courseId);
  const creditsEarned = status === 'passed' ? course.credits : 0;
  
  if (existing) {
    return pb.collection(COLLECTIONS.USER_PROGRESS).update(existing.id, {
      status,
      semester,
      grade,
      creditsEarned,
    }, { expand: 'courseId' });
  }
  
  return pb.collection(COLLECTIONS.USER_PROGRESS).create({
    userId,
    majorId,
    courseId,
    status,
    semester,
    grade,
    creditsEarned,
  }, { expand: 'courseId' });
}

export function getNextStatus(current: UserProgress['status']): UserProgress['status'] {
  const cycle: UserProgress['status'][] = ['pending', 'registered', 'passed', 'failed'];
  const idx = cycle.indexOf(current);
  return cycle[(idx + 1) % cycle.length];
}

export async function upsertSemesterPlan(
  userId: string,
  majorId: string,
  semester: string,
  courseIds: string[],
  targetCredits: number
): Promise<any> {
  const pb = getPocketBase();
  
  const existing = await pb.collection(COLLECTIONS.SEMESTER_PLANS).getFirstListItem(
    `userId = "${userId}" && majorId = "${majorId}" && semester = "${semester}"`
  ).catch(() => null);
  
  if (existing) {
    return pb.collection(COLLECTIONS.SEMESTER_PLANS).update(existing.id, {
      courseIds,
      targetCredits,
      status: 'planning',
    });
  }
  
  return pb.collection(COLLECTIONS.SEMESTER_PLANS).create({
    userId,
    majorId,
    semester,
    courseIds,
    targetCredits,
    status: 'planning',
  });
}

export function subscribeToProgress(
  userId: string,
  majorId: string,
  callback: (records: any[]) => void
): () => void {
  const pb = getPocketBase();
  
  getUserProgress(userId, majorId).then(callback);
  
  let unsubscribe: (() => void) | null = null;
  
  pb.collection(COLLECTIONS.USER_PROGRESS).subscribe('*', (e) => {
    if (e.record.userId === userId && e.record.majorId === majorId) {
      getUserProgress(userId, majorId).then(callback);
    }
  }).then(fn => { unsubscribe = fn; });
  
  return () => {
    pb.collection(COLLECTIONS.USER_PROGRESS).unsubscribe();
    if (unsubscribe) unsubscribe();
  };
}

export function subscribeToSemesterPlans(
  userId: string,
  majorId: string,
  callback: (records: any[]) => void
): () => void {
  const pb = getPocketBase();
  
  getUserSemesterPlans(userId, majorId).then(callback);
  
  let unsubscribe: (() => void) | null = null;
  
  pb.collection(COLLECTIONS.SEMESTER_PLANS).subscribe('*', (e) => {
    if (e.record.userId === userId && e.record.majorId === majorId) {
      getUserSemesterPlans(userId, majorId).then(callback);
    }
  }).then(fn => { unsubscribe = fn; });
  
  return () => {
    pb.collection(COLLECTIONS.SEMESTER_PLANS).unsubscribe();
    if (unsubscribe) unsubscribe();
  };
}

// ============================================================
// AUTH HELPERS
// ============================================================

export async function signIn(email: string, password: string) {
  const pb = getPocketBase();
  return pb.collection(COLLECTIONS.USERS).authWithPassword(email, password);
}

export async function signUp(email: string, password: string, passwordConfirm: string, majorId: string, thesisTrackId: string) {
  const pb = getPocketBase();
  const user = await pb.collection(COLLECTIONS.USERS).create({
    email,
    password,
    passwordConfirm,
    majorId,
    thesisTrackId,
  });
  
  await getOrCreateUserSettings(user.id, majorId, thesisTrackId);
  
  return pb.collection(COLLECTIONS.USERS).authWithPassword(email, password);
}

export async function signOut() {
  const pb = getPocketBase();
  pb.authStore.clear();
}

export function getCurrentUser() {
  const pb = getPocketBase();
  return pb.authStore.model;
}

export function isAuthenticated(): boolean {
  const pb = getPocketBase();
  return pb.authStore.isValid;
}

// ============================================================
// GUEST DATA MIGRATION
// ============================================================

export async function migrateGuestToUser(
  userId: string,
  guestData: any
): Promise<void> {
  const pb = getPocketBase();
  
  for (const [courseId, status] of Object.entries(guestData.courseStatus)) {
    if (status !== 'pending') {
      await updateCourseStatus(userId, guestData.majorId, courseId, status as UserProgress['status']);
    }
  }
  
  for (const plan of guestData.semesterPlans) {
    await upsertSemesterPlan(
      userId,
      guestData.majorId,
      plan.semester,
      plan.courseIds,
      plan.targetCredits
    );
  }
  
  await getOrCreateUserSettings(userId, guestData.majorId, guestData.thesisTrackId);
}

// ============================================================
// ADMIN/SCRAPER HELPERS
// ============================================================

export async function importCourses(majorId: string, courses: any[]): Promise<number> {
  const pb = getPocketBase();
  let imported = 0;
  
  for (const course of courses) {
    try {
      const existing = await pb.collection(COLLECTIONS.COURSES).getFirstListItem(
        `majorId = "${majorId}" && courseId = "${course.courseId}"`
      ).catch(() => null);
      
      if (!existing) {
        await pb.collection(COLLECTIONS.COURSES).create(course);
        imported++;
      }
    } catch (error) {
      console.error(`Failed to import course ${course.courseId}:`, error);
    }
  }
  
  return imported;
}

export async function clearCourses(majorId: string): Promise<number> {
  const pb = getPocketBase();
  const records = await pb.collection(COLLECTIONS.COURSES).getFullList({
    filter: `majorId = "${majorId}"`,
  });
  
  for (const record of records) {
    await pb.collection(COLLECTIONS.COURSES).delete(record.id);
  }
  
  return records.length;
}
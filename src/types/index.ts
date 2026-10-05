/**
 * Core type definitions for Master's Progress Tracker
 * Multi-major support with config-driven architecture
 */

// ============================================================
// MAJOR CONFIGURATION
// ============================================================

export interface MajorConfig {
  id: string;
  name: string;
  nameAr: string;
  collegeId: string;           // HU college ID (e.g., '100000' for Prince Hussein College)
  departmentId: string;        // HU department ID
  courseIdPrefix: string;      // Non-thesis course prefix (e.g., '1210037')
  thesisPatterns: ThesisPattern[];
  creditsPerCourse: number;    // Standard credits per course (3)
  maxCoursesPerSemester: number; // Max courses student can register (3)
  minCoursesPerSemester: number; // Min courses (2)
  typicalCoursesOffered: number; // Dept typically offers (4)
  totalCreditsRequired: number;  // Total for graduation (33)
  thesisCreditsRequired: number; // Thesis credits (9)
  courseCreditsRequired: number; // Course credits (24)
}

export interface ThesisPattern {
  id: string;                  // '9hr', '6hr', '3hr'
  label: string;               // '9 Credit Hours'
  courseId: string;            // Full course ID (e.g., '91003799')
  credits: number;             // 9, 6, or 3
  description: string;
}

// Pre-defined major configs (extensible)
export const MAJOR_CONFIGS: Record<string, MajorConfig> = {
  swe: {
    id: 'swe',
    name: 'Software Engineering',
    nameAr: 'هندسة البرمجيات',
    collegeId: '100000', // Prince Hussein College of IT
    departmentId: '',    // Will be populated from scraping
    courseIdPrefix: '1210037',
    thesisPatterns: [
      { id: '9hr', label: '9 Credit Hours', courseId: '91003799', credits: 9, description: 'Full thesis track' },
      { id: '6hr', label: '6 Credit Hours', courseId: '61003799', credits: 6, description: 'Partial thesis + project' },
      { id: '3hr', label: '3 Credit Hours', courseId: '31003799', credits: 3, description: 'Project-based track' },
    ],
    creditsPerCourse: 3,
    maxCoursesPerSemester: 3,
    minCoursesPerSemester: 2,
    typicalCoursesOffered: 4,
    totalCreditsRequired: 33,
    thesisCreditsRequired: 9,
    courseCreditsRequired: 24,
  },
  // Future majors can be added here
  csa: {
    id: 'csa',
    name: 'Computer Science & Applications',
    nameAr: 'علوم الحاسوب وتطبيقاتها',
    collegeId: '100000',
    departmentId: '',
    courseIdPrefix: '1210037',
    thesisPatterns: [
      { id: '9hr', label: '9 Credit Hours', courseId: '91003799', credits: 9, description: 'Full thesis track' },
      { id: '6hr', label: '6 Credit Hours', courseId: '61003799', credits: 6, description: 'Partial thesis + project' },
      { id: '3hr', label: '3 Credit Hours', courseId: '31003799', credits: 3, description: 'Project-based track' },
    ],
    creditsPerCourse: 3,
    maxCoursesPerSemester: 3,
    minCoursesPerSemester: 2,
    typicalCoursesOffered: 4,
    totalCreditsRequired: 33,
    thesisCreditsRequired: 9,
    courseCreditsRequired: 24,
  },
  cis: {
    id: 'cis',
    name: 'Computer Information Systems',
    nameAr: 'نظم معلومات الحاسوب',
    collegeId: '100000',
    departmentId: '',
    courseIdPrefix: '1210037',
    thesisPatterns: [
      { id: '9hr', label: '9 Credit Hours', courseId: '91003799', credits: 9, description: 'Full thesis track' },
      { id: '6hr', label: '6 Credit Hours', courseId: '61003799', credits: 6, description: 'Partial thesis + project' },
      { id: '3hr', label: '3 Credit Hours', courseId: '31003799', credits: 3, description: 'Project-based track' },
    ],
    creditsPerCourse: 3,
    maxCoursesPerSemester: 3,
    minCoursesPerSemester: 2,
    typicalCoursesOffered: 4,
    totalCreditsRequired: 33,
    thesisCreditsRequired: 9,
    courseCreditsRequired: 24,
  },
};

// ============================================================
// COURSE TYPES
// ============================================================

export type CourseType = 'core' | 'elective' | 'thesis';
export type CourseStatus = 'pending' | 'registered' | 'passed' | 'failed';
export type SemesterSeason = 'fall' | 'spring' | 'summer';

export interface Course {
  id: string;                    // PocketBase record ID
  majorId: string;               // Ref to major config
  courseId: string;              // HU Course ID (e.g., '121003701')
  code: string;                  // Display code (e.g., 'SWE 701')
  nameAr: string;                // Arabic name
  nameEn: string;                // English name
  credits: number;               // Credit hours (typically 3)
  type: CourseType;
  semesterOffered: SemesterSeason[]; // Which semesters it's typically offered
  isThesis: boolean;             // True for thesis courses
  thesisPatternId?: string;      // For thesis courses: '9hr' | '6hr' | '3hr'
  description?: string;
  created: string;
  updated: string;
}

export interface RawCourseFromHU {
  courseId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  credits: number;
  department: string;
  semester: string;
  year: string;
  type?: 'core' | 'elective' | 'thesis';
  semesterOffered?: SemesterSeason[];
  isThesis?: boolean;
  thesisPatternId?: string;
}

// ============================================================
// USER PROGRESS
// ============================================================

export interface UserProgress {
  id: string;                    // PocketBase record ID
  userId: string;                // PocketBase auth user ID
  majorId: string;               // Major being tracked
  courseId: string;              // Ref to courses collection
  status: CourseStatus;
  semester?: string;             // e.g., '2025-fall'
  grade?: number;                // 0-100
  letterGrade?: string;          // A, B, C, D, F
  creditsEarned: number;         // 0 or course credits
  notes?: string;
  created: string;
  updated: string;
}

// Guest progress (stored in localStorage)
export interface GuestProgress {
  majorId: string;
  courseStatus: Record<string, CourseStatus>; // courseId -> status
  semesterPlans: GuestSemesterPlan[];
  thesisTrackId: string;         // Selected thesis pattern
  updatedAt: number;             // Timestamp
}

export interface GuestSemesterPlan {
  id: string;
  semester: string;              // e.g., '2025-fall'
  targetCredits: number;
  courseIds: string[];           // Selected course IDs
  status: 'planning' | 'confirmed' | 'completed';
  createdAt: number;
}

// ============================================================
// SEMESTER PLANNING
// ============================================================

export interface SemesterPlan {
  id: string;
  userId: string;
  majorId: string;
  semester: string;              // e.g., '2025-fall'
  targetCredits: number;
  courseIds: string[];           // Selected courses
  status: 'planning' | 'confirmed' | 'completed';
  created: string;
  updated: string;
}

export interface SemesterOffering {
  semester: string;              // e.g., '2025-fall'
  season: SemesterSeason;
  year: number;
  offeredCourseIds: string[];    // 4 courses dept offers this semester
  isCurrent: boolean;
  isPast: boolean;
  isFuture: boolean;
}

// ============================================================
// SETTINGS
// ============================================================

export interface UserSettings {
  id: string;
  userId: string;
  majorId: string;
  thesisTrackId: string;         // Selected thesis pattern
  maxCreditsPerSemester: number; // Default: 9 (3 courses)
  preferredSemesters: SemesterSeason[]; // Which semesters they attend
  notificationsEnabled: boolean;
  theme: 'space';                // Only space theme for now
  created: string;
  updated: string;
}

// ============================================================
// SUGGESTION ENGINE
// ============================================================

export interface CourseSuggestion {
  courseId: string;
  course: Course;
  reason: SuggestionReason;
  score: number;                 // 0-1
  priority: 'high' | 'medium' | 'low';
}

export type SuggestionReason =
  | 'required_for_graduation'
  | 'fits_credit_budget'
  | 'offered_this_semester'
  | 'thesis_track_requirement'
  | 'completes_course_requirements';

export interface SuggestionContext {
  majorId: string;
  thesisTrackId: string;
  targetSemester: string;
  targetCredits: number;
  completedCourseIds: string[];
  registeredCourseIds: string[];
  failedCourseIds: string[];
  plannedCourseIds: string[];    // Already planned for this semester
  offeredCourseIds: string[];    // What dept offers this semester
}

// ============================================================
// AUTH & SESSION
// ============================================================

export type AuthMode = 'guest' | 'authenticated';

export interface AuthState {
  mode: AuthMode;
  userId?: string;
  email?: string;
  majorId?: string;
  isGuest: boolean;
  guestData?: GuestProgress;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  majorId: string;
  thesisTrackId: string;
}

// ============================================================
// API RESPONSES
// ============================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

// ============================================================
// SCRAPER TYPES
// ============================================================

export interface ScrapedCourseData {
  majorId: string;
  courses: RawCourseFromHU[];
  scrapedAt: string;
  sourceUrl: string;
}

export interface ScrapeResult {
  success: boolean;
  coursesFound: number;
  coursesImported: number;
  errors: string[];
  data?: ScrapedCourseData;
}
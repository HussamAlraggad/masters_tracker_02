import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with tailwind-merge for proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format semester string for display
 * e.g., '2025-fall' -> 'Fall 2025'
 */
export function formatSemester(semester: string): string {
  const [year, season] = semester.split('-');
  const seasonLabels: Record<string, string> = {
    fall: 'Fall',
    spring: 'Spring',
    summer: 'Summer',
  };
  return `${seasonLabels[season] || season} ${year}`;
}

/**
 * Parse semester string to components
 */
export function parseSemester(semester: string): { year: number; season: string } | null {
  const match = semester.match(/^(\d{4})-(fall|spring|summer)$/);
  if (!match) return null;
  return { year: parseInt(match[1], 10), season: match[2] };
}

/**
 * Generate semester string from year and season
 */
export function generateSemester(year: number, season: 'fall' | 'spring' | 'summer'): string {
  return `${year}-${season}`;
}

/**
 * Get next semester
 */
export function getNextSemester(semester: string): string {
  const parsed = parseSemester(semester);
  if (!parsed) return semester;
  
  const seasons: Array<'fall' | 'spring' | 'summer'> = ['fall', 'spring', 'summer'];
  const currentIndex = seasons.indexOf(parsed.season as 'fall' | 'spring' | 'summer');
  
  if (currentIndex === seasons.length - 1) {
    return generateSemester(parsed.year + 1, seasons[0]);
  }
  
  return generateSemester(parsed.year, seasons[currentIndex + 1]);
}

/**
 * Get previous semester
 */
export function getPreviousSemester(semester: string): string {
  const parsed = parseSemester(semester);
  if (!parsed) return semester;
  
  const seasons: Array<'fall' | 'spring' | 'summer'> = ['fall', 'spring', 'summer'];
  const currentIndex = seasons.indexOf(parsed.season as 'fall' | 'spring' | 'summer');
  
  if (currentIndex === 0) {
    return generateSemester(parsed.year - 1, seasons[seasons.length - 1]);
  }
  
  return generateSemester(parsed.year, seasons[currentIndex - 1]);
}

/**
 * Get current academic semester based on date
 */
export function getCurrentAcademicSemester(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11
  
  // Academic year typically starts in fall (September)
  // Fall: Sep-Dec (8-11), Spring: Jan-May (0-4), Summer: Jun-Aug (5-7)
  let season: 'fall' | 'spring' | 'summer';
  
  if (month >= 8) { // September onwards
    season = 'fall';
  } else if (month >= 5) { // June-August
    season = 'summer';
  } else { // January-May
    season = 'spring';
  }
  
  // If we're in Jan-Aug, the academic year started last fall
  const academicYear = month >= 8 ? year : year - 1;
  
  return generateSemester(academicYear, season);
}

/**
 * Generate array of semesters around current
 */
export function getSemesterRange(center: string, range: number = 4): string[] {
  const semesters: string[] = [];
  let current = center;
  
  // Add previous semesters
  for (let i = 0; i < range; i++) {
    current = getPreviousSemester(current);
    semesters.unshift(current);
  }
  
  // Add center
  semesters.push(center);
  
  // Add future semesters
  current = center;
  for (let i = 0; i < range; i++) {
    current = getNextSemester(current);
    semesters.push(current);
  }
  
  return semesters;
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((completed / total) * 100));
}

/**
 * Calculate credits earned
 */
export function calculateCreditsEarned(progress: Array<{ status: string; credits: number }>): number {
  return progress
    .filter(p => p.status === 'passed')
    .reduce((sum, p) => sum + p.credits, 0);
}

/**
 * Get status color class
 */
export function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    pending: 'status-pending',
    registered: 'status-registered',
    passed: 'status-passed',
    failed: 'status-failed',
  };
  return classes[status] || 'status-pending';
}

/**
 * Get status label
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    registered: 'Registered',
    passed: 'Passed',
    failed: 'Failed',
  };
  return labels[status] || status;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if running in browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Safe localStorage get
 */
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (!isBrowser()) return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Safe localStorage set
 */
export function setLocalStorage<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota exceeded errors
  }
}

/**
 * Remove localStorage item
 */
export function removeLocalStorage(key: string): void {
  if (!isBrowser()) return;
  localStorage.removeItem(key);
}

/**
 * Format number with Arabic numerals (for RTL display)
 */
export function toArabicNumerals(num: number | string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).replace(/\d/g, (d) => arabicDigits[parseInt(d, 10)]);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry async function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await sleep(baseDelay * Math.pow(2, attempt - 1));
      }
    }
  }
  
  throw lastError!;
}
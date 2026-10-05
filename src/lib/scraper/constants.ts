/**
 * HU Scraper Constants
 * Centralized configuration for the Hashemite University course scraper
 */

export const HU_BASE_URL = 'https://hu.edu.jo/unitCenter/class_a.aspx?t=0&unitid=40000000';
export const COLLEGE_ID = '100000'; // Prince Hussein College of IT

export const DEPARTMENT_LABELS = {
  swe: 'هندسة البرمجيات',
  csa: 'علم الحاسوب وتطبيقاته',
  cis: 'انظمة المعلومات الحاسوبية',
} as const;

export const MASTERS_PREFIX = '1210037';
export const THESIS_PATTERNS = ['91003799', '61003799', '31003799', '121003799'] as const;

export const FIRECRAWL_TIMEOUT = 300000; // 5 minutes

// Table column indices (0-based) from the GridView
export const TABLE_COLUMNS = {
  COURSE_ID: 0,
  SECTION: 1,
  THEORETICAL: 2,
  NAME_AR: 3,
  CREDITS: 4,
  INSTRUCTOR: 5,
  SCHEDULE_ROOM: 6,
  PREREQUISITE: 7,
} as const;
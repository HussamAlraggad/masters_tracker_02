/**
 * Firecrawl-based HU Course Sync
 * Uses Firecrawl's interact API to handle ASP.NET postbacks reliably
 */

import { firecrawlInteract } from '@/lib/firecrawl';
import type { RawCourseFromHU, Course, MajorConfig } from '@/types';
import { 
  HU_BASE_URL, 
  COLLEGE_ID, 
  DEPARTMENT_LABELS, 
  MASTERS_PREFIX, 
  THESIS_PATTERNS,
  TABLE_COLUMNS,
  FIRECRAWL_TIMEOUT 
} from './constants';
import { getCurrentAcademicSemester } from '@/lib/utils';
import { MAJOR_CONFIGS } from '@/types';

export interface SyncResult {
  success: boolean;
  imported: number;
  updated: number;
  errors: string[];
  courses: Course[];
}

export interface SyncOptions {
  majorId: string;
  semester?: string;
  onProgress?: (step: string, progress: number) => void;
}

/**
 * Detect current academic semester
 * Fall: Sep-Dec (15001), Spring: Jan-May (15002), Summer: Jun-Aug (15003)
 */
export function detectCurrentSemester(): string {
  return getCurrentAcademicSemester();
}

/**
 * Get department label for a major
 */
export function getDepartmentLabel(majorId: string): string {
  return DEPARTMENT_LABELS[majorId as keyof typeof DEPARTMENT_LABELS] || '';
}

/**
 * Build Firecrawl prompt for the interact API
 */
export function buildFirecrawlPrompt(majorId: string, semester: string): string {
  const departmentLabel = getDepartmentLabel(majorId);
  const [year, semCode] = semester.split('-');
  
  return `
Navigate to ${HU_BASE_URL}

This is an ASP.NET WebForms page with postbacks. Follow these steps exactly:

1. SELECT YEAR: Find the dropdown with id "ctl00_ContentPlaceHolder1_l_year" and select value "${year}"
2. SELECT SEMESTER: Find the dropdown with id "ctl00_ContentPlaceHolder1_l_sem" and select value "${semCode}"
3. SELECT COLLEGE: Find the dropdown with id "ctl00_ContentPlaceHolder1_fac_l" and select value "${COLLEGE_ID}" (الامير الحسين بن عبدالله الثاني لتكنولوجيا المعلومات)
4. WAIT FOR POSTBACK: Wait for the department dropdown (id "ctl00_ContentPlaceHolder1_dept_l") to become enabled and populated
5. SELECT DEPARTMENT: Find the dropdown with id "ctl00_ContentPlaceHolder1_dept_l" and select the option with text "${getDepartmentLabel(majorId)}"
6. CLICK SEARCH: Click the button with id "ctl00_ContentPlaceHolder1_Button5" (value "حسب الكلية - القسم")
7. WAIT FOR RESULTS: Wait for the GridView table to appear inside the div with id "__gvctl00_ContentPlaceHolder1_GridView1__div"
8. RETURN TABLE: Return all rows from the table with their cell data

The table has 8 columns:
1. رقم المادة (Course ID)
2. رقم الشعبة (Section)
3. نظري (Theoretical)
4. إسم المادة (Course Name Arabic)
5. الساعات (Credits)
6. المدرس (Instructor)
7. الموعد / القاعة (Schedule/Room)
8. المتطلب السابق (Prerequisite)

Return the complete table data as structured data.
  `.trim();
}

/**
 * Parse table output from Firecrawl
 */
export function parseTableOutput(output: string): RawCourseFromHU[] {
  const courses: RawCourseFromHU[] = [];
  
  // The output from Firecrawl interact is markdown table format
  // Parse the markdown table rows
  const lines = output.split('\n');
  let inTable = false;
  
  for (const line of lines) {
    // Skip header and separator lines
    if (line.includes('| رقم المادة') || line.includes('|---') || line.trim() === '') {
      if (line.includes('| رقم المادة')) inTable = true;
      continue;
    }
    
    if (!inTable) continue;
    
    // Parse table row: | value1 | value2 | value3 | ...
    const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
    if (cells.length < 8) continue;
    
    const courseId = cells[TABLE_COLUMNS.COURSE_ID]?.trim() || '';
    const nameAr = cells[TABLE_COLUMNS.NAME_AR]?.trim() || '';
    const creditsText = cells[TABLE_COLUMNS.CREDITS]?.trim() || '3';
    const credits = parseInt(creditsText, 10) || 3;
    
    if (!courseId || !nameAr) continue;
    
    // Filter for master's courses only
    const isMasters = courseId.startsWith(MASTERS_PREFIX) || 
                      THESIS_PATTERNS.some(p => courseId === p);
    if (!isMasters) continue;
    
    // Determine course type
    const isThesis = THESIS_PATTERNS.some(p => courseId === p);
    let type: 'core' | 'elective' | 'thesis' = 'elective';
    if (isThesis) type = 'thesis';
    else if (courseId.endsWith('01') || courseId.endsWith('02') || courseId.endsWith('03')) {
      type = 'core';
    }
    
    // Determine thesis pattern
    let thesisPatternId: string | undefined;
    if (isThesis) {
      if (courseId === '91003799') thesisPatternId = '9hr';
      else if (courseId === '61003799') thesisPatternId = '6hr';
      else if (courseId === '31003799') thesisPatternId = '3hr';
      else if (courseId === '121003799') thesisPatternId = '9hr';
    }
    
    courses.push({
      courseId,
      code: courseId, // Will be formatted later
      nameAr,
      nameEn: nameAr, // Placeholder, could be translated
      credits,
      type,
      semesterOffered: ['fall', 'spring'],
      isThesis,
      thesisPatternId,
      department: 'Software Engineering',
      semester: 'fall',
      year: '2025',
    });
  }
  
  return courses;
}

/**
 * Fix thesis credits based on source
 * If 91003799 shows 0 credits, keep as 0; otherwise use source value
 */
export function fixThesisCredits(courses: RawCourseFromHU[]): RawCourseFromHU[] {
  return courses.map(course => {
    if (course.courseId === '91003799' && course.credits === 0) {
      return { ...course, credits: 0 }; // Keep as 0 per user requirement
    }
    if (course.courseId === '61003799' && course.credits === 0) {
      return { ...course, credits: 6 };
    }
    if (course.courseId === '31003799' && course.credits === 0) {
      return { ...course, credits: 3 };
    }
    if (course.courseId === '121003799' && course.credits === 0) {
      return { ...course, credits: 9 };
    }
    return course;
  });
}

/**
 * Format course code from course ID
 */
export function formatCourseCode(courseId: string): string {
  const match = courseId.match(/1210037(\d{2,3})/);
  if (match) return `SWE ${match[1]}`;
  
  // Thesis courses
  if (courseId === '91003799') return 'SWE 799';
  if (courseId === '61003799') return 'SWE 798';
  if (courseId === '31003799') return 'SWE 797';
  if (courseId === '121003799') return 'SWE 799';
  
  return courseId;
}

/**
 * Main sync function - orchestrates the full sync flow
 */
export async function syncFromHU(options: SyncOptions): Promise<SyncResult> {
  const { majorId, semester, onProgress } = options;
  
  const targetSemester = semester || detectCurrentSemester();
  const departmentLabel = getDepartmentLabel(majorId);
  
  if (!departmentLabel) {
    return {
      success: false,
      imported: 0,
      updated: 0,
      errors: [`Unknown major: ${majorId}`],
      courses: [],
    };
  }
  
  try {
    onProgress?.('Building Firecrawl prompt...', 10);
    
    const prompt = buildFirecrawlPrompt(majorId, targetSemester);
    
    onProgress?.('Fetching from HU (this may take 30-60s)...', 20);
    
    // Call Firecrawl interact API
    const result = await firecrawlInteract({
      url: HU_BASE_URL,
      prompt,
      timeout: FIRECRAWL_TIMEOUT,
    });
    
    onProgress?.('Parsing course table...', 50);
    
    // Parse the output
    let courses = parseTableOutput(result.output || '');
    
    if (courses.length === 0) {
      return {
        success: false,
        imported: 0,
        updated: 0,
        errors: ['No courses found. The HU page structure may have changed.'],
        courses: [],
      };
    }
    
    onProgress?.('Fixing thesis credits...', 70);
    
    // Fix thesis credits
    courses = fixThesisCredits(courses);
    
    // Format course codes
    courses = courses.map(course => ({
      ...course,
      code: formatCourseCode(course.courseId),
    }));
    
    // Convert RawCourseFromHU to Course type
    const coursesConverted: Course[] = courses.map(course => ({
      id: '', // Will be generated by PocketBase
      majorId,
      courseId: course.courseId,
      code: course.code,
      nameAr: course.nameAr,
      nameEn: course.nameEn,
      credits: course.credits,
      type: course.type || 'elective',
      semesterOffered: course.semesterOffered || ['fall', 'spring'],
      isThesis: course.isThesis || false,
      thesisPatternId: course.thesisPatternId,
      description: undefined,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }));
    
    onProgress?.('Done!', 100);
    
    return {
      success: true,
      imported: coursesConverted.length,
      updated: 0, // Will be calculated during import
      errors: [],
      courses: coursesConverted,
    };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sync failed:', error);
    
    return {
      success: false,
      imported: 0,
      updated: 0,
      errors: [errorMsg],
      courses: [],
    };
  }
}

/**
 * Import courses to PocketBase
 */
export async function importCoursesToPocketBase(
  courses: RawCourseFromHU[],
  majorId: string
): Promise<{ imported: number; updated: number; errors: string[] }> {
  // This will be implemented in the API route using PocketBase client
  // For now, return placeholder
  return { imported: 0, updated: 0, errors: [] };
}
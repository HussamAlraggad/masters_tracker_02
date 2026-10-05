/**
 * HU (Hashemite University) Course Scraper
 * Fetches master's courses from the university's class schedule system
 * 
 * Target URL: https://hu.edu.jo/unitCenter/class_a.aspx?t=0&unitid=40000000
 * College: Prince Hussein College of IT (100000)
 * Department: Software Engineering / Computer Science / CIS
 * Course ID Patterns: 
 *   - Non-thesis: 1210037XX
 *   - Thesis: 91003799 (9hr), 61003799 (6hr), 31003799 (3hr)
 */

import { chromium, Browser, Page } from 'playwright';
import type { RawCourseFromHU, MajorConfig, ScrapeResult } from '@/types';
import { MAJOR_CONFIGS } from '@/types';

// ============================================================
// CONFIGURATION
// ============================================================

const HU_BASE_URL = 'https://hu.edu.jo/unitCenter/class_a.aspx?t=0&unitid=40000000';
const COLLEGE_ID = '100000'; // Prince Hussein College of IT

const COURSE_ID_PREFIX = '1210037';
const THESIS_PATTERNS = ['91003799', '61003799', '31003799'];

// ============================================================
// SCRAPER CLASS
// ============================================================

export class HUCourseScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initialize(headless: boolean = true): Promise<void> {
    this.browser = await chromium.launch({ 
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    this.page = await this.browser.newPage();
    
    this.page.setDefaultTimeout(60000);
    this.page.setDefaultNavigationTimeout(60000);
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  async scrapeMajor(majorConfig: MajorConfig): Promise<ScrapeResult> {
    if (!this.page) throw new Error('Scraper not initialized');

    const errors: string[] = [];
    let coursesFound = 0;
    let coursesImported = 0;
    const scrapedCourses: RawCourseFromHU[] = [];

    try {
      console.log('Navigating to HU class schedule...');
      await this.page.goto(HU_BASE_URL, { waitUntil: 'networkidle' });

      console.log('Selecting college:', COLLEGE_ID);
      await this.selectCollege(COLLEGE_ID);

      await this.page.waitForTimeout(2000);

      const departmentId = await this.discoverDepartmentId(majorConfig.id);
      if (!departmentId) {
        throw new Error(`Could not find department ID for major: ${majorConfig.id}`);
      }
      majorConfig.departmentId = departmentId;

      console.log('Selecting department:', departmentId);
      await this.selectDepartment(departmentId);

      console.log('Searching for courses...');
      await this.page.click('#ctl00_ContentPlaceHolder1_Button5');
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(3000);

      const courses = await this.parseCourseTable();
      coursesFound = courses.length;

      const mastersCourses = this.filterMastersCourses(courses, majorConfig);
      console.log(`Found ${mastersCourses.length} master's courses out of ${coursesFound} total`);

      for (const course of mastersCourses) {
        const enriched = await this.enrichCourse(course, majorConfig);
        scrapedCourses.push(enriched);
      }

      coursesImported = scrapedCourses.length;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMsg);
      console.error('Scraping failed:', errorMsg);
    }

    return {
      success: errors.length === 0,
      coursesFound,
      coursesImported,
      errors,
      data: {
        majorId: majorConfig.id,
        courses: scrapedCourses,
        scrapedAt: new Date().toISOString(),
        sourceUrl: HU_BASE_URL,
      },
    };
  }

  private async selectCollege(collegeId: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    await this.page.selectOption('#ctl00_ContentPlaceHolder1_fac_l', collegeId);
    await this.page.waitForFunction(() => {
      const deptSelect = document.querySelector('#ctl00_ContentPlaceHolder1_dept_l') as HTMLSelectElement;
      return deptSelect && !deptSelect.disabled && deptSelect.options.length > 1;
    }, { timeout: 10000 });
  }

  private async discoverDepartmentId(majorId: string): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    const departmentNames: Record<string, string[]> = {
      swe: ['software engineering', 'هندسة البرمجيات', 'swe'],
      csa: ['computer science', 'علوم الحاسوب', 'csa', 'computer science and applications'],
      cis: ['computer information systems', 'نظم معلومات الحاسوب', 'cis'],
    };

    const searchTerms = departmentNames[majorId] || [majorId];

    const options = await this.page.$$eval('#ctl00_ContentPlaceHolder1_dept_l option', 
      (options) => options.map(opt => ({ value: (opt as HTMLOptionElement).value, text: opt.textContent?.trim() || '' }))
    );

    for (const option of options) {
      const textLower = option.text.toLowerCase();
      if (searchTerms.some(term => textLower.includes(term.toLowerCase()))) {
        console.log(`Found department: ${option.text} (${option.value})`);
        return option.value;
      }
    }

    console.log('Available departments:', options.map(o => `${o.value}: ${o.text}`).join(', '));
    return '';
  }

  private async selectDepartment(departmentId: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    await this.page.selectOption('#ctl00_ContentPlaceHolder1_dept_l', departmentId);
  }

  private async parseCourseTable(): Promise<RawCourseFromHU[]> {
    if (!this.page) throw new Error('Page not initialized');

    await this.page.waitForSelector('#__gvctl00_ContentPlaceHolder1_GridView1__div table', { timeout: 10000 });

    const courses = await this.page.$$eval(
      '#__gvctl00_ContentPlaceHolder1_GridView1__div table tr',
      (rows) => {
        const courses: RawCourseFromHU[] = [];
        
        rows.forEach((row, index) => {
          if (index === 0) return;
          
          const cells = row.querySelectorAll('td');
          if (cells.length < 6) return;

          const courseId = cells[0]?.textContent?.trim() || '';
          const courseName = cells[1]?.textContent?.trim() || '';
          const creditsText = cells[2]?.textContent?.trim() || '3';
          const section = cells[3]?.textContent?.trim() || '';
          const time = cells[4]?.textContent?.trim() || '';
          const instructor = cells[5]?.textContent?.trim() || '';

          if (!courseId || !courseName) return;

          const credits = parseInt(creditsText, 10) || 3;

          const codeMatch = courseId.match(/1210037(\d{2,3})/);
          const code = codeMatch ? `SWE ${codeMatch[1]}` : courseId;

          courses.push({
            courseId,
            code,
            nameAr: courseName,
            nameEn: courseName,
            credits,
            department: 'Software Engineering',
            semester: 'fall',
            year: '2025',
          });
        });

        return courses;
      }
    );

    return courses;
  }

  private filterMastersCourses(courses: RawCourseFromHU[], majorConfig: MajorConfig): RawCourseFromHU[] {
    return courses.filter(course => {
      if (course.courseId.startsWith(majorConfig.courseIdPrefix)) {
        return true;
      }
      if (THESIS_PATTERNS.some(pattern => course.courseId === pattern)) {
        return true;
      }
      return false;
    });
  }

  private async enrichCourse(course: RawCourseFromHU, majorConfig: MajorConfig): Promise<RawCourseFromHU> {
    const isThesis = THESIS_PATTERNS.includes(course.courseId);
    
    let thesisPatternId: string | undefined;
    if (isThesis) {
      if (course.courseId === '91003799') thesisPatternId = '9hr';
      else if (course.courseId === '61003799') thesisPatternId = '6hr';
      else if (course.courseId === '31003799') thesisPatternId = '3hr';
    }

    let type: 'core' | 'elective' | 'thesis' = 'elective';
    if (isThesis) type = 'thesis';
    else if (course.courseId.endsWith('01') || course.courseId.endsWith('02') || course.courseId.endsWith('03')) {
      type = 'core';
    }

    const semesterOffered: ('fall' | 'spring' | 'summer')[] = ['fall', 'spring'];

    return {
      ...course,
      nameEn: course.nameAr,
      credits: course.credits || majorConfig.creditsPerCourse,
    };
  }
}

export async function scrapeAllMajors(): Promise<Record<string, ScrapeResult>> {
  const scraper = new HUCourseScraper();
  const results: Record<string, ScrapeResult> = {};

  try {
    await scraper.initialize(true);

    for (const [majorId, majorConfig] of Object.entries(MAJOR_CONFIGS)) {
      console.log(`\n=== Scraping ${majorConfig.name} ===`);
      const result = await scraper.scrapeMajor({ ...majorConfig });
      results[majorId] = result;
      
      console.log(`Result: ${result.coursesImported}/${result.coursesFound} courses imported`);
      if (result.errors.length > 0) {
        console.error('Errors:', result.errors);
      }
    }

  } finally {
    await scraper.close();
  }

  return results;
}

export function mapToPocketBaseCourse(
  raw: RawCourseFromHU, 
  majorId: string,
  thesisPatternId?: string
): any {
  const isThesis = THESIS_PATTERNS.includes(raw.courseId);
  
  return {
    majorId,
    courseId: raw.courseId,
    code: raw.code,
    nameAr: raw.nameAr,
    nameEn: raw.nameEn,
    credits: raw.credits,
    type: isThesis ? 'thesis' : 'core',
    semesterOffered: ['fall', 'spring'],
    isThesis,
    thesisPatternId,
    description: undefined,
  };
}

if (require.main === module) {
  scrapeAllMajors()
    .then(results => {
      console.log('\n=== SCRAPING COMPLETE ===');
      console.log(JSON.stringify(results, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
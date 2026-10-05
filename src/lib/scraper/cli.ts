#!/usr/bin/env tsx
/**
 * CLI Entry Point for HU Course Scraper
 * Usage: npm run scrape [swe|csa|cis]
 */

import { HUCourseScraper, scrapeAllMajors, mapToPocketBaseCourse } from './hu-client';
import { MAJOR_CONFIGS } from '@/types';
import { createServerPocketBase } from '@/lib/pocketbase/client';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'admin@masterstracker.local';
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || 'admin123456';

async function authenticateAdmin(pb: ReturnType<typeof createServerPocketBase>) {
  try {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✓ Authenticated as admin');
  } catch (error) {
    console.error('✗ Admin authentication failed:', error);
    throw error;
  }
}

async function importCoursesToPocketBase(majorId: string, courses: Awaited<ReturnType<typeof mapToPocketBaseCourse>>[]) {
  const pb = createServerPocketBase();
  await authenticateAdmin(pb);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const course of courses) {
    try {
      // Check if exists
      const existing = await pb.collection('courses').getFirstListItem(
        `majorId = "${majorId}" && courseId = "${course.courseId}"`
      ).catch(() => null);

      if (existing) {
        // Update existing
        await pb.collection('courses').update(existing.id, course);
        console.log(`  ↻ Updated: ${course.code} (${course.courseId})`);
        skipped++;
      } else {
        // Create new
        await pb.collection('courses').create(course);
        console.log(`  ✓ Created: ${course.code} (${course.courseId})`);
        imported++;
      }
    } catch (error) {
      console.error(`  ✗ Failed: ${course.code} - ${error}`);
      errors++;
    }
  }

  return { imported, skipped, errors };
}

async function scrapeMajor(majorId: string) {
  const majorConfig = MAJOR_CONFIGS[majorId];
  if (!majorConfig) {
    console.error(`Unknown major: ${majorId}`);
    console.log('Available majors:', Object.keys(MAJOR_CONFIGS).join(', '));
    process.exit(1);
  }

  console.log(`\n🚀 Starting scrape for ${majorConfig.name} (${majorId})`);
  console.log('='.repeat(50));

  const scraper = new HUCourseScraper();
  
  try {
    await scraper.initialize(true);
    const result = await scraper.scrapeMajor({ ...majorConfig });

    console.log('\n📊 Scraping Results:');
    console.log(`  Courses found: ${result.coursesFound}`);
    console.log(`  Master's courses: ${result.coursesImported}`);
    console.log(`  Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(e => console.log(`  - ${e}`));
    }

    if (result.data && result.data.courses.length > 0) {
      console.log('\n📥 Importing to PocketBase...');
      const pbCourses = result.data.courses.map(c => mapToPocketBaseCourse(c, majorId, c.courseId === '91003799' ? '9hr' : c.courseId === '61003799' ? '6hr' : c.courseId === '31003799' ? '3hr' : undefined));
      const stats = await importCoursesToPocketBase(majorId, pbCourses);
      
      console.log('\n✅ Import Complete:');
      console.log(`  Created: ${stats.imported}`);
      console.log(`  Updated: ${stats.skipped}`);
      console.log(`  Errors: ${stats.errors}`);
    }

    return result;

  } finally {
    await scraper.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const majorId = args[0] || 'all';

  console.log('🎓 Masters Tracker - HU Course Scraper');
  console.log('='.repeat(50));
  console.log(`PocketBase URL: ${PB_URL}`);

  if (majorId === 'all') {
    console.log('Scraping all majors...\n');
    const results = await scrapeAllMajors();
    
    console.log('\n📊 Summary:');
    for (const [id, result] of Object.entries(results)) {
      const major = MAJOR_CONFIGS[id];
      console.log(`  ${major?.name || id}: ${result.coursesImported}/${result.coursesFound} courses`);
    }
  } else {
    await scrapeMajor(majorId);
  }

  console.log('\n✨ Done!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
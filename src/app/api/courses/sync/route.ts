/**
 * API Route: Sync courses from HU
 * POST /api/courses/sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPocketBase } from '@/lib/pocketbase/client';
import { syncFromHU, importCoursesToPocketBase } from '@/lib/scraper/firecrawl-sync';
import type { Course } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Get PocketBase instance
    const pb = getPocketBase();
    
    // Check authentication
    if (!pb.authStore.isValid) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const user = pb.authStore.model as unknown as { id: string; majorId?: string; email: string };
    const userId = user.id;
    
    // Parse request body
    const body = await request.json();
    const { majorId, forceOverwrite } = body;
    
    // Use user's major if not provided
    const targetMajorId = majorId || user.majorId;
    
    if (!targetMajorId) {
      return NextResponse.json(
        { success: false, error: 'Major not specified. Please select a major first.' },
        { status: 400 }
      );
    }
    
    // Get current courses from PocketBase to check for conflicts
    const existingCourses = await pb.collection('courses').getFullList({
      filter: `majorId = "${targetMajorId}"`,
    });
    
    // Get user's progress to check for local changes
    const userProgress = await pb.collection('user_progress').getFullList({
      filter: `userId = "${userId}" && majorId = "${targetMajorId}"`,
    });
    
    // Create a map of courseId -> local status
    const localStatusMap = new Map<string, string>();
    userProgress.forEach(p => localStatusMap.set(p.courseId, p.status));
    
    // Sync from HU
    const syncResult = await syncFromHU({
      majorId: targetMajorId,
      onProgress: (step, progress) => {
        // Could emit to SSE or websocket here for real-time updates
        console.log(`[Sync] ${step} (${progress}%)`);
      },
    });
    
    if (!syncResult.success) {
      return NextResponse.json({
        success: false,
        error: syncResult.errors.join(', '),
        imported: 0,
        updated: 0,
      }, { status: 500 });
    }
    
    // Check for courses that would be overwritten
    const coursesToOverwrite = syncResult.courses.filter(course => {
      const localStatus = localStatusMap.get(course.courseId);
      return localStatus && localStatus !== 'pending';
    });
    
    // If there are courses with local changes and forceOverwrite is not true,
    // return a conflict response
    if (coursesToOverwrite.length > 0 && !forceOverwrite) {
      return NextResponse.json({
        success: false,
        error: 'OVERWRITE_CONFLICT',
        message: `${coursesToOverwrite.length} courses have local changes (Registered/Passed/Failed) that would be overwritten.`,
        conflicts: coursesToOverwrite.map(c => ({
          courseId: c.courseId,
          code: c.code,
          nameEn: c.nameEn,
          localStatus: localStatusMap.get(c.courseId),
        })),
        imported: 0,
        updated: 0,
      }, { status: 409 });
    }
    
    // Import courses to PocketBase
    let imported = 0;
    let updated = 0;
    const errors: string[] = [];
    
    for (const course of syncResult.courses) {
      try {
        // Check if course exists
        const existing = await pb.collection('courses').getFirstListItem(
          `majorId = "${targetMajorId}" && courseId = "${course.courseId}"`
        ).catch(() => null);
        
        const courseData = {
          majorId: targetMajorId,
          courseId: course.courseId,
          code: course.code,
          nameAr: course.nameAr,
          nameEn: course.nameEn,
          credits: course.credits,
          type: course.type,
          semesterOffered: course.semesterOffered,
          isThesis: course.isThesis,
          thesisPatternId: course.thesisPatternId,
        };
        
        if (existing) {
          await pb.collection('courses').update(existing.id, courseData);
          updated++;
        } else {
          await pb.collection('courses').create(courseData);
          imported++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to import ${course.code}: ${errorMsg}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      imported,
      updated,
      errors,
      message: `Sync complete: ${imported} imported, ${updated} updated`,
    });
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sync API error:', error);
    
    return NextResponse.json({
      success: false,
      error: errorMsg,
      imported: 0,
      updated: 0,
    }, { status: 500 });
  }
}
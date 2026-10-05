/**
 * PocketBase schema definitions and migration helpers
 * Run these in PocketBase Admin UI > Settings > Migrations
 */

// ============================================================
// COLLECTION SCHEMAS
// ============================================================

export const MAJORS_SCHEMA = {
  name: 'majors',
  type: 'base',
  system: false,
  schema: [
    { name: 'id', type: 'text', required: true, unique: true, options: { min: 1, max: 50, pattern: '^[a-z0-9-]+$' } },
    { name: 'name', type: 'text', required: true, options: { min: 1, max: 100 } },
    { name: 'nameAr', type: 'text', required: true, options: { min: 1, max: 100 } },
    { name: 'collegeId', type: 'text', required: true, options: { min: 1, max: 20 } },
    { name: 'departmentId', type: 'text', required: false, options: { max: 20 } },
    { name: 'courseIdPrefix', type: 'text', required: true, options: { min: 1, max: 20 } },
    { name: 'thesisPatterns', type: 'json', required: true },
    { name: 'creditsPerCourse', type: 'number', required: true, options: { min: 1, max: 10 } },
    { name: 'maxCoursesPerSemester', type: 'number', required: true, options: { min: 1, max: 10 } },
    { name: 'minCoursesPerSemester', type: 'number', required: true, options: { min: 1, max: 10 } },
    { name: 'typicalCoursesOffered', type: 'number', required: true, options: { min: 1, max: 20 } },
    { name: 'totalCreditsRequired', type: 'number', required: true, options: { min: 1, max: 200 } },
    { name: 'thesisCreditsRequired', type: 'number', required: true, options: { min: 1, max: 50 } },
    { name: 'courseCreditsRequired', type: 'number', required: true, options: { min: 1, max: 200 } },
  ],
  indexes: [
    'CREATE UNIQUE INDEX idx_majors_id ON majors (id)',
  ],
  listRule: '',
  viewRule: '',
  createRule: '@request.auth.id != ""',
  updateRule: '@request.auth.id != ""',
  deleteRule: '@request.auth.id != ""',
  options: {},
};

export const COURSES_SCHEMA = {
  name: 'courses',
  type: 'base',
  system: false,
  schema: [
    { name: 'majorId', type: 'relation', required: true, options: { collectionId: 'majors', cascadeDelete: false, minSelect: 1, maxSelect: 1, displayFields: ['name'] } },
    { name: 'courseId', type: 'text', required: true, unique: true, options: { min: 1, max: 50 } },
    { name: 'code', type: 'text', required: true, options: { min: 1, max: 20 } },
    { name: 'nameAr', type: 'text', required: true, options: { min: 1, max: 200 } },
    { name: 'nameEn', type: 'text', required: true, options: { min: 1, max: 200 } },
    { name: 'credits', type: 'number', required: true, options: { min: 1, max: 10 } },
    { name: 'type', type: 'select', required: true, options: { maxSelect: 1, values: ['core', 'elective', 'thesis'] } },
    { name: 'semesterOffered', type: 'json', required: true },
    { name: 'isThesis', type: 'bool', required: true, default: false },
    { name: 'thesisPatternId', type: 'text', required: false, options: { max: 10 } },
    { name: 'description', type: 'editor', required: false },
  ],
  indexes: [
    'CREATE UNIQUE INDEX idx_courses_courseId ON courses (courseId)',
    'CREATE INDEX idx_courses_majorId ON courses (majorId)',
    'CREATE INDEX idx_courses_type ON courses (type)',
  ],
  listRule: '',
  viewRule: '',
  createRule: '@request.auth.id != ""',
  updateRule: '@request.auth.id != ""',
  deleteRule: '@request.auth.id != ""',
  options: {},
};

export const USER_PROGRESS_SCHEMA = {
  name: 'user_progress',
  type: 'base',
  system: false,
  schema: [
    { name: 'userId', type: 'relation', required: true, options: { collectionId: 'users', cascadeDelete: true, minSelect: 1, maxSelect: 1, displayFields: ['email'] } },
    { name: 'majorId', type: 'relation', required: true, options: { collectionId: 'majors', cascadeDelete: false, minSelect: 1, maxSelect: 1, displayFields: ['name'] } },
    { name: 'courseId', type: 'relation', required: true, options: { collectionId: 'courses', cascadeDelete: false, minSelect: 1, maxSelect: 1, displayFields: ['code', 'nameEn'] } },
    { name: 'status', type: 'select', required: true, default: 'pending', options: { maxSelect: 1, values: ['pending', 'registered', 'passed', 'failed'] } },
    { name: 'semester', type: 'text', required: false, options: { max: 20 } },
    { name: 'grade', type: 'number', required: false, options: { min: 0, max: 100 } },
    { name: 'letterGrade', type: 'text', required: false, options: { max: 2 } },
    { name: 'creditsEarned', type: 'number', required: true, default: 0, options: { min: 0, max: 10 } },
    { name: 'notes', type: 'text', required: false, options: { max: 1000 } },
  ],
  indexes: [
    'CREATE UNIQUE INDEX idx_user_progress_unique ON user_progress (userId, majorId, courseId)',
    'CREATE INDEX idx_user_progress_userId ON user_progress (userId)',
    'CREATE INDEX idx_user_progress_majorId ON user_progress (majorId)',
    'CREATE INDEX idx_user_progress_status ON user_progress (status)',
  ],
  listRule: 'userId = @request.auth.id',
  viewRule: 'userId = @request.auth.id',
  createRule: 'userId = @request.auth.id',
  updateRule: 'userId = @request.auth.id',
  deleteRule: 'userId = @request.auth.id',
  options: {},
};

export const SEMESTER_PLANS_SCHEMA = {
  name: 'semester_plans',
  type: 'base',
  system: false,
  schema: [
    { name: 'userId', type: 'relation', required: true, options: { collectionId: 'users', cascadeDelete: true, minSelect: 1, maxSelect: 1, displayFields: ['email'] } },
    { name: 'majorId', type: 'relation', required: true, options: { collectionId: 'majors', cascadeDelete: false, minSelect: 1, maxSelect: 1, displayFields: ['name'] } },
    { name: 'semester', type: 'text', required: true, options: { min: 1, max: 20 } },
    { name: 'targetCredits', type: 'number', required: true, default: 9, options: { min: 3, max: 20 } },
    { name: 'courseIds', type: 'json', required: true, default: '[]' },
    { name: 'status', type: 'select', required: true, default: 'planning', options: { maxSelect: 1, values: ['planning', 'confirmed', 'completed'] } },
  ],
  indexes: [
    'CREATE UNIQUE INDEX idx_semester_plans_unique ON semester_plans (userId, majorId, semester)',
    'CREATE INDEX idx_semester_plans_userId ON semester_plans (userId)',
    'CREATE INDEX idx_semester_plans_semester ON semester_plans (semester)',
  ],
  listRule: 'userId = @request.auth.id',
  viewRule: 'userId = @request.auth.id',
  createRule: 'userId = @request.auth.id',
  updateRule: 'userId = @request.auth.id',
  deleteRule: 'userId = @request.auth.id',
  options: {},
};

export const SETTINGS_SCHEMA = {
  name: 'settings',
  type: 'base',
  system: false,
  schema: [
    { name: 'userId', type: 'relation', required: true, unique: true, options: { collectionId: 'users', cascadeDelete: true, minSelect: 1, maxSelect: 1, displayFields: ['email'] } },
    { name: 'majorId', type: 'relation', required: true, options: { collectionId: 'majors', cascadeDelete: false, minSelect: 1, maxSelect: 1, displayFields: ['name'] } },
    { name: 'thesisTrackId', type: 'text', required: true, options: { min: 1, max: 10 } },
    { name: 'maxCreditsPerSemester', type: 'number', required: true, default: 9, options: { min: 3, max: 20 } },
    { name: 'preferredSemesters', type: 'json', required: true, default: '["fall", "spring"]' },
    { name: 'notificationsEnabled', type: 'bool', required: true, default: true },
    { name: 'theme', type: 'text', required: true, default: 'space', options: { max: 20 } },
  ],
  indexes: [
    'CREATE UNIQUE INDEX idx_settings_userId ON settings (userId)',
  ],
  listRule: 'userId = @request.auth.id',
  viewRule: 'userId = @request.auth.id',
  createRule: 'userId = @request.auth.id',
  updateRule: 'userId = @request.auth.id',
  deleteRule: 'userId = @request.auth.id',
  options: {},
};

// ============================================================
// USERS COLLECTION EXTENSION
// ============================================================

export const USERS_EXTENSION = {
  // Add these fields to the built-in users collection via PocketBase Admin UI
  // Settings > Users > Edit Collection > Add Fields
  fields: [
    { name: 'majorId', type: 'relation', required: false, options: { collectionId: 'majors', cascadeDelete: false, minSelect: 1, maxSelect: 1, displayFields: ['name'] } },
    { name: 'thesisTrackId', type: 'text', required: false, options: { max: 10 } },
    { name: 'displayName', type: 'text', required: false, options: { max: 100 } },
  ],
};

// ============================================================
// MIGRATION FILES (for PocketBase migration system)
// ============================================================

/*
// pb_migrations/1700000000_create_majors.js
migrate((db) => {
  const collection = new Collection({
    name: 'majors',
    type: 'base',
    system: false,
    schema: [
      { name: 'id', type: 'text', required: true, unique: true, options: { min: 1, max: 50, pattern: '^[a-z0-9-]+$' } },
      { name: 'name', type: 'text', required: true, options: { min: 1, max: 100 } },
      { name: 'nameAr', type: 'text', required: true, options: { min: 1, max: 100 } },
      { name: 'collegeId', type: 'text', required: true, options: { min: 1, max: 20 } },
      { name: 'departmentId', type: 'text', required: false, options: { max: 20 } },
      { name: 'courseIdPrefix', type: 'text', required: true, options: { min: 1, max: 20 } },
      { name: 'thesisPatterns', type: 'json', required: true },
      { name: 'creditsPerCourse', type: 'number', required: true, options: { min: 1, max: 10 } },
      { name: 'maxCoursesPerSemester', type: 'number', required: true, options: { min: 1, max: 10 } },
      { name: 'minCoursesPerSemester', type: 'number', required: true, options: { min: 1, max: 10 } },
      { name: 'typicalCoursesOffered', type: 'number', required: true, options: { min: 1, max: 20 } },
      { name: 'totalCreditsRequired', type: 'number', required: true, options: { min: 1, max: 200 } },
      { name: 'thesisCreditsRequired', type: 'number', required: true, options: { min: 1, max: 50 } },
      { name: 'courseCreditsRequired', type: 'number', required: true, options: { min: 1, max: 200 } },
    ],
    indexes: ['CREATE UNIQUE INDEX idx_majors_id ON majors (id)'],
    listRule: '',
    viewRule: '',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != ""',
    deleteRule: '@request.auth.id != ""',
  });
  return db.saveCollection(collection);
}, (db) => {
  return db.deleteCollection('majors');
});
*/

/*
// pb_migrations/1700000001_create_courses.js
migrate((db) => {
  const collection = new Collection({
    name: 'courses',
    type: 'base',
    system: false,
    schema: [
      { name: 'majorId', type: 'relation', required: true, options: { collectionId: 'majors', cascadeDelete: false, minSelect: 1, maxSelect: 1, displayFields: ['name'] } },
      { name: 'courseId', type: 'text', required: true, unique: true, options: { min: 1, max: 50 } },
      { name: 'code', type: 'text', required: true, options: { min: 1, max: 20 } },
      { name: 'nameAr', type: 'text', required: true, options: { min: 1, max: 200 } },
      { name: 'nameEn', type: 'text', required: true, options: { min: 1, max: 200 } },
      { name: 'credits', type: 'number', required: true, options: { min: 1, max: 10 } },
      { name: 'type', type: 'select', required: true, options: { maxSelect: 1, values: ['core', 'elective', 'thesis'] } },
      { name: 'semesterOffered', type: 'json', required: true },
      { name: 'isThesis', type: 'bool', required: true, default: false },
      { name: 'thesisPatternId', type: 'text', required: false, options: { max: 10 } },
      { name: 'description', type: 'editor', required: false },
    ],
    indexes: [
      'CREATE UNIQUE INDEX idx_courses_courseId ON courses (courseId)',
      'CREATE INDEX idx_courses_majorId ON courses (majorId)',
      'CREATE INDEX idx_courses_type ON courses (type)',
    ],
    listRule: '',
    viewRule: '',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != ""',
    deleteRule: '@request.auth.id != ""',
  });
  return db.saveCollection(collection);
}, (db) => {
  return db.deleteCollection('courses');
});
*/

/*
// pb_migrations/1700000002_create_user_progress.js
migrate((db) => {
  const collection = new Collection({
    name: 'user_progress',
    type: 'base',
    system: false,
    schema: [
      { name: 'userId', type: 'relation', required: true, options: { collectionId: 'users', cascadeDelete: true, minSelect: 1, maxSelect: 1, displayFields: ['email'] } },
      { name: 'majorId', type: 'relation', required: true, options: { collectionId: 'majors', cascadeDelete: false, minSelect: 1, maxSelect: 1, displayFields: ['name'] } },
      { name: 'courseId', type: 'relation', required: true, options: { collectionId: 'courses', cascadeDelete: false, minSelect: 1, maxSelect: 1, displayFields: ['code', 'nameEn'] } },
      { name: 'status', type: 'select', required: true, default: 'pending', options: { maxSelect: 1, values: ['pending', 'registered', 'passed', 'failed'] } },
      { name: 'semester', type: 'text', required: false, options: { max: 20 } },
      { name: 'grade', type: 'number', required: false, options: { min: 0, max: 100 } },
      { name: 'letterGrade', type: 'text', required: false, options: { max: 2 } },
      { name: 'creditsEarned', type: 'number', required: true, default: 0, options: { min: 0, max: 10 } },
      { name: 'notes', type: 'text', required: false, options: { max: 1000 } },
    ],
    indexes: [
      'CREATE UNIQUE INDEX idx_user_progress_unique ON user_progress (userId, majorId, courseId)',
      'CREATE INDEX idx_user_progress_userId ON user_progress (userId)',
      'CREATE INDEX idx_user_progress_majorId ON user_progress (majorId)',
      'CREATE INDEX idx_user_progress_status ON user_progress (status)',
    ],
    listRule: 'userId = @request.auth.id',
    viewRule: 'userId = @request.auth.id',
    createRule: 'userId = @request.auth.id',
    updateRule: 'userId = @request.auth.id',
    deleteRule: 'userId = @request.auth.id',
  });
  return db.saveCollection(collection);
}, (db) => {
  return db.deleteCollection('user_progress');
});
*/

/*
// pb_migrations/1700000003_create_semester_plans.js
migrate((db) => {
  const collection = new Collection({
    name: 'semester_plans',
    type: 'base',
    system: false,
    schema: [
      { name: 'userId', type: 'relation', required: true, options: { collectionId: 'users', cascadeDelete: true, minSelect: 1, maxSelect: 1, displayFields: ['email'] } },
      { name: 'majorId', type: 'relation', required: true, options: { collectionId: 'majors', cascadeDelete: false, minSelect: 1, maxSelect: 1, displayFields: ['name'] } },
      { name: 'semester', type: 'text', required: true, options: { min: 1, max: 20 } },
      { name: 'targetCredits', type: 'number', required: true, default: 9, options: { min: 3, max: 20 } },
      { name: 'courseIds', type: 'json', required: true, default: '[]' },
      { name: 'status', type: 'select', required: true, default: 'planning', options: { maxSelect: 1, values: ['planning', 'confirmed', 'completed'] } },
    ],
    indexes: [
      'CREATE UNIQUE INDEX idx_semester_plans_unique ON semester_plans (userId, majorId, semester)',
      'CREATE INDEX idx_semester_plans_userId ON semester_plans (userId)',
      'CREATE INDEX idx_semester_plans_semester ON semester_plans (semester)',
    ],
    listRule: 'userId = @request.auth.id',
    viewRule: 'userId = @request.auth.id',
    createRule: 'userId = @request.auth.id',
    updateRule: 'userId = @request.auth.id',
    deleteRule: 'userId = @request.auth.id',
  });
  return db.saveCollection(collection);
}, (db) => {
  return db.deleteCollection('semester_plans');
});
*/

/*
// pb_migrations/1700000004_create_settings.js
migrate((db) => {
  const collection = new Collection({
    name: 'settings',
    type: 'base',
    system: false,
    schema: [
      { name: 'userId', type: 'relation', required: true, unique: true, options: { collectionId: 'users', cascadeDelete: true, minSelect: 1, maxSelect: 1, displayFields: ['email'] } },
      { name: 'majorId', type: 'relation', required: true, options: { collectionId: 'majors', cascadeDelete: false, minSelect: 1, maxSelect: 1, displayFields: ['name'] } },
      { name: 'thesisTrackId', type: 'text', required: true, options: { min: 1, max: 10 } },
      { name: 'maxCreditsPerSemester', type: 'number', required: true, default: 9, options: { min: 3, max: 20 } },
      { name: 'preferredSemesters', type: 'json', required: true, default: '["fall", "spring"]' },
      { name: 'notificationsEnabled', type: 'bool', required: true, default: true },
      { name: 'theme', type: 'text', required: true, default: 'space', options: { max: 20 } },
    ],
    indexes: ['CREATE UNIQUE INDEX idx_settings_userId ON settings (userId)'],
    listRule: 'userId = @request.auth.id',
    viewRule: 'userId = @request.auth.id',
    createRule: 'userId = @request.auth.id',
    updateRule: 'userId = @request.auth.id',
    deleteRule: 'userId = @request.auth.id',
  });
  return db.saveCollection(collection);
}, (db) => {
  return db.deleteCollection('settings');
});
*/

// ============================================================
// SEED DATA FOR MAJORS
// ============================================================

export const MAJORS_SEED_DATA = [
  {
    id: 'swe',
    name: 'Software Engineering',
    nameAr: 'هندسة البرمجيات',
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
  {
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
  {
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
];

// ============================================================
// SETUP INSTRUCTIONS
// ============================================================

/*
POCKETBASE SETUP INSTRUCTIONS:

1. Start PocketBase locally:
   ./pocketbase serve --http=0.0.0.0:8090

2. Open Admin UI: http://127.0.0.1:8090/_/

3. Create collections in this order:
   a) majors (use MAJORS_SCHEMA)
   b) courses (use COURSES_SCHEMA)
   c) user_progress (use USER_PROGRESS_SCHEMA)
   d) semester_plans (use SEMESTER_PLANS_SCHEMA)
   e) settings (use SETTINGS_SCHEMA)

4. Extend built-in 'users' collection:
   - Add 'majorId' (relation to majors)
   - Add 'thesisTrackId' (text)
   - Add 'displayName' (text)

5. Insert seed data for majors:
   - Go to majors collection > New record
   - Add the 3 records from MAJORS_SEED_DATA

6. Configure auth:
   - Settings > Authentication > Email/Password > Enable
   - Settings > Authentication > Email verification > Optional (for dev)

7. Test API:
   - GET /api/collections/majors/records
   - POST /api/collections/users/auth-with-password
*/
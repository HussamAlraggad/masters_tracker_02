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
  return db.save(collection);
}, (db) => {
  return db.deleteCollection('majors');
});
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
    indexes: [],
    listRule: '',
    viewRule: '',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != ""',
    deleteRule: '@request.auth.id != ""',
  });
  return db.save(collection);
}, (db) => {
  return db.deleteCollection('courses');
});
export const StudentLevel = {
  VOCATIONAL: 'vocational',
  HIGH_VOCATIONAL: 'high_vocational',
};

export const STUDENT_LEVELS = [
  { value: StudentLevel.VOCATIONAL, label: 'ปวช' },
  { value: StudentLevel.HIGH_VOCATIONAL, label: 'ปวส' },
];

export const STUDENT_LEVEL_LABELS = STUDENT_LEVELS.reduce((acc, { value, label }) => {
  acc[value] = label;
  return acc;
}, {});

export const STUDENT_LEVEL_VALUES = STUDENT_LEVELS.map(({ value }) => value);

export const DEFAULT_STUDENT_LEVEL = StudentLevel.VOCATIONAL;

export function getStudentLevelLabel(level) {
  return STUDENT_LEVEL_LABELS[level] || level || '-';
}

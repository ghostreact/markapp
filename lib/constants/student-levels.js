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

// Years and rooms configuration
export const MAX_ROOMS_PER_CLASS = 20;

export const LEVEL_MAX_YEARS = {
  [StudentLevel.VOCATIONAL]: 3, // ปวช.1 - ปวช.3
  [StudentLevel.HIGH_VOCATIONAL]: 2, // ปวส.1 - ปวส.2
};

export function getYearsForLevel(level) {
  const max = LEVEL_MAX_YEARS[level] || 0;
  return Array.from({ length: max }, (_, i) => i + 1);
}

export function getRooms(maxRooms = MAX_ROOMS_PER_CLASS) {
  return Array.from({ length: Math.max(0, maxRooms) }, (_, i) => i + 1);
}

export function formatYearLabel(level, year) {
  const levelLabel = getStudentLevelLabel(level);
  return `${levelLabel}.${year}`;
}

export function formatClassLabel(level, year, room) {
  const yearLabel = formatYearLabel(level, year);
  return `${yearLabel} ห้อง ${room}`;
}

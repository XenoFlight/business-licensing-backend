const STATUS_CODE_MAP = {
  application_submitted: 'הוגשה בקשה',
  pending_review: 'בטיפול',
  renewal_in_progress: 'בתהליך חידוש',
  approved: 'רישיון בתוקף',
  temporarily_permitted: 'היתר זמני',
  rejected: 'נדחה',
  closed: 'סגור',
};

export const BUSINESS_STATUS_OPTIONS = [
  'application_submitted',
  'pending_review',
  'renewal_in_progress',
  'approved',
  'temporarily_permitted',
  'rejected',
  'closed',
];

const HEBREW_TO_CODE = {
  in_process: 'pending_review',
  active: 'approved',
  expired: 'renewal_in_progress',
  revoked: 'rejected',

  'פעיל': 'approved',
  'רישיון': 'approved',
  'רישיון בתוקף': 'approved',
  'רישיון זמני': 'temporarily_permitted',
  'היתר זמני': 'temporarily_permitted',
  'בטיפול': 'pending_review',
  'בהמתנה': 'pending_review',
  'בתהליך חידוש': 'renewal_in_progress',
  'חידוש': 'renewal_in_progress',
  'נדחה': 'rejected',
  'סגור': 'closed',
  'לא הוגשה בקשה': 'application_submitted',
  'בקשה מקוונת': 'application_submitted',
  'לידיעה': 'pending_review',
  'לצמיתות': 'approved',
  'רישוין תקופתי': 'approved',
  'תיק פיקוח': 'pending_review',
};

export function normalizeStatus(status) {
  if (!status || typeof status !== 'string') {
    return null;
  }

  const trimmed = status.trim();

  if (STATUS_CODE_MAP[trimmed]) {
    return trimmed;
  }

  if (HEBREW_TO_CODE[trimmed]) {
    return HEBREW_TO_CODE[trimmed];
  }

  const partialMatch = Object.keys(HEBREW_TO_CODE).find((key) => trimmed.includes(key));
  return partialMatch ? HEBREW_TO_CODE[partialMatch] : null;
}

export function isActiveStatus(status) {
  const normalized = normalizeStatus(status);
  return normalized === 'approved' || normalized === 'temporarily_permitted';
}

export function isPendingStatus(status) {
  const normalized = normalizeStatus(status);
  return normalized === 'pending_review' || normalized === 'renewal_in_progress' || normalized === 'application_submitted';
}

export function getStatusLabel(statusCode) {
  const normalized = normalizeStatus(statusCode);
  if (!normalized) {
    return statusCode;
  }

  return STATUS_CODE_MAP[normalized] || statusCode;
}

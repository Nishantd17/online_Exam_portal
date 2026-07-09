export const ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

export const EXAM_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
};

export const QUESTION_TYPES = {
  MCQ_SINGLE: 'mcq_single',
  MCQ_MULTIPLE: 'mcq_multiple',
  TRUE_FALSE: 'true_false',
  FILL_BLANK: 'fill_blank',
  SUBJECTIVE: 'subjective',
  CODING: 'coding'
};

export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

export const VIOLATION_TYPES = {
  TAB_SWITCH: 'tab_switch',
  FULLSCREEN_EXIT: 'fullscreen_exit',
  COPY_ATTEMPT: 'copy_attempt',
  PASTE_ATTEMPT: 'paste_attempt',
  RIGHT_CLICK: 'right_click',
  REFRESH: 'refresh',
  MULTIPLE_FACES: 'multiple_faces',
  FACE_NOT_VISIBLE: 'face_not_visible',
  MOBILE_PHONE: 'mobile_phone'
};

export const NOTIFICATION_TYPES = {
  EXAM_SCHEDULED: 'exam_scheduled',
  EXAM_REMINDER: 'exam_reminder',
  RESULT_PUBLISHED: 'result_published',
  EXAM_SUBMITTED: 'exam_submitted',
  VIOLATION_ALERT: 'violation_alert',
  SYSTEM_ANNOUNCEMENT: 'system_announcement'
};

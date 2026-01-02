// Field definitions for Canvas LMS API - editable vs read-only fields
// Based on Canvas LMS API documentation

export interface FieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'select' | 'textarea';
  editable: boolean;
  description?: string;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    required?: boolean;
  };
}

export const FIELD_DEFINITIONS: Record<string, FieldDefinition[]> = {
  assignments: [
    { name: 'id', label: 'ID', type: 'number', editable: false },
    { name: 'name', label: 'Name', type: 'text', editable: true, validation: { required: true } },
    { name: 'description', label: 'Description', type: 'textarea', editable: true },
    { name: 'due_at', label: 'Due Date', type: 'datetime', editable: true },
    { name: 'lock_at', label: 'Lock Date', type: 'datetime', editable: true },
    { name: 'unlock_at', label: 'Unlock Date', type: 'datetime', editable: true },
    { name: 'points_possible', label: 'Points', type: 'number', editable: true, validation: { min: 0 } },
    { name: 'published', label: 'Published', type: 'boolean', editable: true },
    { name: 'submission_types', label: 'Submission Types', type: 'select', editable: true, 
      options: [
        { value: 'online_upload', label: 'Online Upload' },
        { value: 'online_text_entry', label: 'Online Text Entry' },
        { value: 'online_url', label: 'Online URL' },
        { value: 'on_paper', label: 'On Paper' },
        { value: 'external_tool', label: 'External Tool' },
        { value: 'discussion_topic', label: 'Discussion Topic' },
        { value: 'media_recording', label: 'Media Recording' }
      ]
    },
    { name: 'created_at', label: 'Created At', type: 'datetime', editable: false },
    { name: 'updated_at', label: 'Updated At', type: 'datetime', editable: false },
  ],
  
  quizzes: [
    { name: 'id', label: 'ID', type: 'number', editable: false },
    { name: 'title', label: 'Title', type: 'text', editable: true, validation: { required: true } },
    { name: 'description', label: 'Description', type: 'textarea', editable: true },
    { name: 'quiz_type', label: 'Quiz Type', type: 'select', editable: true,
      options: [
        { value: 'practice_quiz', label: 'Practice Quiz' },
        { value: 'assignment', label: 'Graded Quiz' },
        { value: 'graded_survey', label: 'Graded Survey' },
        { value: 'survey', label: 'Ungraded Survey' }
      ]
    },
    { name: 'due_at', label: 'Due Date', type: 'datetime', editable: true },
    { name: 'lock_at', label: 'Lock Date', type: 'datetime', editable: true },
    { name: 'unlock_at', label: 'Unlock Date', type: 'datetime', editable: true },
    { name: 'time_limit', label: 'Time Limit (minutes)', type: 'number', editable: true, validation: { min: 0 } },
    { name: 'allowed_attempts', label: 'Allowed Attempts', type: 'number', editable: true, validation: { min: -1 } },
    { name: 'published', label: 'Published', type: 'boolean', editable: true },
    { name: 'shuffle_answers', label: 'Shuffle Answers', type: 'boolean', editable: true },
    { name: 'show_correct_answers', label: 'Show Correct Answers', type: 'boolean', editable: true },
    { name: 'question_count', label: 'Question Count', type: 'number', editable: false },
    { name: 'created_at', label: 'Created At', type: 'datetime', editable: false },
  ],
  
  discussions: [
    { name: 'id', label: 'ID', type: 'number', editable: false },
    { name: 'title', label: 'Title', type: 'text', editable: true, validation: { required: true } },
    { name: 'message', label: 'Message', type: 'textarea', editable: true },
    { name: 'discussion_type', label: 'Discussion Type', type: 'select', editable: true,
      options: [
        { value: 'side_comment', label: 'Side Comment' },
        { value: 'threaded', label: 'Threaded' }
      ]
    },
    { name: 'published', label: 'Published', type: 'boolean', editable: true },
    { name: 'pinned', label: 'Pinned', type: 'boolean', editable: true },
    { name: 'posted_at', label: 'Posted At', type: 'datetime', editable: true },
    { name: 'delayed_post_at', label: 'Delayed Post At', type: 'datetime', editable: true },
    { name: 'lock_at', label: 'Lock Date', type: 'datetime', editable: true },
    { name: 'require_initial_post', label: 'Require Initial Post', type: 'boolean', editable: true },
    { name: 'created_at', label: 'Created At', type: 'datetime', editable: false },
  ],
  
  pages: [
    { name: 'page_id', label: 'Page ID', type: 'text', editable: false },
    { name: 'title', label: 'Title', type: 'text', editable: true, validation: { required: true } },
    { name: 'body', label: 'Body', type: 'textarea', editable: true },
    { name: 'published', label: 'Published', type: 'boolean', editable: true },
    { name: 'front_page', label: 'Front Page', type: 'boolean', editable: true },
    { name: 'url', label: 'URL', type: 'text', editable: false },
    { name: 'updated_at', label: 'Updated At', type: 'datetime', editable: false },
  ],
  
  announcements: [
    { name: 'id', label: 'ID', type: 'number', editable: false },
    { name: 'title', label: 'Title', type: 'text', editable: true, validation: { required: true } },
    { name: 'message', label: 'Message', type: 'textarea', editable: true },
    { name: 'posted_at', label: 'Posted At', type: 'datetime', editable: true },
    { name: 'delayed_post_at', label: 'Delayed Post At', type: 'datetime', editable: true },
  ],
  
  modules: [
    { name: 'id', label: 'ID', type: 'number', editable: false },
    { name: 'name', label: 'Name', type: 'text', editable: true, validation: { required: true } },
    { name: 'position', label: 'Position', type: 'number', editable: true, validation: { min: 1 } },
    { name: 'published', label: 'Published', type: 'boolean', editable: true },
    { name: 'unlock_at', label: 'Unlock Date', type: 'datetime', editable: true },
    { name: 'require_sequential_progress', label: 'Require Sequential Progress', type: 'boolean', editable: true },
    { name: 'prerequisite_module_ids', label: 'Prerequisites', type: 'text', editable: true },
    { name: 'items_count', label: 'Items Count', type: 'number', editable: false },
  ],
  
  students: [
    { name: 'id', label: 'ID', type: 'number', editable: false },
    { name: 'name', label: 'Name', type: 'text', editable: false },
    { name: 'email', label: 'Email', type: 'text', editable: false },
    { name: 'sis_user_id', label: 'SIS User ID', type: 'text', editable: false },
    { name: 'enrollment_state', label: 'Enrollment State', type: 'text', editable: false },
  ],
};









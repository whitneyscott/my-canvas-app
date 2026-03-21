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
    { name: 'grading_type', label: 'Grading Type', type: 'select', editable: true,
      options: [
        { value: 'points', label: 'Points' },
        { value: 'percentage', label: 'Percentage' },
        { value: 'pass_fail', label: 'Pass/Fail' },
        { value: 'letter_grade', label: 'Letter Grade' },
        { value: 'gpa_scale', label: 'GPA Scale' },
        { value: 'not_graded', label: 'Not Graded' }
      ]
    },
    { name: 'points_possible', label: 'Points', type: 'number', editable: true, validation: { min: 0 } },
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
    { name: 'assignment_group_id', label: 'Assignment Group', type: 'select', editable: true },
    { name: 'allowed_attempts', label: 'Allowed Attempts', type: 'number', editable: true, validation: { min: -1 }, description: '-1 = Unlimited attempts' },
    { name: 'anonymous_grading', label: 'Anonymous Grading', type: 'boolean', editable: true },
    { name: 'graded_submissions_exist', label: 'Graded Submissions Exist', type: 'boolean', editable: false },
    { name: 'grading_standard_id', label: 'Grading Standard ID', type: 'number', editable: true },
    { name: 'omit_from_final_grade', label: 'Omit From Final Grade', type: 'boolean', editable: true },
    { name: 'peer_reviews', label: 'Peer Reviews', type: 'boolean', editable: true },
    { name: 'automatic_peer_reviews', label: 'Automatic Peer Reviews', type: 'boolean', editable: true },
    { name: 'notify_of_update', label: 'Notify Of Update', type: 'boolean', editable: true },
    { name: 'published', label: 'Published', type: 'boolean', editable: true },
    { name: 'only_visible_to_overrides', label: 'Only Visible to Overrides', type: 'boolean', editable: true },
    // All date fields grouped together
    { name: 'unlock_at', label: 'Unlock Date', type: 'datetime', editable: true },
    { name: 'due_at', label: 'Due Date', type: 'datetime', editable: true },
    { name: 'lock_at', label: 'Lock Date', type: 'datetime', editable: true },
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
    { name: 'assignment_group_id', label: 'Assignment Group', type: 'select', editable: true },
    { name: 'points_possible', label: 'Points (from questions)', type: 'number', editable: false, validation: { min: 0 } },
    { name: 'question_count', label: 'Question Count', type: 'number', editable: false },
    { name: 'time_limit', label: 'Time Limit (minutes)', type: 'number', editable: true, validation: { min: 0 } },
    { name: 'shuffle_answers', label: 'Shuffle Answers', type: 'boolean', editable: true },
    { name: 'hide_results', label: 'Hide Results', type: 'select', editable: true,
      options: [
        { value: 'always', label: 'Always' },
        { value: 'until_after_last_attempt', label: 'Until After Last Attempt' },
        { value: 'never', label: 'Never' }
      ]
    },
    { name: 'show_correct_answers', label: 'Show Correct Answers', type: 'boolean', editable: true },
    { name: 'show_correct_answers_last_attempt', label: 'Show Correct Answers Last Attempt', type: 'boolean', editable: true },
    { name: 'one_question_at_a_time', label: 'One Question at a Time', type: 'boolean', editable: true },
    { name: 'cant_go_back', label: "Can't Go Back", type: 'boolean', editable: true },
    { name: 'allowed_attempts', label: 'Allowed Attempts', type: 'number', editable: true, validation: { min: -1 } },
    { name: 'scoring_policy', label: 'Scoring Policy', type: 'select', editable: true,
      options: [
        { value: 'keep_highest', label: 'Keep Highest' },
        { value: 'keep_latest', label: 'Keep Latest' },
        { value: 'keep_average', label: 'Keep Average' }
      ]
    },
    { name: 'access_code', label: 'Access Code', type: 'text', editable: true },
    { name: 'ip_filter', label: 'IP Filter', type: 'text', editable: true },
    { name: 'published', label: 'Published', type: 'boolean', editable: true },
    { name: 'only_visible_to_overrides', label: 'Only Visible to Overrides', type: 'boolean', editable: true },
    // All date fields grouped together
    { name: 'unlock_at', label: 'Unlock Date', type: 'datetime', editable: true },
    { name: 'due_at', label: 'Due Date', type: 'datetime', editable: true },
    { name: 'lock_at', label: 'Lock Date', type: 'datetime', editable: true },
    { name: 'show_correct_answers_at', label: 'Show Correct Answers At', type: 'datetime', editable: true },
    { name: 'hide_correct_answers_at', label: 'Hide Correct Answers At', type: 'datetime', editable: true },
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
    { name: 'locked', label: 'Locked', type: 'boolean', editable: true },
    { name: 'podcast_enabled', label: 'Podcast Enabled', type: 'boolean', editable: true },
    { name: 'podcast_has_student_posts', label: 'Podcast Has Student Posts', type: 'boolean', editable: true },
    { name: 'require_initial_post', label: 'Require Initial Post', type: 'boolean', editable: true },
    { name: 'is_announcement', label: 'Is Announcement', type: 'boolean', editable: true },
    { name: 'allow_rating', label: 'Allow Rating', type: 'boolean', editable: true },
    { name: 'sort_by_rating', label: 'Sort By Rating', type: 'boolean', editable: true },
    { name: 'only_graders_can_rate', label: 'Only Graders Can Rate', type: 'boolean', editable: true },
    // Assignment fields for graded discussions
    { name: 'name', label: 'Assignment Name', type: 'text', editable: true },
    { name: 'grading_type', label: 'Grading Type', type: 'select', editable: true,
      options: [
        { value: 'points', label: 'Points' },
        { value: 'percentage', label: 'Percentage' },
        { value: 'pass_fail', label: 'Pass/Fail' },
        { value: 'letter_grade', label: 'Letter Grade' },
        { value: 'gpa_scale', label: 'GPA Scale' },
        { value: 'not_graded', label: 'Not Graded' }
      ]
    },
    { name: 'points_possible', label: 'Points', type: 'number', editable: true, validation: { min: 0 } },
    { name: 'assignment_group_id', label: 'Assignment Group', type: 'select', editable: true },
    { name: 'allowed_attempts', label: 'Allowed Attempts', type: 'number', editable: true, validation: { min: -1 }, description: '-1 = Unlimited attempts' },
    { name: 'omit_from_final_grade', label: 'Omit From Final Grade', type: 'boolean', editable: true },
    { name: 'only_visible_to_overrides', label: 'Only Visible to Overrides', type: 'boolean', editable: true },
    { name: 'anonymous_state', label: 'Anonymous State', type: 'select', editable: true,
      options: [
        { value: 'off', label: 'Off' },
        { value: 'full_anonymity', label: 'Full Anonymity' },
        { value: 'partial_anonymity', label: 'Partial Anonymity' }
      ]
    },
    // All date fields grouped together
    { name: 'delayed_post_at', label: 'Delayed Post At', type: 'datetime', editable: true },
    { name: 'lock_at', label: 'Lock Date', type: 'datetime', editable: true },
    { name: 'unlock_at', label: 'Unlock Date', type: 'datetime', editable: true },
    { name: 'due_at', label: 'Due Date', type: 'datetime', editable: true },
  ],
  
  pages: [
    { name: 'page_id', label: 'Page ID', type: 'text', editable: false },
    { name: 'title', label: 'Title', type: 'text', editable: true, validation: { required: true } },
    { name: 'body', label: 'Body', type: 'textarea', editable: true },
    { name: 'published', label: 'Published', type: 'boolean', editable: true },
    { name: 'front_page', label: 'Front Page', type: 'boolean', editable: true },
    { name: 'editing_roles', label: 'Editing Roles', type: 'text', editable: true },
    { name: 'notify_of_update', label: 'Notify Of Update', type: 'boolean', editable: true },
    { name: 'locked_for_user', label: 'Locked For User', type: 'boolean', editable: false },
    { name: 'url', label: 'URL', type: 'text', editable: false },
  ],
  
  announcements: [
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
    { name: 'locked', label: 'Locked', type: 'boolean', editable: true },
    { name: 'podcast_enabled', label: 'Podcast Enabled', type: 'boolean', editable: true },
    { name: 'podcast_has_student_posts', label: 'Podcast Has Student Posts', type: 'boolean', editable: true },
    { name: 'require_initial_post', label: 'Require Initial Post', type: 'boolean', editable: true },
    { name: 'allow_rating', label: 'Allow Rating', type: 'boolean', editable: true },
    { name: 'sort_by_rating', label: 'Sort By Rating', type: 'boolean', editable: true },
    { name: 'only_graders_can_rate', label: 'Only Graders Can Rate', type: 'boolean', editable: true },
    // All date fields grouped together
    { name: 'delayed_post_at', label: 'Delayed Post At', type: 'datetime', editable: true },
    { name: 'lock_at', label: 'Lock Date', type: 'datetime', editable: true },
  ],
  
  modules: [
    { name: 'id', label: 'ID', type: 'number', editable: false },
    { name: 'name', label: 'Name', type: 'text', editable: true, validation: { required: true } },
    { name: 'position', label: 'Position', type: 'number', editable: true, validation: { min: 1 } },
    { name: 'published', label: 'Published', type: 'boolean', editable: true },
    { name: 'require_sequential_progress', label: 'Require Sequential Progress', type: 'boolean', editable: true },
    { name: 'prerequisite_module_ids', label: 'Prerequisites', type: 'select', editable: true },
    { name: 'items_count', label: 'Items Count', type: 'number', editable: false },
    // All date fields grouped together
    { name: 'unlock_at', label: 'Unlock Date', type: 'datetime', editable: true },
  ],
  
  students: [
    { name: 'id', label: 'ID', type: 'number', editable: false },
    { name: 'last_name', label: 'Last Name', type: 'text', editable: false },
    { name: 'first_name', label: 'First Name', type: 'text', editable: false },
    { name: 'email', label: 'Email', type: 'text', editable: false },
    { name: 'sis_user_id', label: 'SIS User ID', type: 'text', editable: false },
    { name: 'enrollment_state', label: 'Enrollment State', type: 'text', editable: false },
  ],
};














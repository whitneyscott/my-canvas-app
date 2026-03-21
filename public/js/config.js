const DISCUSSION_LIKE_FIELDS = [
  { key: 'title', label: 'Title', editable: true, type: 'text' },
  { key: 'message', label: 'Message', editable: true, type: 'html' },
  { key: 'allow_rating', label: 'Allow Rating', editable: true, type: 'boolean', activeLabel: 'Yes', inactiveLabel: 'No' },
  { key: 'delayed_post_at', label: 'Delayed Post', editable: true, type: 'date' },
  { key: 'lock_at', label: 'Lock Date', editable: true, type: 'date' },
  { key: 'unlock_at', label: 'Unlock Date', editable: true, type: 'date' },
  { key: 'due_at', label: 'Due Date', editable: true, type: 'date' },
  { key: 'published', label: 'Published', editable: false, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
];

const DISCUSSION_FIELDS = [
  ...DISCUSSION_LIKE_FIELDS,
  { key: 'graded', label: 'Graded', editable: true, type: 'boolean', activeLabel: 'Graded', inactiveLabel: 'Ungraded' },
  { key: 'points_possible', label: 'Points Possible', editable: true, type: 'discussion_points' },
  { key: 'discussion_type', label: 'Discussion Type', editable: true, type: 'select', options: [
    { value: 'threaded', label: 'Threaded' },
    { value: 'side_comment', label: 'Side Comment' },
    { value: 'not_threaded', label: 'Not Threaded' }
  ] },
  { key: 'require_initial_post', label: 'Require Initial Post', editable: true, type: 'boolean', activeLabel: 'Required', inactiveLabel: 'Not Required' },
  { key: 'anonymous_state', label: 'Anonymous Mode', editable: true, type: 'select', options: [
    { value: 'off', label: 'Off' },
    { value: 'partial_anonymity', label: 'Partial' },
    { value: 'full_anonymity', label: 'Full' }
  ] },
  { key: 'is_anonymous_author', label: 'Anonymous Author', editable: true, type: 'boolean', activeLabel: 'Yes', inactiveLabel: 'No' },
  { key: 'sort_order', label: 'Sort Order', editable: true, type: 'select', options: [
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' }
  ] },
  { key: 'sort_order_locked', label: 'Sort Locked', editable: true, type: 'boolean', activeLabel: 'Locked', inactiveLabel: 'User Selectable' },
  { key: 'expanded', label: 'Expand Threads', editable: true, type: 'boolean', activeLabel: 'Expanded', inactiveLabel: 'Collapsed' },
  { key: 'expanded_locked', label: 'Expand Locked', editable: true, type: 'boolean', activeLabel: 'Locked', inactiveLabel: 'User Selectable' },
  { key: 'only_graders_can_rate', label: 'Only Graders Can Rate', editable: true, type: 'boolean', activeLabel: 'Yes', inactiveLabel: 'No' },
  { key: 'pinned', label: 'Pinned', editable: true, type: 'boolean', activeLabel: 'Pinned', inactiveLabel: 'Not Pinned' },
  { key: 'lock_comment', label: 'Lock Comments', editable: true, type: 'boolean', activeLabel: 'Locked', inactiveLabel: 'Open' },
  { key: 'podcast_enabled', label: 'Podcast Enabled', editable: true, type: 'boolean', activeLabel: 'Yes', inactiveLabel: 'No' },
  { key: 'podcast_has_student_posts', label: 'Podcast Includes Student Posts', editable: true, type: 'boolean', activeLabel: 'Yes', inactiveLabel: 'No' },
  { key: 'rubric_id', label: 'Rubric', editable: true, type: 'rubric_dropdown' }
];

const ANNOUNCEMENT_FIELDS = [
  { key: 'title', label: 'Title', editable: true, type: 'text' },
  { key: 'message', label: 'Message', editable: true, type: 'html' },
  { key: 'allow_rating', label: 'Allow Rating', editable: true, type: 'boolean', activeLabel: 'Yes', inactiveLabel: 'No' },
  { key: 'unlock_at', label: 'Available From', editable: true, type: 'date' },
  { key: 'lock_at', label: 'Available Until', editable: true, type: 'date' },
  { key: 'podcast_enabled', label: 'Podcast Enabled', editable: true, type: 'boolean', activeLabel: 'Yes', inactiveLabel: 'No' },
  { key: 'published', label: 'Published', editable: false, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
];

const CANVAS_CONFIG = {
  FIELD_DEFINITIONS: {
    assignments: {
      displayName: 'Assignments',
      endpoint: 'assignments',
      fields: [
        { key: 'name', label: 'Name', editable: true, type: 'text' },
        { key: 'description', label: 'Description/Instructions', editable: true, type: 'html' },
        { key: 'assignment_group_id', label: 'Assignment Group', editable: true, type: 'assignment_group_dropdown' },
        { key: 'rubric_id', label: 'Rubric', editable: true, type: 'rubric_dropdown' },
        { key: 'points_possible', label: 'Points Possible', editable: true, type: 'number' },
        { key: 'due_at', label: 'Due Date', editable: true, type: 'date' },
        { key: 'unlock_at', label: 'Available From', editable: true, type: 'date' },
        { key: 'lock_at', label: 'Available Until', editable: true, type: 'date' },
        { key: 'published', label: 'Published', editable: false, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
      ]
    },
    discussion_topics: {
      displayName: 'Discussions',
      endpoint: 'discussions',
      fields: DISCUSSION_FIELDS
    },
    files: {
      displayName: 'Files',
      endpoint: 'files',
      fields: [
        { key: 'display_name', label: 'File Name', editable: true, type: 'text' },
        { key: 'locked', label: 'Locked', editable: false, type: 'boolean', activeLabel: 'Locked', inactiveLabel: 'Visible' }
      ]
    },
    folders: {
      displayName: 'Folders',
      endpoint: 'folders',
      fields: [
        { key: 'name', label: 'Folder Name', editable: true, type: 'text' },
        { key: 'parent_folder_id', label: 'Parent Folder ID', editable: true, type: 'number' },
        { key: 'lock_at', label: 'Lock Date', editable: true, type: 'date' },
        { key: 'unlock_at', label: 'Unlock Date', editable: true, type: 'date' },
        { key: 'locked', label: 'Locked', editable: false, type: 'boolean', activeLabel: 'Locked', inactiveLabel: 'Visible' }
      ]
    },
    modules: {
      displayName: 'Modules',
      endpoint: 'modules',
      fields: [
        { key: 'name', label: 'Module Name', editable: true, type: 'text' },
        { key: 'position', label: 'Position', editable: true, type: 'number' },
        { key: 'unlock_at', label: 'Unlock Date', editable: true, type: 'date' },
        { key: 'published', label: 'Published', editable: false, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
      ]
    },
    pages: {
      displayName: 'Pages',
      endpoint: 'pages',
      usesSlugIdentifier: true,
      fields: [
        { key: 'title', label: 'Page Title', editable: true, type: 'text' },
        { key: 'body', label: 'Content', editable: true, type: 'html' },
        { key: 'published', label: 'Published', editable: false, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
      ]
    },
    announcements: {
      displayName: 'Announcements',
      endpoint: 'announcements',
      fields: ANNOUNCEMENT_FIELDS
    },
    new_quizzes: {
      displayName: 'New Quizzes',
      endpoint: 'new_quizzes',
      fields: [
        { key: 'name', label: 'Name', editable: true, type: 'text' },
        { key: 'description', label: 'Instructions', editable: true, type: 'html' },
        { key: 'assignment_group_id', label: 'Assignment Group', editable: true, type: 'assignment_group_dropdown' },
        { key: 'rubric_id', label: 'Rubric', editable: true, type: 'rubric_dropdown' },
        { key: 'points_possible', label: 'Points Possible', editable: true, type: 'number' },
        { key: 'due_at', label: 'Due Date', editable: true, type: 'date' },
        { key: 'unlock_at', label: 'Available From', editable: true, type: 'date' },
        { key: 'lock_at', label: 'Available Until', editable: true, type: 'date' },
        { key: 'published', label: 'Published', editable: false, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
      ]
    },
    quizzes: {
      displayName: 'Quizzes',
      endpoint: 'quizzes',
      fields: [
        { key: 'title', label: 'Quiz Title', editable: true, type: 'text' },
        { key: 'quiz_type', label: 'Quiz Type', editable: true, type: 'select', options: [
          { value: 'practice_quiz', label: 'Practice quiz' },
          { value: 'assignment', label: 'Graded quiz' },
          { value: 'graded_survey', label: 'Graded survey' },
          { value: 'survey', label: 'Survey' }
        ] },
        { key: 'description', label: 'Description', editable: true, type: 'html' },
        { key: 'assignment_group_id', label: 'Assignment Group', editable: true, type: 'assignment_group_dropdown' },
        { key: 'rubric_id', label: 'Rubric', editable: true, type: 'rubric_dropdown' },
        { key: 'points_possible', label: 'Points (from questions)', editable: false, type: 'number' },
        { key: 'time_limit', label: 'Time Limit', editable: true, type: 'time_limit' },
        { key: 'allowed_attempts', label: 'Allowed Attempts', editable: true, type: 'number' },
        { key: 'due_at', label: 'Due Date', editable: true, type: 'date' },
        { key: 'unlock_at', label: 'Available From', editable: true, type: 'date' },
        { key: 'lock_at', label: 'Available Until', editable: true, type: 'date' },
        { key: 'show_correct_answers_at', label: 'Show Answers At', editable: true, type: 'date' },
        { key: 'hide_correct_answers_at', label: 'Hide Answers At', editable: true, type: 'date' },
        { key: 'published', label: 'Published', editable: false, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
      ]
    },
    students: {
      displayName: 'Students',
      endpoint: 'students',
      fields: [
        { key: 'sis_user_id', label: 'SIS User ID', editable: false, type: 'text' },
        { key: 'accommodations', label: 'Accommodations', editable: false, type: 'accommodations' }
      ]
    }
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.CANVAS_CONFIG = CANVAS_CONFIG;
  window.FIELD_DEFINITIONS = CANVAS_CONFIG.FIELD_DEFINITIONS;
}

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CANVAS_CONFIG;
}
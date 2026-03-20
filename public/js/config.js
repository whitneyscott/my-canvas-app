const CANVAS_CONFIG = {
  FIELD_DEFINITIONS: {
    assignments: {
      displayName: 'Assignments',
      endpoint: 'assignments',
      fields: [
        { key: 'name', label: 'Name', editable: true, type: 'text' },
        { key: 'description', label: 'Description', editable: true, type: 'html' },
        { key: 'assignment_group_id', label: 'Assignment Group', editable: true, type: 'assignment_group_dropdown' },
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
      fields: [
        { key: 'title', label: 'Title', editable: true, type: 'text' },
        { key: 'message', label: 'Message', editable: false, type: 'html' },
        { key: 'allow_rating', label: 'Allow Rating', editable: true, type: 'boolean', activeLabel: 'Yes', inactiveLabel: 'No' },
        { key: 'delayed_post_at', label: 'Delayed Post', editable: true, type: 'date' },
        { key: 'lock_at', label: 'Lock Date', editable: true, type: 'date' },
        { key: 'unlock_at', label: 'Unlock Date', editable: true, type: 'date' },
        { key: 'due_at', label: 'Due Date', editable: true, type: 'date' },
        { key: 'published', label: 'Published', editable: false, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
      ]
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
      fields: [
        { key: 'title', label: 'Page Title', editable: true, type: 'text' },
        { key: 'body', label: 'Content', editable: true, type: 'html' },
        { key: 'published', label: 'Published', editable: false, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
      ]
    },
    announcements: {
      displayName: 'Announcements',
      endpoint: 'announcements',
      fields: [
        { key: 'title', label: 'Title', editable: true, type: 'text' },
        { key: 'message', label: 'Message', editable: true, type: 'html' },
        { key: 'allow_rating', label: 'Allow Rating', editable: true, type: 'boolean', activeLabel: 'Yes', inactiveLabel: 'No' },
        { key: 'delayed_post_at', label: 'Delayed Post', editable: true, type: 'date' },
        { key: 'lock_at', label: 'Lock Date', editable: true, type: 'date' },
        { key: 'unlock_at', label: 'Unlock Date', editable: true, type: 'date' },
        { key: 'due_at', label: 'Due Date', editable: true, type: 'date' },
        { key: 'published', label: 'Published', editable: false, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
      ]
    },
    quizzes: {
      displayName: 'Quizzes',
      endpoint: 'quizzes',
      fields: [
        { key: 'title', label: 'Quiz Title', editable: true, type: 'text' },
        { key: 'description', label: 'Description', editable: false, type: 'html' },
        { key: 'assignment_group_id', label: 'Assignment Group', editable: true, type: 'assignment_group_dropdown' },
        { key: 'time_limit', label: 'Time Limit (min)', editable: true, type: 'number' },
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
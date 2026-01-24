const CANVAS_CONFIG = {
  FIELD_DEFINITIONS: {
    assignments: {
      displayName: 'Assignments',
      endpoint: 'assignments',
      fields: [
        { key: 'name', label: 'name', editable: true, type: 'text' },
        { key: 'description', label: 'description', editable: false, type: 'html' },
        { key: 'assignment_group_id', label: 'assignment_group_id', editable: true, type: 'assignment_group_dropdown' },
        { key: 'points_possible', label: 'points_possible', editable: true, type: 'number' },
        { key: 'due_at', label: 'due_at', editable: true, type: 'date' },
        { key: 'unlock_at', label: 'unlock_at', editable: true, type: 'date' },
        { key: 'lock_at', label: 'lock_at', editable: true, type: 'date' },
        { key: 'published', label: 'published', editable: false, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
      ]
    },
    discussion_topics: {
      displayName: 'Discussions',
      endpoint: 'discussion_topics',
      fields: [
        { key: 'title', label: 'title', editable: true, type: 'text' },
        { key: 'message', label: 'message', editable: false, type: 'html' },
        { key: 'allow_rating', label: 'allow_rating', editable: true, type: 'boolean', activeLabel: 'Yes', inactiveLabel: 'No' },
        { key: 'delayed_post_at', label: 'delayed_post_at', editable: true, type: 'date' },
        { key: 'lock_at', label: 'lock_at', editable: true, type: 'date' },
        { key: 'unlock_at', label: 'unlock_at', editable: true, type: 'date' },
        { key: 'due_at', label: 'due_at', editable: true, type: 'date' },
        { key: 'published', label: 'published', editable: false, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
      ]
    },
    files: {
      displayName: 'Files',
      endpoint: 'files',
      fields: [
        { key: 'display_name', label: 'display_name', editable: true, type: 'text' },
        { key: 'locked', label: 'locked', editable: false, type: 'boolean', activeLabel: 'Locked', inactiveLabel: 'Visible' }
      ]
    },
    folders: {
      displayName: 'Folders',
      endpoint: 'folders',
      fields: [
        { key: 'name', label: 'name', editable: true, type: 'text' },
        { key: 'parent_folder_id', label: 'parent_folder_id', editable: true, type: 'number' },
        { key: 'lock_at', label: 'lock_at', editable: true, type: 'date' },
        { key: 'unlock_at', label: 'unlock_at', editable: true, type: 'date' },
        { key: 'locked', label: 'locked', editable: false, type: 'boolean', activeLabel: 'Locked', inactiveLabel: 'Visible' }
      ]
    },
    modules: {
      displayName: 'Modules',
      endpoint: 'modules',
      fields: [
        { key: 'name', label: 'name', editable: true, type: 'text' },
        { key: 'position', label: 'position', editable: true, type: 'number' },
        { key: 'unlock_at', label: 'unlock_at', editable: true, type: 'date' },
        { key: 'published', label: 'published', editable: false, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
      ]
    },
    pages: {
      displayName: 'Pages',
      endpoint: 'pages',
      fields: [
        { key: 'title', label: 'title', editable: true, type: 'text' },
        { key: 'body', label: 'body', editable: false, type: 'html' },
        { key: 'published', label: 'published', editable: false, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
      ]
    },
    quizzes: {
      displayName: 'Quizzes',
      endpoint: 'quizzes',
      fields: [
        { key: 'title', label: 'title', editable: true, type: 'text' },
        { key: 'description', label: 'description', editable: false, type: 'html' },
        { key: 'assignment_group_id', label: 'assignment_group_id', editable: true, type: 'assignment_group_dropdown' },
        { key: 'time_limit', label: 'time_limit', editable: true, type: 'number' },
        { key: 'allowed_attempts', label: 'allowed_attempts', editable: true, type: 'number' },
        { key: 'due_at', label: 'due_at', editable: true, type: 'date' },
        { key: 'unlock_at', label: 'unlock_at', editable: true, type: 'date' },
        { key: 'lock_at', label: 'lock_at', editable: true, type: 'date' },
        { key: 'show_correct_answers_at', label: 'show_correct_answers_at', editable: true, type: 'date' },
        { key: 'hide_correct_answers_at', label: 'hide_correct_answers_at', editable: true, type: 'date' },
        { key: 'published', label: 'published', editable: false, type: 'boolean', activeLabel: 'Published', inactiveLabel: 'Unpublished' }
      ]
    },
    students: {
      displayName: 'Students',
      endpoint: 'students',
      fields: [
        { key: 'sis_user_id', label: 'sis_user_id', editable: false, type: 'text' },
        { key: 'accommodations', label: 'Accommodations', editable: false, type: 'accommodations' }
      ]
    }
  }
};

if (typeof window !== 'undefined') {
  window.CANVAS_CONFIG = CANVAS_CONFIG;
  window.FIELD_DEFINITIONS = CANVAS_CONFIG.FIELD_DEFINITIONS;
}
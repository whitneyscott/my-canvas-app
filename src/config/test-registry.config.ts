export const TEST_CONFIG = {
  assignments: {
    createPath: (courseId) => `/courses/${courseId}/assignments`,
    updatePath: (courseId, id) => `/courses/${courseId}/assignments/${id}`,
    deletePath: (courseId, id) => `/courses/${courseId}/assignments/${id}`,
    params: ['name', 'description', 'points_possible', 'due_at', 'unlock_at', 'lock_at']
  },
  quizzes: {
    createPath: (courseId) => `/courses/${courseId}/quizzes`,
    updatePath: (courseId, id) => `/courses/${courseId}/quizzes/${id}`,
    deletePath: (courseId, id) => `/courses/${courseId}/quizzes/${id}`,
    params: ['title', 'description', 'time_limit', 'allowed_attempts', 'due_at', 'unlock_at', 'lock_at', 'show_correct_answers_at', 'hide_correct_answers_at']
  },
  pages: {
    createPath: (courseId) => `/courses/${courseId}/pages`,
    updatePath: (courseId, url) => `/courses/${courseId}/pages/${url}`,
    deletePath: (courseId, url) => `/courses/${courseId}/pages/${encodeURIComponent(url)}`,
    params: ['title', 'body', 'publish_at', 'published']
  },
  discussions: {
    createPath: (courseId) => `/courses/${courseId}/discussion_topics`,
    updatePath: (courseId, id) => `/courses/${courseId}/discussion_topics/${id}`,
    deletePath: (courseId, id) => `/courses/${courseId}/discussion_topics/${id}`,
    params: ['title', 'message', 'discussion_type', 'allow_rating', 'delayed_post_at', 'lock_at', 'unlock_at', 'due_at', 'published']
  },
  announcements: {
    createPath: (courseId) => `/courses/${courseId}/discussion_topics`,
    updatePath: (courseId, id) => `/courses/${courseId}/discussion_topics/${id}`,
    deletePath: (courseId, id) => `/courses/${courseId}/discussion_topics/${id}`,
    params: ['title', 'message', 'allow_rating', 'delayed_post_at', 'lock_at', 'published']
  },
  modules: {
    createPath: (courseId) => `/courses/${courseId}/modules`,
    updatePath: (courseId, id) => `/courses/${courseId}/modules/${id}`,
    deletePath: (courseId, id) => `/courses/${courseId}/modules/${id}`,
    params: ['name', 'position', 'unlock_at', 'published']
  }
};


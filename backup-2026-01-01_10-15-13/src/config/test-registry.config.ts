export const TEST_CONFIG = {
  assignments: {
    createPath: (courseId) => `/courses/${courseId}/assignments`,
    updatePath: (courseId, id) => `/courses/${courseId}/assignments/${id}`,
    params: ['name', 'points_possible', 'due_at', 'description']
  },
  quizzes: {
    createPath: (courseId) => `/courses/${courseId}/quizzes`,
    updatePath: (courseId, id) => `/courses/${courseId}/quizzes/${id}`,
    params: ['title', 'description', 'time_limit', 'shuffle_answers']
  },
  pages: {
    createPath: (courseId) => `/courses/${courseId}/pages`,
    updatePath: (courseId, url) => `/courses/${courseId}/pages/${url}`,
    params: ['title', 'body', 'editing_roles']
  },
  discussions: {
    createPath: (courseId) => `/courses/${courseId}/discussion_topics`,
    updatePath: (courseId, id) => `/courses/${courseId}/discussion_topics/${id}`,
    params: ['title', 'message', 'discussion_type', 'published']
  },
  announcements: {
    createPath: (courseId) => `/courses/${courseId}/discussion_topics`,
    updatePath: (courseId, id) => `/courses/${courseId}/discussion_topics/${id}`,
    params: ['title', 'message', 'discussion_type', 'published']
  },
  modules: {
    createPath: (courseId) => `/courses/${courseId}/modules`,
    updatePath: (courseId, id) => `/courses/${courseId}/modules/${id}`,
    params: ['name', 'position', 'published', 'require_sequential_progress']
  }
};


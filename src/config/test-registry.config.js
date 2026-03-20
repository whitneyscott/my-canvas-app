"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_CONFIG = void 0;
exports.TEST_CONFIG = {
    assignments: {
        createPath: function (courseId) { return "/courses/".concat(courseId, "/assignments"); },
        updatePath: function (courseId, id) { return "/courses/".concat(courseId, "/assignments/").concat(id); },
        params: ['name', 'points_possible', 'due_at', 'description']
    },
    quizzes: {
        createPath: function (courseId) { return "/courses/".concat(courseId, "/quizzes"); },
        updatePath: function (courseId, id) { return "/courses/".concat(courseId, "/quizzes/").concat(id); },
        params: ['title', 'description', 'time_limit', 'shuffle_answers']
    },
    pages: {
        createPath: function (courseId) { return "/courses/".concat(courseId, "/pages"); },
        updatePath: function (courseId, url) { return "/courses/".concat(courseId, "/pages/").concat(url); },
        params: ['title', 'body', 'editing_roles']
    },
    discussions: {
        createPath: function (courseId) { return "/courses/".concat(courseId, "/discussion_topics"); },
        updatePath: function (courseId, id) { return "/courses/".concat(courseId, "/discussion_topics/").concat(id); },
        params: ['title', 'message', 'discussion_type', 'published']
    },
    announcements: {
        createPath: function (courseId) { return "/courses/".concat(courseId, "/discussion_topics"); },
        updatePath: function (courseId, id) { return "/courses/".concat(courseId, "/discussion_topics/").concat(id); },
        params: ['title', 'message', 'discussion_type', 'published']
    },
    modules: {
        createPath: function (courseId) { return "/courses/".concat(courseId, "/modules"); },
        updatePath: function (courseId, id) { return "/courses/".concat(courseId, "/modules/").concat(id); },
        params: ['name', 'position', 'published', 'require_sequential_progress']
    }
};

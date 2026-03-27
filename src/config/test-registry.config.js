"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_CONFIG = void 0;
exports.TEST_CONFIG = {
    assignments: {
        createPath: function (courseId) { return "/courses/".concat(courseId, "/assignments"); },
        updatePath: function (courseId, id) { return "/courses/".concat(courseId, "/assignments/").concat(id); },
        deletePath: function (courseId, id) { return "/courses/".concat(courseId, "/assignments/").concat(id); },
        params: [
            'name',
            'description',
            'points_possible',
            'due_at',
            'unlock_at',
            'lock_at',
        ],
    },
    quizzes: {
        createPath: function (courseId) { return "/courses/".concat(courseId, "/quizzes"); },
        updatePath: function (courseId, id) { return "/courses/".concat(courseId, "/quizzes/").concat(id); },
        deletePath: function (courseId, id) { return "/courses/".concat(courseId, "/quizzes/").concat(id); },
        params: [
            'title',
            'description',
            'time_limit',
            'allowed_attempts',
            'due_at',
            'unlock_at',
            'lock_at',
            'show_correct_answers_at',
            'hide_correct_answers_at',
        ],
    },
    pages: {
        createPath: function (courseId) { return "/courses/".concat(courseId, "/pages"); },
        updatePath: function (courseId, url) { return "/courses/".concat(courseId, "/pages/").concat(url); },
        deletePath: function (courseId, url) {
            return "/courses/".concat(courseId, "/pages/").concat(encodeURIComponent(String(url)));
        },
        params: ['title', 'body', 'publish_at', 'published'],
    },
    discussions: {
        createPath: function (courseId) { return "/courses/".concat(courseId, "/discussion_topics"); },
        updatePath: function (courseId, id) {
            return "/courses/".concat(courseId, "/discussion_topics/").concat(id);
        },
        deletePath: function (courseId, id) {
            return "/courses/".concat(courseId, "/discussion_topics/").concat(id);
        },
        params: [
            'title',
            'message',
            'discussion_type',
            'allow_rating',
            'delayed_post_at',
            'lock_at',
            'unlock_at',
            'due_at',
            'published',
        ],
    },
    announcements: {
        createPath: function (courseId) { return "/courses/".concat(courseId, "/discussion_topics"); },
        updatePath: function (courseId, id) {
            return "/courses/".concat(courseId, "/discussion_topics/").concat(id);
        },
        deletePath: function (courseId, id) {
            return "/courses/".concat(courseId, "/discussion_topics/").concat(id);
        },
        params: [
            'title',
            'message',
            'allow_rating',
            'delayed_post_at',
            'lock_at',
            'published',
        ],
    },
    modules: {
        createPath: function (courseId) { return "/courses/".concat(courseId, "/modules"); },
        updatePath: function (courseId, id) { return "/courses/".concat(courseId, "/modules/").concat(id); },
        deletePath: function (courseId, id) { return "/courses/".concat(courseId, "/modules/").concat(id); },
        params: ['name', 'position', 'unlock_at', 'published'],
    },
};

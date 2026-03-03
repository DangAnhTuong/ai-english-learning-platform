/**
 * Hệ thống phân quyền chi tiết cho English Learning Platform
 * Format: MODULE_ACTION
 */

const Permissions = {
    // Quản lý người dùng
    USER_VIEW: 'user:view',
    USER_CREATE: 'user:create',
    USER_EDIT: 'user:edit',
    USER_DELETE: 'user:delete',
    USER_BAN: 'user:ban',
    USER_UNBAN: 'user:unban',
    USER_VIEW_PROFILE: 'user:view_profile',
    USER_EDIT_PROFILE: 'user:edit_profile',

    // Quản lý khóa học
    COURSE_VIEW: 'course:view',
    COURSE_CREATE: 'course:create',
    COURSE_EDIT: 'course:edit',
    COURSE_DELETE: 'course:delete',
    COURSE_PUBLISH: 'course:publish',
    COURSE_UNPUBLISH: 'course:unpublish',
    COURSE_ENROLL: 'course:enroll',
    COURSE_UNENROLL: 'course:unenroll',

    // Quản lý bài học
    LESSON_VIEW: 'lesson:view',
    LESSON_CREATE: 'lesson:create',
    LESSON_EDIT: 'lesson:edit',
    LESSON_DELETE: 'lesson:delete',
    LESSON_COMPLETE: 'lesson:complete',

    // Quản lý bài tập
    EXERCISE_VIEW: 'exercise:view',
    EXERCISE_CREATE: 'exercise:create',
    EXERCISE_EDIT: 'exercise:edit',
    EXERCISE_DELETE: 'exercise:delete',
    EXERCISE_SUBMIT: 'exercise:submit',
    EXERCISE_GRADE: 'exercise:grade',

    // Tính năng xã hội
    SOCIAL_FOLLOW: 'social:follow',
    SOCIAL_UNFOLLOW: 'social:unfollow',
    SOCIAL_MESSAGE: 'social:message',
    SOCIAL_POST: 'social:post',
    SOCIAL_COMMENT: 'social:comment',
    SOCIAL_LIKE: 'social:like',
    SOCIAL_SHARE: 'social:share',

    // Nhóm học tập
    GROUP_VIEW: 'group:view',
    GROUP_CREATE: 'group:create',
    GROUP_JOIN: 'group:join',
    GROUP_LEAVE: 'group:leave',
    GROUP_EDIT: 'group:edit',
    GROUP_DELETE: 'group:delete',
    GROUP_MANAGE_MEMBERS: 'group:manage_members',
    GROUP_MODERATE: 'group:moderate',

    // Quản lý nội dung
    CONTENT_VIEW: 'content:view',
    CONTENT_CREATE: 'content:create',
    CONTENT_EDIT: 'content:edit',
    CONTENT_DELETE: 'content:delete',
    CONTENT_MODERATE: 'content:moderate',
    CONTENT_APPROVE: 'content:approve',
    CONTENT_REJECT: 'content:reject',

    // Báo cáo và phân tích
    ANALYTICS_VIEW: 'analytics:view',
    ANALYTICS_EXPORT: 'analytics:export',
    REPORT_VIEW: 'report:view',
    REPORT_CREATE: 'report:create',
    REPORT_MANAGE: 'report:manage',

    // Quản trị hệ thống
    ADMIN_PANEL: 'admin:panel',
    ADMIN_SETTINGS: 'admin:settings',
    ADMIN_LOGS: 'admin:logs',
    ADMIN_BACKUP: 'admin:backup',
    ADMIN_MAINTENANCE: 'admin:maintenance',

    // AI và tính năng nâng cao
    AI_CHAT: 'ai:chat',
    AI_TUTORING: 'ai:tutoring',
    AI_ASSESSMENT: 'ai:assessment',
    VOICE_RECOGNITION: 'voice:recognition',
    TEXT_TO_SPEECH: 'voice:tts',

    // Live learning
    LIVE_CLASS_CREATE: 'live:create',
    LIVE_CLASS_JOIN: 'live:join',
    LIVE_CLASS_MODERATE: 'live:moderate',
    LIVE_CLASS_RECORD: 'live:record',

    // Gamification
    ACHIEVEMENT_VIEW: 'achievement:view',
    ACHIEVEMENT_EARN: 'achievement:earn',
    LEADERBOARD_VIEW: 'leaderboard:view',
    COMPETITION_JOIN: 'competition:join',
    COMPETITION_CREATE: 'competition:create'
};

// Student permissions
const studentPermissions = [
    // Học tập cơ bản
    Permissions.COURSE_VIEW,
    Permissions.COURSE_ENROLL,
    Permissions.COURSE_UNENROLL,
    Permissions.LESSON_VIEW,
    Permissions.LESSON_COMPLETE,
    Permissions.EXERCISE_VIEW,
    Permissions.EXERCISE_SUBMIT,

    // Profile cá nhân
    Permissions.USER_VIEW_PROFILE,
    Permissions.USER_EDIT_PROFILE,

    // Tính năng xã hội
    Permissions.SOCIAL_FOLLOW,
    Permissions.SOCIAL_UNFOLLOW,
    Permissions.SOCIAL_MESSAGE,
    Permissions.SOCIAL_POST,
    Permissions.SOCIAL_COMMENT,
    Permissions.SOCIAL_LIKE,
    Permissions.SOCIAL_SHARE,

    // Nhóm học tập
    Permissions.GROUP_VIEW,
    Permissions.GROUP_CREATE,
    Permissions.GROUP_JOIN,
    Permissions.GROUP_LEAVE,

    // AI và tính năng nâng cao
    Permissions.AI_CHAT,
    Permissions.AI_TUTORING,
    Permissions.AI_ASSESSMENT,
    Permissions.VOICE_RECOGNITION,
    Permissions.TEXT_TO_SPEECH,

    // Live learning
    Permissions.LIVE_CLASS_JOIN,

    // Gamification
    Permissions.ACHIEVEMENT_VIEW,
    Permissions.ACHIEVEMENT_EARN,
    Permissions.LEADERBOARD_VIEW,
    Permissions.COMPETITION_JOIN,

    // Báo cáo
    Permissions.REPORT_CREATE
];

// Teacher permissions (includes all student permissions)
const teacherPermissions = [
    ...studentPermissions,

    // Quản lý khóa học
    Permissions.COURSE_CREATE,
    Permissions.COURSE_EDIT,
    Permissions.COURSE_PUBLISH,
    Permissions.COURSE_UNPUBLISH,

    // Quản lý bài học
    Permissions.LESSON_CREATE,
    Permissions.LESSON_EDIT,
    Permissions.LESSON_DELETE,

    // Quản lý bài tập
    Permissions.EXERCISE_CREATE,
    Permissions.EXERCISE_EDIT,
    Permissions.EXERCISE_DELETE,
    Permissions.EXERCISE_GRADE,

    // Quản lý nội dung
    Permissions.CONTENT_CREATE,
    Permissions.CONTENT_EDIT,

    // Quản lý nhóm
    Permissions.GROUP_EDIT,
    Permissions.GROUP_MANAGE_MEMBERS,
    Permissions.GROUP_MODERATE,

    // Live learning
    Permissions.LIVE_CLASS_CREATE,
    Permissions.LIVE_CLASS_MODERATE,
    Permissions.LIVE_CLASS_RECORD,

    // Phân tích cơ bản
    Permissions.ANALYTICS_VIEW,

    // Competition
    Permissions.COMPETITION_CREATE
];

// Moderator permissions (includes all teacher permissions)
const moderatorPermissions = [
    ...teacherPermissions,

    // Kiểm duyệt nội dung
    Permissions.CONTENT_MODERATE,
    Permissions.CONTENT_APPROVE,
    Permissions.CONTENT_REJECT,

    // Quản lý báo cáo
    Permissions.REPORT_VIEW,
    Permissions.REPORT_MANAGE,

    // Quản lý người dùng cơ bản
    Permissions.USER_BAN,
    Permissions.USER_UNBAN,

    // Xem thông tin người dùng
    Permissions.USER_VIEW
];

// Admin permissions (includes all moderator permissions)
const adminPermissions = [
    ...moderatorPermissions,

    // Quản lý người dùng đầy đủ
    Permissions.USER_CREATE,
    Permissions.USER_EDIT,
    Permissions.USER_DELETE,

    // Quản lý khóa học đầy đủ
    Permissions.COURSE_DELETE,

    // Quản lý nội dung đầy đủ
    Permissions.CONTENT_DELETE,

    // Phân tích đầy đủ
    Permissions.ANALYTICS_EXPORT,

    // Quản trị hệ thống
    Permissions.ADMIN_PANEL,
    Permissions.ADMIN_SETTINGS,
    Permissions.ADMIN_LOGS,
    Permissions.ADMIN_BACKUP,
    Permissions.ADMIN_MAINTENANCE
];

// Role permissions mapping
const RolePermissions = {
    student: studentPermissions,
    teacher: teacherPermissions,
    moderator: moderatorPermissions,
    admin: adminPermissions
};

module.exports = {
    Permissions,
    RolePermissions
};
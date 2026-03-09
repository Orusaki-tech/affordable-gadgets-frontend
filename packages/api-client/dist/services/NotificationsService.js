"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class NotificationsService {
    /**
     * ViewSet for notifications (read-only, with mark-as-read action).
     * @param page A page number within the paginated result set.
     * @returns PaginatedNotificationList
     * @throws ApiError
     */
    static notificationsList(page) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/notifications/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * ViewSet for notifications (read-only, with mark-as-read action).
     * @param id A unique integer value identifying this notification.
     * @returns Notification
     * @throws ApiError
     */
    static notificationsRetrieve(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/notifications/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Mark a notification as read.
     * @param id A unique integer value identifying this notification.
     * @param requestBody
     * @returns Notification
     * @throws ApiError
     */
    static notificationsMarkReadCreate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/notifications/{id}/mark_read/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get count of unread notifications.
     * @returns Notification
     * @throws ApiError
     */
    static notificationsUnreadCountRetrieve() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/notifications/unread_count/',
        });
    }
}
exports.NotificationsService = NotificationsService;

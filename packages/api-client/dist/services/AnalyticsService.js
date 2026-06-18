"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class AnalyticsService {
    /**
     * Published buying-guide (blog) article counts and recent updates.
     * @returns any No response body
     * @throws ApiError
     */
    static analyticsBlogSummaryRetrieve() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/analytics/blog-summary/',
        });
    }
    /**
     * Admin endpoint: today's user activity feed (searches, cart adds, whatsapp clicks, logins).
     * @returns any No response body
     * @throws ApiError
     */
    static analyticsDailyActivityRetrieve() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/analytics/daily-activity/',
        });
    }
    /**
     * Admin endpoint: today's active users with aggregated activity and phone.
     * @returns any No response body
     * @throws ApiError
     */
    static analyticsDailyUsersRetrieve() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/analytics/daily-users/',
        });
    }
    /**
     * No-auth endpoint for Grafana datasource health check.
     * Returns connectivity and auth status so Grafana can verify
     * the JSON API datasource is working end-to-end.
     * @returns any No response body
     * @throws ApiError
     */
    static analyticsDatasourceHealthRetrieve() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/analytics/datasource-health/',
        });
    }
    /**
     * Public endpoint to record user activity events.
     * Accepts optional session_key for anonymous tracking before login.
     * @returns any No response body
     * @throws ApiError
     */
    static analyticsEventsCreate() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/analytics/events/',
        });
    }
    /**
     * Admin endpoint: aggregate marketing funnel data.
     * @returns any No response body
     * @throws ApiError
     */
    static analyticsFunnelSummaryRetrieve() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/analytics/funnel-summary/',
        });
    }
    /**
     * All registered users with lifetime product interaction summary.
     * @returns any No response body
     * @throws ApiError
     */
    static analyticsRegisteredUsersRetrieve() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/analytics/registered-users/',
        });
    }
    /**
     * Admin endpoint: list all users with signup date, last login, event counts.
     * @returns any No response body
     * @throws ApiError
     */
    static analyticsUsersRetrieve() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/analytics/users/',
        });
    }
    /**
     * Admin endpoint: full activity timeline for one user.
     * @param userId
     * @returns any No response body
     * @throws ApiError
     */
    static analyticsUsersRetrieve2(userId) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/analytics/users/{user_id}/',
            path: {
                'user_id': userId,
            },
        });
    }
    /**
     * Grafana datasource endpoint — returns recent WhatsApp leads with phone,
     * product name, and timestamp. Requires valid Authorization: Token header
     * to prevent leaking contact info.
     * @returns any No response body
     * @throws ApiError
     */
    static analyticsWhatsappLeadsRetrieve() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/analytics/whatsapp-leads/',
        });
    }
}
exports.AnalyticsService = AnalyticsService;

import type { CancelablePromise } from '../core/CancelablePromise';
export declare class AnalyticsService {
    /**
     * Published buying-guide (blog) article counts and recent updates.
     * @returns any No response body
     * @throws ApiError
     */
    static analyticsBlogSummaryRetrieve(): CancelablePromise<any>;
    /**
     * Admin endpoint: today's user activity feed (searches, cart adds, whatsapp clicks, logins).
     * @returns any No response body
     * @throws ApiError
     */
    static analyticsDailyActivityRetrieve(): CancelablePromise<any>;
    /**
     * Admin endpoint: today's active users with aggregated activity and phone.
     * @returns any No response body
     * @throws ApiError
     */
    static analyticsDailyUsersRetrieve(): CancelablePromise<any>;
    /**
     * No-auth endpoint for Grafana datasource health check.
     * Returns connectivity and auth status so Grafana can verify
     * the JSON API datasource is working end-to-end.
     * @returns any No response body
     * @throws ApiError
     */
    static analyticsDatasourceHealthRetrieve(): CancelablePromise<any>;
    /**
     * Public endpoint to record user activity events.
     * Accepts optional session_key for anonymous tracking before login.
     * @returns any No response body
     * @throws ApiError
     */
    static analyticsEventsCreate(): CancelablePromise<any>;
    /**
     * Admin endpoint: aggregate marketing funnel data.
     * @returns any No response body
     * @throws ApiError
     */
    static analyticsFunnelSummaryRetrieve(): CancelablePromise<any>;
    /**
     * All registered users with lifetime product interaction summary.
     * @returns any No response body
     * @throws ApiError
     */
    static analyticsRegisteredUsersRetrieve(): CancelablePromise<any>;
    /**
     * Admin endpoint: list all users with signup date, last login, event counts.
     * @returns any No response body
     * @throws ApiError
     */
    static analyticsUsersRetrieve(): CancelablePromise<any>;
    /**
     * Admin endpoint: full activity timeline for one user.
     * @param userId
     * @returns any No response body
     * @throws ApiError
     */
    static analyticsUsersRetrieve2(userId: number): CancelablePromise<any>;
    /**
     * Grafana datasource endpoint — returns recent WhatsApp leads with phone,
     * product name, and timestamp. Requires valid Authorization: Token header
     * to prevent leaking contact info.
     * @returns any No response body
     * @throws ApiError
     */
    static analyticsWhatsappLeadsRetrieve(): CancelablePromise<any>;
}

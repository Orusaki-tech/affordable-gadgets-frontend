import type { CancelablePromise } from '../core/CancelablePromise';
export declare class ObservabilityService {
    /**
     * Internal API endpoint for Grafana JSON API datasource.
     * Provides snapshot analytics of current active (unsubmitted) carts.
     * @returns any No response body
     * @throws ApiError
     */
    static observabilityCartAnalyticsRetrieve(): CancelablePromise<any>;
    /**
     * Public endpoint to record user activity events.
     * Accepts optional session_key for anonymous tracking before login.
     * @returns any No response body
     * @throws ApiError
     */
    static observabilityRecordEventCreate(): CancelablePromise<any>;
}

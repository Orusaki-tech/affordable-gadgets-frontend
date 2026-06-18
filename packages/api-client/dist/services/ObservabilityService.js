"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObservabilityService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class ObservabilityService {
    /**
     * Internal API endpoint for Grafana JSON API datasource.
     * Provides snapshot analytics of current active (unsubmitted) carts.
     * @returns any No response body
     * @throws ApiError
     */
    static observabilityCartAnalyticsRetrieve() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/observability/cart-analytics/',
        });
    }
    /**
     * Public endpoint to record user activity events.
     * Accepts optional session_key for anonymous tracking before login.
     * @returns any No response body
     * @throws ApiError
     */
    static observabilityRecordEventCreate() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/observability/record-event/',
        });
    }
}
exports.ObservabilityService = ObservabilityService;

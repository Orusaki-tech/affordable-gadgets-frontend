"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BundlesService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class BundlesService {
    /**
     * Bundle management ViewSet (admin and marketing managers).
     * @param page A page number within the paginated result set.
     * @returns PaginatedBundleList
     * @throws ApiError
     */
    static bundlesList(page) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/bundles/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * Bundle management ViewSet (admin and marketing managers).
     * @param requestBody
     * @returns Bundle
     * @throws ApiError
     */
    static bundlesCreate(requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/bundles/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Bundle management ViewSet (admin and marketing managers).
     * @param id A unique integer value identifying this bundle.
     * @returns Bundle
     * @throws ApiError
     */
    static bundlesRetrieve(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/bundles/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Bundle management ViewSet (admin and marketing managers).
     * @param id A unique integer value identifying this bundle.
     * @param requestBody
     * @returns Bundle
     * @throws ApiError
     */
    static bundlesUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PUT',
            url: '/bundles/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Bundle management ViewSet (admin and marketing managers).
     * @param id A unique integer value identifying this bundle.
     * @param requestBody
     * @returns Bundle
     * @throws ApiError
     */
    static bundlesPartialUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PATCH',
            url: '/bundles/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Bundle management ViewSet (admin and marketing managers).
     * @param id A unique integer value identifying this bundle.
     * @returns void
     * @throws ApiError
     */
    static bundlesDestroy(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'DELETE',
            url: '/bundles/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
exports.BundlesService = BundlesService;

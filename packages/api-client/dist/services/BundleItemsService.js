"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BundleItemsService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class BundleItemsService {
    /**
     * Bundle item management (admin and marketing managers).
     * @param page A page number within the paginated result set.
     * @returns PaginatedBundleItemList
     * @throws ApiError
     */
    static bundleItemsList(page) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/bundle-items/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * Bundle item management (admin and marketing managers).
     * @param requestBody
     * @returns BundleItem
     * @throws ApiError
     */
    static bundleItemsCreate(requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/bundle-items/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Bundle item management (admin and marketing managers).
     * @param id A unique integer value identifying this bundle item.
     * @returns BundleItem
     * @throws ApiError
     */
    static bundleItemsRetrieve(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/bundle-items/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Bundle item management (admin and marketing managers).
     * @param id A unique integer value identifying this bundle item.
     * @param requestBody
     * @returns BundleItem
     * @throws ApiError
     */
    static bundleItemsUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PUT',
            url: '/bundle-items/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Bundle item management (admin and marketing managers).
     * @param id A unique integer value identifying this bundle item.
     * @param requestBody
     * @returns BundleItem
     * @throws ApiError
     */
    static bundleItemsPartialUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PATCH',
            url: '/bundle-items/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Bundle item management (admin and marketing managers).
     * @param id A unique integer value identifying this bundle item.
     * @returns void
     * @throws ApiError
     */
    static bundleItemsDestroy(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'DELETE',
            url: '/bundle-items/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
exports.BundleItemsService = BundleItemsService;

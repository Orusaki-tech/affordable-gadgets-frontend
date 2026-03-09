"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrandsService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class BrandsService {
    /**
     * Brand management ViewSet.
     * @param page A page number within the paginated result set.
     * @returns PaginatedBrandList
     * @throws ApiError
     */
    static brandsList(page) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/brands/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * Brand management ViewSet.
     * @param requestBody
     * @returns Brand
     * @throws ApiError
     */
    static brandsCreate(requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/brands/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Brand management ViewSet.
     * @param id A unique integer value identifying this brand.
     * @returns Brand
     * @throws ApiError
     */
    static brandsRetrieve(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/brands/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Brand management ViewSet.
     * @param id A unique integer value identifying this brand.
     * @param requestBody
     * @returns Brand
     * @throws ApiError
     */
    static brandsUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PUT',
            url: '/brands/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Brand management ViewSet.
     * @param id A unique integer value identifying this brand.
     * @param requestBody
     * @returns Brand
     * @throws ApiError
     */
    static brandsPartialUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PATCH',
            url: '/brands/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Brand management ViewSet.
     * @param id A unique integer value identifying this brand.
     * @returns void
     * @throws ApiError
     */
    static brandsDestroy(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'DELETE',
            url: '/brands/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
exports.BrandsService = BrandsService;

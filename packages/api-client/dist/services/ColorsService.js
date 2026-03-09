"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorsService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class ColorsService {
    /**
     * Color lookup table. Admin-only write, public read.
     * Uses IsAdminOrReadOnly.
     * @param page A page number within the paginated result set.
     * @returns PaginatedColorList
     * @throws ApiError
     */
    static colorsList(page) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/colors/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * Color lookup table. Admin-only write, public read.
     * Uses IsAdminOrReadOnly.
     * @param requestBody
     * @returns Color
     * @throws ApiError
     */
    static colorsCreate(requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/colors/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Color lookup table. Admin-only write, public read.
     * Uses IsAdminOrReadOnly.
     * @param id A unique integer value identifying this color.
     * @returns Color
     * @throws ApiError
     */
    static colorsRetrieve(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/colors/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Color lookup table. Admin-only write, public read.
     * Uses IsAdminOrReadOnly.
     * @param id A unique integer value identifying this color.
     * @param requestBody
     * @returns Color
     * @throws ApiError
     */
    static colorsUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PUT',
            url: '/colors/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Color lookup table. Admin-only write, public read.
     * Uses IsAdminOrReadOnly.
     * @param id A unique integer value identifying this color.
     * @param requestBody
     * @returns Color
     * @throws ApiError
     */
    static colorsPartialUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PATCH',
            url: '/colors/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Color lookup table. Admin-only write, public read.
     * Uses IsAdminOrReadOnly.
     * @param id A unique integer value identifying this color.
     * @returns void
     * @throws ApiError
     */
    static colorsDestroy(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'DELETE',
            url: '/colors/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
exports.ColorsService = ColorsService;

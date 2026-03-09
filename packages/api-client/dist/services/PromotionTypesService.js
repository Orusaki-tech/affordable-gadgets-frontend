"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionTypesService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class PromotionTypesService {
    /**
     * PromotionType management ViewSet (admin and marketing managers).
     * @param page A page number within the paginated result set.
     * @returns PaginatedPromotionTypeList
     * @throws ApiError
     */
    static promotionTypesList(page) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/promotion-types/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * PromotionType management ViewSet (admin and marketing managers).
     * @param requestBody
     * @returns PromotionType
     * @throws ApiError
     */
    static promotionTypesCreate(requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/promotion-types/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * PromotionType management ViewSet (admin and marketing managers).
     * @param id A unique integer value identifying this Promotion Type.
     * @returns PromotionType
     * @throws ApiError
     */
    static promotionTypesRetrieve(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/promotion-types/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * PromotionType management ViewSet (admin and marketing managers).
     * @param id A unique integer value identifying this Promotion Type.
     * @param requestBody
     * @returns PromotionType
     * @throws ApiError
     */
    static promotionTypesUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PUT',
            url: '/promotion-types/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * PromotionType management ViewSet (admin and marketing managers).
     * @param id A unique integer value identifying this Promotion Type.
     * @param requestBody
     * @returns PromotionType
     * @throws ApiError
     */
    static promotionTypesPartialUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PATCH',
            url: '/promotion-types/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * PromotionType management ViewSet (admin and marketing managers).
     * @param id A unique integer value identifying this Promotion Type.
     * @returns void
     * @throws ApiError
     */
    static promotionTypesDestroy(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'DELETE',
            url: '/promotion-types/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
exports.PromotionTypesService = PromotionTypesService;

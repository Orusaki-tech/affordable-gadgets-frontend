"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneSearchService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class PhoneSearchService {
    /**
     * GET: Allows customers to search for available phone Inventory Units
     * within a specified budget range.
     *
     * Query Params required:
     * - min_price (required, decimal)
     * - max_price (required, decimal)
     *
     * Example URL: /api/phone-search/?min_price=15000&max_price=30000
     * @param page A page number within the paginated result set.
     * @returns PaginatedPublicInventoryUnitAdminList
     * @throws ApiError
     */
    static phoneSearchList(page) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/phone-search/',
            query: {
                'page': page,
            },
        });
    }
}
exports.PhoneSearchService = PhoneSearchService;

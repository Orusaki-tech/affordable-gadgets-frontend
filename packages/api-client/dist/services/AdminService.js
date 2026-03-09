"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class AdminService {
    /**
     * Fix all inventory units to be available.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    static adminFixProductVisibilityCreate(requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/admin/fix-product-visibility/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
exports.AdminService = AdminService;

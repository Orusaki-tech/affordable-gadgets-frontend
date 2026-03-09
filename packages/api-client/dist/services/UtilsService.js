"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtilsService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class UtilsService {
    /**
     * Utility endpoint to calculate a final price based on various discounts and rules.
     * This is a complex business logic endpoint, requiring POST data.
     * @param requestBody
     * @returns DiscountCalculator
     * @throws ApiError
     */
    static utilsDiscountCalculatorCreate(requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/utils/discount-calculator/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
exports.UtilsService = UtilsService;

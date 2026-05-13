"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyEmailService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class VerifyEmailService {
    /**
     * POST: Verifies a customer's email using uid and token.
     * @returns any No response body
     * @throws ApiError
     */
    static verifyEmailCreate() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/verify-email/',
        });
    }
    /**
     * POST: Re-send verification email for a customer.
     * @returns any No response body
     * @throws ApiError
     */
    static verifyEmailResendCreate() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/verify-email/resend/',
        });
    }
}
exports.VerifyEmailService = VerifyEmailService;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class LoginService {
    /**
     * POST: Authenticates a user (customer) and returns their authentication token
     * and basic user details (email, user_id).
     * - Uses CustomerLoginSerializer for credential validation and token retrieval.
     * @param requestBody
     * @returns CustomerLogin
     * @throws ApiError
     */
    static loginCreate(requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/login/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
exports.LoginService = LoginService;

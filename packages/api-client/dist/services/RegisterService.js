"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class RegisterService {
    /**
     * Handles POST requests to /register/ to create a new User and Customer instance.
     * - Uses CustomerRegistrationSerializer for validation and atomic creation.
     * - Does not require authentication (AllowAny).
     * - Returns the created user data and the authentication token.
     * @param requestBody
     * @returns CustomerRegistration
     * @throws ApiError
     */
    static registerCreate(requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/register/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
exports.RegisterService = RegisterService;

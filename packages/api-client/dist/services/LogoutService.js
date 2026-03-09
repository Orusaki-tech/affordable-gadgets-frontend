"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogoutService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class LogoutService {
    /**
     * POST: Logs out the user by deleting their authentication token.
     * Requires authentication (IsAuthenticated) via the provided token header.
     * @returns any
     * @throws ApiError
     */
    static logoutCreate() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/logout/',
        });
    }
}
exports.LogoutService = LogoutService;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfilesService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class ProfilesService {
    /**
     * GET: Retrieve the authenticated user's Admin profile. Admin-only access.
     * Creates Admin profile if it doesn't exist (for staff users without Admin profile).
     * @returns Admin
     * @throws ApiError
     */
    static profilesAdminRetrieve() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/profiles/admin/',
        });
    }
    /**
     * GET: Retrieve the authenticated user's Customer profile.
     * PUT/PATCH: Update the authenticated user's Customer profile.
     * Uses IsCustomerOwnerOrAdmin.
     * @returns CustomerProfileUpdate
     * @throws ApiError
     */
    static profilesCustomerRetrieve() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/profiles/customer/',
        });
    }
    /**
     * GET: Retrieve the authenticated user's Customer profile.
     * PUT/PATCH: Update the authenticated user's Customer profile.
     * Uses IsCustomerOwnerOrAdmin.
     * @param requestBody
     * @returns CustomerProfileUpdate
     * @throws ApiError
     */
    static profilesCustomerUpdate(requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PUT',
            url: '/profiles/customer/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * GET: Retrieve the authenticated user's Customer profile.
     * PUT/PATCH: Update the authenticated user's Customer profile.
     * Uses IsCustomerOwnerOrAdmin.
     * @param requestBody
     * @returns CustomerProfileUpdate
     * @throws ApiError
     */
    static profilesCustomerPartialUpdate(requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PATCH',
            url: '/profiles/customer/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
exports.ProfilesService = ProfilesService;

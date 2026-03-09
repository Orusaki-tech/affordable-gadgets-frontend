"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRolesService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class AdminRolesService {
    /**
     * ViewSet for listing available admin roles.
     * Read-only access to see what roles can be assigned.
     * @returns AdminRole
     * @throws ApiError
     */
    static adminRolesList() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/admin-roles/',
        });
    }
    /**
     * ViewSet for listing available admin roles.
     * Read-only access to see what roles can be assigned.
     * @param id A unique integer value identifying this Admin Role.
     * @returns AdminRole
     * @throws ApiError
     */
    static adminRolesRetrieve(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/admin-roles/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
exports.AdminRolesService = AdminRolesService;

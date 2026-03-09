"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogsService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class AuditLogsService {
    /**
     * ViewSet for audit logs (Inventory Manager and Superuser only).
     * Read-only access to view system audit trail.
     * @param page A page number within the paginated result set.
     * @returns PaginatedAuditLogList
     * @throws ApiError
     */
    static auditLogsList(page) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/audit-logs/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * ViewSet for audit logs (Inventory Manager and Superuser only).
     * Read-only access to view system audit trail.
     * @param id A unique integer value identifying this audit log.
     * @returns AuditLog
     * @throws ApiError
     */
    static auditLogsRetrieve(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/audit-logs/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
exports.AuditLogsService = AuditLogsService;

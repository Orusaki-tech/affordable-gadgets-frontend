"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnRequestsService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class ReturnRequestsService {
    /**
     * ViewSet for managing return requests (bulk returns of reserved units).
     * - Salespersons can create return requests for their reserved units
     * - Inventory Managers can approve/reject return requests
     * @param page A page number within the paginated result set.
     * @returns PaginatedReturnRequestList
     * @throws ApiError
     */
    static returnRequestsList(page) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/return-requests/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * ViewSet for managing return requests (bulk returns of reserved units).
     * - Salespersons can create return requests for their reserved units
     * - Inventory Managers can approve/reject return requests
     * @param requestBody
     * @returns ReturnRequest
     * @throws ApiError
     */
    static returnRequestsCreate(requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/return-requests/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing return requests (bulk returns of reserved units).
     * - Salespersons can create return requests for their reserved units
     * - Inventory Managers can approve/reject return requests
     * @param id A unique integer value identifying this Return Request.
     * @returns ReturnRequest
     * @throws ApiError
     */
    static returnRequestsRetrieve(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/return-requests/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing return requests (bulk returns of reserved units).
     * - Salespersons can create return requests for their reserved units
     * - Inventory Managers can approve/reject return requests
     * @param id A unique integer value identifying this Return Request.
     * @param requestBody
     * @returns ReturnRequest
     * @throws ApiError
     */
    static returnRequestsUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PUT',
            url: '/return-requests/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing return requests (bulk returns of reserved units).
     * - Salespersons can create return requests for their reserved units
     * - Inventory Managers can approve/reject return requests
     * @param id A unique integer value identifying this Return Request.
     * @param requestBody
     * @returns ReturnRequest
     * @throws ApiError
     */
    static returnRequestsPartialUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PATCH',
            url: '/return-requests/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing return requests (bulk returns of reserved units).
     * - Salespersons can create return requests for their reserved units
     * - Inventory Managers can approve/reject return requests
     * @param id A unique integer value identifying this Return Request.
     * @returns void
     * @throws ApiError
     */
    static returnRequestsDestroy(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'DELETE',
            url: '/return-requests/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Bulk approve multiple return requests.
     * @param requestBody
     * @returns ReturnRequest
     * @throws ApiError
     */
    static returnRequestsBulkApproveCreate(requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/return-requests/bulk_approve/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
exports.ReturnRequestsService = ReturnRequestsService;

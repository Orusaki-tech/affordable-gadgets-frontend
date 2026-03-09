"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitTransfersService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class UnitTransfersService {
    /**
     * ViewSet for managing unit transfers between salespersons.
     * - Salespersons can request transfers
     * - Inventory Managers can approve/reject transfers
     * @param page A page number within the paginated result set.
     * @returns PaginatedUnitTransferList
     * @throws ApiError
     */
    static unitTransfersList(page) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/unit-transfers/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * ViewSet for managing unit transfers between salespersons.
     * - Salespersons can request transfers
     * - Inventory Managers can approve/reject transfers
     * @param requestBody
     * @returns UnitTransfer
     * @throws ApiError
     */
    static unitTransfersCreate(requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/unit-transfers/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing unit transfers between salespersons.
     * - Salespersons can request transfers
     * - Inventory Managers can approve/reject transfers
     * @param id A unique integer value identifying this Unit Transfer.
     * @returns UnitTransfer
     * @throws ApiError
     */
    static unitTransfersRetrieve(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/unit-transfers/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing unit transfers between salespersons.
     * - Salespersons can request transfers
     * - Inventory Managers can approve/reject transfers
     * @param id A unique integer value identifying this Unit Transfer.
     * @param requestBody
     * @returns UnitTransfer
     * @throws ApiError
     */
    static unitTransfersUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PUT',
            url: '/unit-transfers/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing unit transfers between salespersons.
     * - Salespersons can request transfers
     * - Inventory Managers can approve/reject transfers
     * @param id A unique integer value identifying this Unit Transfer.
     * @param requestBody
     * @returns UnitTransfer
     * @throws ApiError
     */
    static unitTransfersPartialUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PATCH',
            url: '/unit-transfers/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing unit transfers between salespersons.
     * - Salespersons can request transfers
     * - Inventory Managers can approve/reject transfers
     * @param id A unique integer value identifying this Unit Transfer.
     * @returns void
     * @throws ApiError
     */
    static unitTransfersDestroy(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'DELETE',
            url: '/unit-transfers/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
exports.UnitTransfersService = UnitTransfersService;

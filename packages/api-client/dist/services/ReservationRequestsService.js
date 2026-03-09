"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationRequestsService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class ReservationRequestsService {
    /**
     * ViewSet for managing reservation requests.
     * - Salespersons can create requests and view their own
     * - Inventory Managers can approve/reject and view all pending requests
     * @param page A page number within the paginated result set.
     * @returns PaginatedReservationRequestList
     * @throws ApiError
     */
    static reservationRequestsList(page) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/reservation-requests/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * ViewSet for managing reservation requests.
     * - Salespersons can create requests and view their own
     * - Inventory Managers can approve/reject and view all pending requests
     * @param requestBody
     * @returns ReservationRequest
     * @throws ApiError
     */
    static reservationRequestsCreate(requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/reservation-requests/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing reservation requests.
     * - Salespersons can create requests and view their own
     * - Inventory Managers can approve/reject and view all pending requests
     * @param id A unique integer value identifying this Reservation Request.
     * @returns ReservationRequest
     * @throws ApiError
     */
    static reservationRequestsRetrieve(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/reservation-requests/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Override update to ensure we return the refreshed object after approval/rejection.
     * @param id A unique integer value identifying this Reservation Request.
     * @param requestBody
     * @returns ReservationRequest
     * @throws ApiError
     */
    static reservationRequestsUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PUT',
            url: '/reservation-requests/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing reservation requests.
     * - Salespersons can create requests and view their own
     * - Inventory Managers can approve/reject and view all pending requests
     * @param id A unique integer value identifying this Reservation Request.
     * @param requestBody
     * @returns ReservationRequest
     * @throws ApiError
     */
    static reservationRequestsPartialUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PATCH',
            url: '/reservation-requests/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing reservation requests.
     * - Salespersons can create requests and view their own
     * - Inventory Managers can approve/reject and view all pending requests
     * @param id A unique integer value identifying this Reservation Request.
     * @returns void
     * @throws ApiError
     */
    static reservationRequestsDestroy(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'DELETE',
            url: '/reservation-requests/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
exports.ReservationRequestsService = ReservationRequestsService;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderItemsService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class OrderItemsService {
    /**
     * CRUD for Order Items. Strictly Admin-only access.
     * Generally used only for reporting and admin-level viewing of existing orders.
     * Uses IsAdminUser.
     * @param page A page number within the paginated result set.
     * @returns PaginatedOrderItemList
     * @throws ApiError
     */
    static orderItemsList(page) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/order-items/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * CRUD for Order Items. Strictly Admin-only access.
     * Generally used only for reporting and admin-level viewing of existing orders.
     * Uses IsAdminUser.
     * @param requestBody
     * @returns OrderItem
     * @throws ApiError
     */
    static orderItemsCreate(requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/order-items/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for Order Items. Strictly Admin-only access.
     * Generally used only for reporting and admin-level viewing of existing orders.
     * Uses IsAdminUser.
     * @param id A unique integer value identifying this order item.
     * @returns OrderItem
     * @throws ApiError
     */
    static orderItemsRetrieve(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/order-items/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD for Order Items. Strictly Admin-only access.
     * Generally used only for reporting and admin-level viewing of existing orders.
     * Uses IsAdminUser.
     * @param id A unique integer value identifying this order item.
     * @param requestBody
     * @returns OrderItem
     * @throws ApiError
     */
    static orderItemsUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PUT',
            url: '/order-items/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for Order Items. Strictly Admin-only access.
     * Generally used only for reporting and admin-level viewing of existing orders.
     * Uses IsAdminUser.
     * @param id A unique integer value identifying this order item.
     * @param requestBody
     * @returns OrderItem
     * @throws ApiError
     */
    static orderItemsPartialUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PATCH',
            url: '/order-items/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for Order Items. Strictly Admin-only access.
     * Generally used only for reporting and admin-level viewing of existing orders.
     * Uses IsAdminUser.
     * @param id A unique integer value identifying this order item.
     * @returns void
     * @throws ApiError
     */
    static orderItemsDestroy(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'DELETE',
            url: '/order-items/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
exports.OrderItemsService = OrderItemsService;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryRatesService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class DeliveryRatesService {
    /**
     * Manage delivery rates (order manager write; IM, SP, OM read).
     * @param page A page number within the paginated result set.
     * @returns PaginatedDeliveryRateList
     * @throws ApiError
     */
    static deliveryRatesList(page) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/delivery-rates/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * Manage delivery rates (order manager write; IM, SP, OM read).
     * @param requestBody
     * @returns DeliveryRate
     * @throws ApiError
     */
    static deliveryRatesCreate(requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/delivery-rates/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Manage delivery rates (order manager write; IM, SP, OM read).
     * @param id A unique integer value identifying this delivery rate.
     * @returns DeliveryRate
     * @throws ApiError
     */
    static deliveryRatesRetrieve(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/delivery-rates/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Manage delivery rates (order manager write; IM, SP, OM read).
     * @param id A unique integer value identifying this delivery rate.
     * @param requestBody
     * @returns DeliveryRate
     * @throws ApiError
     */
    static deliveryRatesUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PUT',
            url: '/delivery-rates/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Manage delivery rates (order manager write; IM, SP, OM read).
     * @param id A unique integer value identifying this delivery rate.
     * @param requestBody
     * @returns DeliveryRate
     * @throws ApiError
     */
    static deliveryRatesPartialUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PATCH',
            url: '/delivery-rates/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Manage delivery rates (order manager write; IM, SP, OM read).
     * @param id A unique integer value identifying this delivery rate.
     * @returns void
     * @throws ApiError
     */
    static deliveryRatesDestroy(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'DELETE',
            url: '/delivery-rates/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
exports.DeliveryRatesService = DeliveryRatesService;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancingOffersService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class FinancingOffersService {
    /**
     * Financing offer management (Inventory Manager / Superuser).
     * @param isActive
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param product
     * @param provider
     * @param ramGb
     * @param romGb
     * @param search A search term.
     * @returns PaginatedFinancingOfferList
     * @throws ApiError
     */
    static financingOffersList(isActive, ordering, page, product, provider, ramGb, romGb, search) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/financing-offers/',
            query: {
                'is_active': isActive,
                'ordering': ordering,
                'page': page,
                'product': product,
                'provider': provider,
                'ram_gb': ramGb,
                'rom_gb': romGb,
                'search': search,
            },
        });
    }
    /**
     * Financing offer management (Inventory Manager / Superuser).
     * @param requestBody
     * @returns FinancingOffer
     * @throws ApiError
     */
    static financingOffersCreate(requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/financing-offers/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Financing offer management (Inventory Manager / Superuser).
     * @param id A unique integer value identifying this financing offer.
     * @returns FinancingOffer
     * @throws ApiError
     */
    static financingOffersRetrieve(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/financing-offers/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Financing offer management (Inventory Manager / Superuser).
     * @param id A unique integer value identifying this financing offer.
     * @param requestBody
     * @returns FinancingOffer
     * @throws ApiError
     */
    static financingOffersUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PUT',
            url: '/financing-offers/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Financing offer management (Inventory Manager / Superuser).
     * @param id A unique integer value identifying this financing offer.
     * @param requestBody
     * @returns FinancingOffer
     * @throws ApiError
     */
    static financingOffersPartialUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PATCH',
            url: '/financing-offers/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Financing offer management (Inventory Manager / Superuser).
     * @param id A unique integer value identifying this financing offer.
     * @returns void
     * @throws ApiError
     */
    static financingOffersDestroy(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'DELETE',
            url: '/financing-offers/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
exports.FinancingOffersService = FinancingOffersService;

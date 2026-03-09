"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadsService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class LeadsService {
    /**
     * Lead management for salespersons only.
     * @param page A page number within the paginated result set.
     * @returns PaginatedLeadList
     * @throws ApiError
     */
    static leadsList(page) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/leads/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * Lead management for salespersons only.
     * @param requestBody
     * @returns Lead
     * @throws ApiError
     */
    static leadsCreate(requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/leads/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Lead management for salespersons only.
     * @param id
     * @returns Lead
     * @throws ApiError
     */
    static leadsRetrieve(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/leads/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Lead management for salespersons only.
     * @param id
     * @param requestBody
     * @returns Lead
     * @throws ApiError
     */
    static leadsUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PUT',
            url: '/leads/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Lead management for salespersons only.
     * @param id
     * @param requestBody
     * @returns Lead
     * @throws ApiError
     */
    static leadsPartialUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PATCH',
            url: '/leads/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Lead management for salespersons only.
     * @param id
     * @returns void
     * @throws ApiError
     */
    static leadsDestroy(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'DELETE',
            url: '/leads/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Self-assign lead (salesperson claims lead). Only salespersons can claim leads.
     * @param id
     * @param requestBody
     * @returns Lead
     * @throws ApiError
     */
    static leadsAssignCreate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/leads/{id}/assign/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Close lead (no sale) and release inventory units back to stock. Only salespersons can close leads.
     * @param id A unique integer value identifying this lead.
     * @param requestBody
     * @returns Lead
     * @throws ApiError
     */
    static leadsCloseCreate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/leads/{id}/close/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Mark lead as contacted. Only salespersons can mark leads as contacted.
     * @param id A unique integer value identifying this lead.
     * @param requestBody
     * @returns Lead
     * @throws ApiError
     */
    static leadsContactCreate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/leads/{id}/contact/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Convert lead to order. Only salespersons can convert leads.
     * @param id A unique integer value identifying this lead.
     * @param requestBody
     * @returns Lead
     * @throws ApiError
     */
    static leadsConvertCreate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/leads/{id}/convert/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
exports.LeadsService = LeadsService;

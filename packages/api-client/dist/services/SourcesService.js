"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourcesService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class SourcesService {
    /**
     * Acquisition Source lookup table. Admin-only write, public read.
     * Uses IsAdminOrReadOnly.
     * @param page A page number within the paginated result set.
     * @returns PaginatedUnitAcquisitionSourceList
     * @throws ApiError
     */
    static sourcesList(page) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/sources/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * Acquisition Source lookup table. Admin-only write, public read.
     * Uses IsAdminOrReadOnly.
     * @param requestBody
     * @returns UnitAcquisitionSource
     * @throws ApiError
     */
    static sourcesCreate(requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/sources/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Acquisition Source lookup table. Admin-only write, public read.
     * Uses IsAdminOrReadOnly.
     * @param id A unique integer value identifying this unit acquisition source.
     * @returns UnitAcquisitionSource
     * @throws ApiError
     */
    static sourcesRetrieve(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/sources/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Acquisition Source lookup table. Admin-only write, public read.
     * Uses IsAdminOrReadOnly.
     * @param id A unique integer value identifying this unit acquisition source.
     * @param requestBody
     * @returns UnitAcquisitionSource
     * @throws ApiError
     */
    static sourcesUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PUT',
            url: '/sources/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Acquisition Source lookup table. Admin-only write, public read.
     * Uses IsAdminOrReadOnly.
     * @param id A unique integer value identifying this unit acquisition source.
     * @param requestBody
     * @returns UnitAcquisitionSource
     * @throws ApiError
     */
    static sourcesPartialUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PATCH',
            url: '/sources/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Acquisition Source lookup table. Admin-only write, public read.
     * Uses IsAdminOrReadOnly.
     * @param id A unique integer value identifying this unit acquisition source.
     * @returns void
     * @throws ApiError
     */
    static sourcesDestroy(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'DELETE',
            url: '/sources/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
exports.SourcesService = SourcesService;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagsService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class TagsService {
    /**
     * ViewSet for managing product tags.
     * - All authenticated staff users can read
     * - Content Creators and Inventory Managers can create/edit/delete
     * @returns Tag
     * @throws ApiError
     */
    static tagsList() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/tags/',
        });
    }
    /**
     * ViewSet for managing product tags.
     * - All authenticated staff users can read
     * - Content Creators and Inventory Managers can create/edit/delete
     * @param requestBody
     * @returns Tag
     * @throws ApiError
     */
    static tagsCreate(requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/tags/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing product tags.
     * - All authenticated staff users can read
     * - Content Creators and Inventory Managers can create/edit/delete
     * @param id A unique integer value identifying this tag.
     * @returns Tag
     * @throws ApiError
     */
    static tagsRetrieve(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/tags/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing product tags.
     * - All authenticated staff users can read
     * - Content Creators and Inventory Managers can create/edit/delete
     * @param id A unique integer value identifying this tag.
     * @param requestBody
     * @returns Tag
     * @throws ApiError
     */
    static tagsUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PUT',
            url: '/tags/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing product tags.
     * - All authenticated staff users can read
     * - Content Creators and Inventory Managers can create/edit/delete
     * @param id A unique integer value identifying this tag.
     * @param requestBody
     * @returns Tag
     * @throws ApiError
     */
    static tagsPartialUpdate(id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PATCH',
            url: '/tags/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing product tags.
     * - All authenticated staff users can read
     * - Content Creators and Inventory Managers can create/edit/delete
     * @param id A unique integer value identifying this tag.
     * @returns void
     * @throws ApiError
     */
    static tagsDestroy(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'DELETE',
            url: '/tags/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
exports.TagsService = TagsService;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitImagesService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class UnitImagesService {
    /**
     * CRUD for individual inventory unit images.
     * Only Admins can add/manage images; everyone can view unit images
     * (which are nested in InventoryUnitViewSet).
     * Uses IsAdminOrReadOnly.
     * @param page A page number within the paginated result set.
     * @returns PaginatedInventoryUnitImageList
     * @throws ApiError
     */
    static unitImagesList(page) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/unit-images/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * CRUD for individual inventory unit images.
     * Only Admins can add/manage images; everyone can view unit images
     * (which are nested in InventoryUnitViewSet).
     * Uses IsAdminOrReadOnly.
     * @param formData
     * @returns InventoryUnitImage
     * @throws ApiError
     */
    static unitImagesCreate(formData) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/unit-images/',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * CRUD for individual inventory unit images.
     * Only Admins can add/manage images; everyone can view unit images
     * (which are nested in InventoryUnitViewSet).
     * Uses IsAdminOrReadOnly.
     * @param id A unique integer value identifying this inventory unit image.
     * @returns InventoryUnitImage
     * @throws ApiError
     */
    static unitImagesRetrieve(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/unit-images/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD for individual inventory unit images.
     * Only Admins can add/manage images; everyone can view unit images
     * (which are nested in InventoryUnitViewSet).
     * Uses IsAdminOrReadOnly.
     * @param id A unique integer value identifying this inventory unit image.
     * @param formData
     * @returns InventoryUnitImage
     * @throws ApiError
     */
    static unitImagesUpdate(id, formData) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PUT',
            url: '/unit-images/{id}/',
            path: {
                'id': id,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * CRUD for individual inventory unit images.
     * Only Admins can add/manage images; everyone can view unit images
     * (which are nested in InventoryUnitViewSet).
     * Uses IsAdminOrReadOnly.
     * @param id A unique integer value identifying this inventory unit image.
     * @param formData
     * @returns InventoryUnitImage
     * @throws ApiError
     */
    static unitImagesPartialUpdate(id, formData) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PATCH',
            url: '/unit-images/{id}/',
            path: {
                'id': id,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * CRUD for individual inventory unit images.
     * Only Admins can add/manage images; everyone can view unit images
     * (which are nested in InventoryUnitViewSet).
     * Uses IsAdminOrReadOnly.
     * @param id A unique integer value identifying this inventory unit image.
     * @returns void
     * @throws ApiError
     */
    static unitImagesDestroy(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'DELETE',
            url: '/unit-images/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
exports.UnitImagesService = UnitImagesService;

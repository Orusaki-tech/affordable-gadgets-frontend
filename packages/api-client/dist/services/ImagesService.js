"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImagesService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class ImagesService {
    /**
     * CRUD for individual product images.
     * Only Admins can add/manage images; everyone can view product images
     * (which are nested in ProductViewSet).
     * Uses IsContentCreatorOrInventoryManagerOrReadOnly.
     * @param page A page number within the paginated result set.
     * @returns PaginatedProductImageList
     * @throws ApiError
     */
    static imagesList(page) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/images/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * CRUD for individual product images.
     * Only Admins can add/manage images; everyone can view product images
     * (which are nested in ProductViewSet).
     * Uses IsContentCreatorOrInventoryManagerOrReadOnly.
     * @param formData
     * @returns ProductImage
     * @throws ApiError
     */
    static imagesCreate(formData) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/images/',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * CRUD for individual product images.
     * Only Admins can add/manage images; everyone can view product images
     * (which are nested in ProductViewSet).
     * Uses IsContentCreatorOrInventoryManagerOrReadOnly.
     * @param id A unique integer value identifying this product image.
     * @returns ProductImage
     * @throws ApiError
     */
    static imagesRetrieve(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/images/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD for individual product images.
     * Only Admins can add/manage images; everyone can view product images
     * (which are nested in ProductViewSet).
     * Uses IsContentCreatorOrInventoryManagerOrReadOnly.
     * @param id A unique integer value identifying this product image.
     * @param formData
     * @returns ProductImage
     * @throws ApiError
     */
    static imagesUpdate(id, formData) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PUT',
            url: '/images/{id}/',
            path: {
                'id': id,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * CRUD for individual product images.
     * Only Admins can add/manage images; everyone can view product images
     * (which are nested in ProductViewSet).
     * Uses IsContentCreatorOrInventoryManagerOrReadOnly.
     * @param id A unique integer value identifying this product image.
     * @param formData
     * @returns ProductImage
     * @throws ApiError
     */
    static imagesPartialUpdate(id, formData) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PATCH',
            url: '/images/{id}/',
            path: {
                'id': id,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * CRUD for individual product images.
     * Only Admins can add/manage images; everyone can view product images
     * (which are nested in ProductViewSet).
     * Uses IsContentCreatorOrInventoryManagerOrReadOnly.
     * @param id A unique integer value identifying this product image.
     * @returns void
     * @throws ApiError
     */
    static imagesDestroy(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'DELETE',
            url: '/images/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
exports.ImagesService = ImagesService;

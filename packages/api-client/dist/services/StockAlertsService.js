"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockAlertsService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class StockAlertsService {
    /**
     * Get all stock alerts.
     * @returns any
     * @throws ApiError
     */
    static stockAlertsRetrieve() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/stock-alerts/',
        });
    }
}
exports.StockAlertsService = StockAlertsService;

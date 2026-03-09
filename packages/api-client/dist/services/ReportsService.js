"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class ReportsService {
    /**
     * Get aging inventory report.
     * @returns any
     * @throws ApiError
     */
    static reportsAgingInventoryRetrieve() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/reports/aging_inventory/',
        });
    }
    /**
     * Get inventory value report.
     * @returns any
     * @throws ApiError
     */
    static reportsInventoryValueRetrieve() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/reports/inventory_value/',
        });
    }
    /**
     * Get product performance report.
     * @returns any
     * @throws ApiError
     */
    static reportsProductPerformanceRetrieve() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/reports/product_performance/',
        });
    }
    /**
     * Get request management statistics.
     * @returns any
     * @throws ApiError
     */
    static reportsRequestManagementRetrieve() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/reports/request_management/',
        });
    }
    /**
     * Get salesperson performance report.
     * @returns any
     * @throws ApiError
     */
    static reportsSalespersonPerformanceRetrieve() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/reports/salesperson_performance/',
        });
    }
    /**
     * Get stock movement report.
     * @returns any
     * @throws ApiError
     */
    static reportsStockMovementRetrieve() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/reports/stock_movement/',
        });
    }
}
exports.ReportsService = ReportsService;

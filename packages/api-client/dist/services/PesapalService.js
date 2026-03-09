"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PesapalService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class PesapalService {
    /**
     * Handle Pesapal IPN (Instant Payment Notification) callbacks.
     * @param orderMerchantReference
     * @param orderNotificationType
     * @param orderTrackingId
     * @param paymentAccount
     * @param paymentMethod
     * @param paymentStatusDescription
     * @returns any
     * @throws ApiError
     */
    static pesapalIpnRetrieve(orderMerchantReference, orderNotificationType, orderTrackingId, paymentAccount, paymentMethod, paymentStatusDescription) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/pesapal/ipn/',
            query: {
                'OrderMerchantReference': orderMerchantReference,
                'OrderNotificationType': orderNotificationType,
                'OrderTrackingId': orderTrackingId,
                'PaymentAccount': paymentAccount,
                'PaymentMethod': paymentMethod,
                'PaymentStatusDescription': paymentStatusDescription,
            },
        });
    }
    /**
     * Handle POST IPN (if Pesapal sends POST instead of GET).
     * @returns any No response body
     * @throws ApiError
     */
    static pesapalIpnCreate() {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/pesapal/ipn/',
        });
    }
}
exports.PesapalService = PesapalService;

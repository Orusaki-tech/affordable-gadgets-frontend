"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitiatePaymentRequestRequest = void 0;
var InitiatePaymentRequestRequest;
(function (InitiatePaymentRequestRequest) {
    /**
     * What to pay for on this order.
     */
    let payment_mode;
    (function (payment_mode) {
        payment_mode["ITEMS_ONLY"] = "ITEMS_ONLY";
        payment_mode["DELIVERY_ONLY"] = "DELIVERY_ONLY";
        payment_mode["BOTH"] = "BOTH";
    })(payment_mode = InitiatePaymentRequestRequest.payment_mode || (InitiatePaymentRequestRequest.payment_mode = {}));
})(InitiatePaymentRequestRequest || (exports.InitiatePaymentRequestRequest = InitiatePaymentRequestRequest = {}));

/**
 * Request payload for initiating a Pesapal payment on an existing order.
 */
export type InitiatePaymentRequestRequest = {
    callback_url: string;
    cancellation_url?: string | null;
    /**
     * What to pay for on this order.
     */
    payment_mode?: InitiatePaymentRequestRequest.payment_mode;
    customer?: any;
    billing_address?: any;
};
export declare namespace InitiatePaymentRequestRequest {
    /**
     * What to pay for on this order.
     */
    enum payment_mode {
        ITEMS_ONLY = "ITEMS_ONLY",
        DELIVERY_ONLY = "DELIVERY_ONLY",
        BOTH = "BOTH"
    }
}

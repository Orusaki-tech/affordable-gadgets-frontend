/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request payload for initiating a Pesapal payment on an existing order.
 */
export type InitiatePaymentRequestRequest = {
    callback_url: string;
    cancellation_url?: string | null;
    customer?: any;
    billing_address?: any;
    /**
     * What to pay for on this order.
     * - ITEMS_ONLY: pay for cart items only
     * - DELIVERY_ONLY: pay for delivery only
     * - BOTH: pay for items + delivery
     */
    payment_mode?: 'ITEMS_ONLY' | 'DELIVERY_ONLY' | 'BOTH';
};


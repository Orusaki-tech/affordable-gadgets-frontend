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
    /**
     * What to pay for on this order.
     */
    payment_mode?: InitiatePaymentRequestRequest.payment_mode;
    customer?: any;
    billing_address?: any;
};
export namespace InitiatePaymentRequestRequest {
    /**
     * What to pay for on this order.
     */
    export enum payment_mode {
        ITEMS_ONLY = 'ITEMS_ONLY',
        DELIVERY_ONLY = 'DELIVERY_ONLY',
        BOTH = 'BOTH',
    }
}


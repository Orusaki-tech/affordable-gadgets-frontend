/* manually added — not generated */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Product variant with storage, RAM, and pricing.
 */
export type PublicProductVariant = {
    readonly id?: number;
    storage_gb?: number | null;
    ram_gb?: number | null;
    selling_price: string;
    default_selling_price?: string | null;
    default_cost_of_unit?: string | null;
    is_active?: boolean;
};

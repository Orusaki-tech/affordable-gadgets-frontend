/**
 * Lightweight article payload for product list (no body).
 */
export type ProductArticleSummary = {
    /**
     * Public H1 for the article page (e.g. 'Galaxy A42 5G in Kenya: who should buy it?')
     */
    readonly headline?: string;
    /**
     * Article page title tag (50–60 chars recommended)
     */
    readonly seo_title?: string;
    readonly is_published?: boolean;
    readonly published_at?: string | null;
    readonly created_at?: string;
    readonly updated_at?: string;
};

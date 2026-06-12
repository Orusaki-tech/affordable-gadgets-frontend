/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer to handle username/email and password authentication.
 */
export type CustomerLoginRequest = {
    username_or_email: string;
    password: string;
    /**
     * Anonymous browser session key for backfilling pre-login activity.
     */
    session_key?: string;
};


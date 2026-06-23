export declare class AWSOperationError extends Error {
    readonly originalError?: any | undefined;
    constructor(message: string, originalError?: any | undefined);
}
export declare class MinecraftTimeoutError extends Error {
    constructor(message: string);
}
export declare class ParameterStoreError extends Error {
    readonly originalError?: any | undefined;
    constructor(message: string, originalError?: any | undefined);
}

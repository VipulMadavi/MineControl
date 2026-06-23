"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParameterStoreError = exports.MinecraftTimeoutError = exports.AWSOperationError = void 0;
class AWSOperationError extends Error {
    originalError;
    constructor(message, originalError) {
        super(message);
        this.originalError = originalError;
        this.name = "AWSOperationError";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AWSOperationError = AWSOperationError;
class MinecraftTimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = "MinecraftTimeoutError";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.MinecraftTimeoutError = MinecraftTimeoutError;
class ParameterStoreError extends Error {
    originalError;
    constructor(message, originalError) {
        super(message);
        this.originalError = originalError;
        this.name = "ParameterStoreError";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.ParameterStoreError = ParameterStoreError;

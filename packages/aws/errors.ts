export class AWSOperationError extends Error {
  constructor(message: string, public readonly originalError?: any) {
    super(message);
    this.name = "AWSOperationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class MinecraftTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MinecraftTimeoutError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ParameterStoreError extends Error {
  constructor(message: string, public readonly originalError?: any) {
    super(message);
    this.name = "ParameterStoreError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

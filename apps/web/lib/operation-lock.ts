export type OperationState = "idle" | "starting" | "stopping";

class OperationLock {
  private state: OperationState = "idle";

  public get(): OperationState {
    return this.state;
  }

  public set(state: OperationState) {
    this.state = state;
  }
}

const globalRef = global as unknown as { operationLock?: OperationLock };
if (!globalRef.operationLock) {
  globalRef.operationLock = new OperationLock();
}

export const operationLock = globalRef.operationLock;

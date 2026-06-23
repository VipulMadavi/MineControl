export type OperationState = "idle" | "starting" | "stopping";

class OperationLock {
  private state: OperationState = "idle";
  private recoveryTicks: number = 0;

  public get(): OperationState {
    return this.state;
  }

  public set(state: OperationState) {
    this.state = state;
    if (state === "starting" || state === "stopping") {
      this.resetRecoveryTicks();
    }
  }

  public getRecoveryTicks(): number {
    return this.recoveryTicks;
  }

  public incrementRecoveryTicks(): number {
    this.recoveryTicks++;
    return this.recoveryTicks;
  }

  public resetRecoveryTicks() {
    if (this.recoveryTicks > 0) {
      console.log("[RECOVERY] Counter reset");
      this.recoveryTicks = 0;
    }
  }
}

const globalRef = global as unknown as { operationLock?: OperationLock };
if (!globalRef.operationLock) {
  globalRef.operationLock = new OperationLock();
}

export const operationLock = globalRef.operationLock;

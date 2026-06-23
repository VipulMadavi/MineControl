export declare function getParameter(name: string): Promise<string | null>;
export declare function putParameter(name: string, value: string): Promise<void>;
export declare function getAutoStopEnabled(): Promise<boolean>;
export declare function setAutoStopEnabled(enabled: boolean): Promise<void>;
export declare function getLastPlayerSeen(): Promise<Date | null>;
export declare function setLastPlayerSeen(date: Date): Promise<void>;

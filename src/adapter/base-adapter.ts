export interface BaseAdapter {
    lastSuccess: Date;
    lastError: Error;
    isConnected: boolean;
    /** Required connections, whe offline, influence the server's health */
    isRequired: boolean;
    connect(): Promise<void>;
    terminate(): Promise<void>;
}

export interface BaseAdapter {
    lastSuccess: Date;
    lastError: Error;
    isConnected: boolean;
    /** Independent connections, whe offline, doesn't influence the server's health */
    isIndependent: boolean;
    connect(): Promise<void>;
    terminate(): Promise<void>;
}

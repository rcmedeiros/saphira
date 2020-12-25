export interface BaseAdapter {
    lastSuccess: Date;
    lastError: Error;
    isConnected: boolean;
    /** Coadjuvant connections, whe offline, doesn't influence the server's health */
    isCoadjuvant: boolean;
    connect(): Promise<void>;
    terminate(): Promise<void>;
}

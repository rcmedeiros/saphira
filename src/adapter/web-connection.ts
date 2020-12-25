import { BaseAdapter } from './base-adapter';
import { Oauth2Client } from '../oauth2_client';
import { WebResponse } from './web-response';

export interface WebConnection extends BaseAdapter {
    post(endpoint: string, payload?: string | unknown): Promise<WebResponse>;
    get(endpoint: string, payload?: string | unknown): Promise<WebResponse>;
    put(endpoint: string, payload?: string | unknown): Promise<WebResponse>;
    patch(endpoint: string, payload?: string | unknown): Promise<WebResponse>;
    head(endpoint: string, payload?: string | unknown): Promise<WebResponse>;
    delete(endpoint: string, payload?: string | unknown): Promise<WebResponse>;

    call(operation: string, requestArgs: unknown): Promise<unknown>;

    setHeader(name: string, value: string): void;
    setOauth2Client(v: Oauth2Client): void;
}

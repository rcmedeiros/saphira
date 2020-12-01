import { Oauth2Client } from '../oauth2_client';
import { BaseAdapter } from './base-adapter';
import { WebResponse } from './web-response';

export interface WebConnection extends BaseAdapter {

    post(endpoint: string, payload?: string | object): Promise<WebResponse>;
    get(endpoint: string, payload?: string | object): Promise<WebResponse>;
    put(endpoint: string, payload?: string | object): Promise<WebResponse>;
    patch(endpoint: string, payload?: string | object): Promise<WebResponse>;
    head(endpoint: string, payload?: string | object): Promise<WebResponse>;
    delete(endpoint: string, payload?: string | object): Promise<WebResponse>;

    call(operation: string, requestArgs: object): Promise<unknown>;

    setHeader(name: string, value: string): void;
    setOauth2Client(v: Oauth2Client): void;
}

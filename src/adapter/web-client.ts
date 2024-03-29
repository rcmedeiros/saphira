import { NameValue, Rejection, Resolution } from '../types';
import needle, { NeedleHttpVerbs, NeedleOptions } from 'needle';

import { Connection } from './connection';
import { ENDPOINT_HEALTH_CHECK } from '../constants/settings';
import { HttpStatusCode } from '../constants/http_status_codes';
import { JWT } from '../jwt';
import { Oauth2Client } from '../oauth2_client';
import { WebConfig } from './web-config';
import { WebConnection } from './web-connection';
import { WebResponse } from './web-response';
import { safeStringify } from '../helpers';

const POST: NeedleHttpVerbs = 'post';
const GET: NeedleHttpVerbs = 'get';
const HEAD: NeedleHttpVerbs = 'head';
const DELETE: NeedleHttpVerbs = 'delete';
const PATCH: NeedleHttpVerbs = 'patch';
const PUT: NeedleHttpVerbs = 'put';

export class WebClient extends Connection implements WebConnection {
    private _oauth2Client: Oauth2Client;
    protected _connected: boolean;
    protected headers: { [name: string]: string };
    protected _config: WebConfig;

    constructor(name: string, config: WebConfig) {
        super(name);
        this._connected = false;

        this._config = config;
        this._config.parameters = this._config.parameters || {};
        this._config.parameters.host = this._config.host;

        this._config.webOptions = this._config.webOptions || {};
        this._config.webOptions.compressed = this._config.webOptions.compressed === undefined ? true : undefined;
        this._config.webOptions.headers = this._config.webOptions.headers || {};
    }

    private setBearerAuthentication(token: string): void {
        this.setHeader('Authorization', `Bearer ${token}`);
    }

    private buildPayload(payload: unknown): unknown {
        if (typeof payload === 'object') {
            return this.substitute(payload as NameValue, this._config.parameters);
        } else if (typeof payload === 'string') {
            return payload.interpolate(this._config.parameters);
        } else {
            return payload;
        }
    }

    private async request(verb: NeedleHttpVerbs, endpoint: string, payload?: string | unknown): Promise<WebResponse> {
        return this.do(
            new Promise(async (resolve: Resolution<WebResponse>, reject: Rejection): Promise<void> => {
                try {
                    if (this._oauth2Client) {
                        await this._oauth2Client.keepFresh();
                        const jwt: JWT = await this._oauth2Client.getBearerToken();
                        this.setBearerAuthentication(jwt.toString());
                    }

                    const options: NeedleOptions = this._config.webOptions as NeedleOptions;
                    options.headers = {
                        ...options.headers,
                        ...{
                            'Content-Type':
                                typeof payload === 'object' ? 'application/json' : 'text/html; charset=utf-8',
                        },
                    };

                    const url: string = `${this._config.host}${endpoint}`.interpolate(this._config.parameters);
                    const data: unknown = this.buildPayload(payload);
                    if (this._config.logRequest) {
                        console.info(
                            '....................................WEB SERVICE CALL\n' +
                                `\t${verb.toUpperCase()} ${verb.charAt(0) === 'p' ? 'to ' : ''}${url}\n` +
                                `\tHEADERS: ${safeStringify(options.headers)}\n` +
                                `\tDATA:${payload ? safeStringify(payload) : ''}`,
                        );
                    }

                    const response: WebResponse = new WebResponse(await needle(verb, url, data, options));
                    if (this._config.logRequest) {
                        console.info(
                            '....................................WEB SERVICE RESPONSE\n' +
                                `\t${response ? safeStringify(response) : ''}`,
                        );
                    }
                    resolve(response);
                } catch (e) {
                    reject(e);
                }
            }),
        );
    }

    protected substitute(obj: unknown, subst: NameValue): unknown {
        const o: NameValue = obj as NameValue;
        Object.keys(o).forEach((k: string) => {
            if (typeof o[k] === 'string' && (o[k] as string).charAt(0) === '{') {
                const s: string = (o[k] as string).substring(1, (o[k] as string).length - 1);
                switch (typeof subst[s]) {
                    case 'number':
                        o[k] = parseFloat(subst[s] as string);
                        break;
                    case 'boolean':
                        o[k] = (subst[s] as string) === 'true';
                        break;
                    default:
                        o[k] = subst[s];
                }
            } else if (o[k] && typeof o[k] === 'object' && !(o[k] instanceof Date)) {
                o[k] = this.substitute(o[k] as NameValue, subst);
            }
        });
        return o;
    }

    public async connect(): Promise<void> {
        return this.do(
            new Promise(async (resolve: Resolution<void>, reject: Rejection): Promise<void> => {
                try {
                    const r: WebResponse = await this.request(
                        GET,
                        this._config.healthCheckEndpoint || ENDPOINT_HEALTH_CHECK,
                    );
                    if (r.statusCode >= HttpStatusCode.OK && r.statusCode < HttpStatusCode.PARTIAL_CONTENT) {
                        this._connected = true;
                        resolve();
                    } else {
                        const e: Error = new Error(`HTTP${r.statusCode}`);
                        e.name = `HTTP${r.statusCode}`;
                        reject(e);
                    }
                } catch (e) {
                    this._connected = false;
                    reject(e);
                }
            }),
        );
    }

    public get isConnected(): boolean {
        return this._connected;
    }

    public async post(endpoint: string, payload?: string | unknown): Promise<WebResponse> {
        return this.request(POST, endpoint, payload);
    }
    public async get(endpoint?: string, payload?: string | unknown): Promise<WebResponse> {
        return this.request(GET, endpoint || '/', payload);
    }
    public async put(endpoint: string, payload?: string | unknown): Promise<WebResponse> {
        return this.request(PUT, endpoint, payload);
    }
    public async patch(endpoint: string, payload?: string | unknown): Promise<WebResponse> {
        return this.request(PATCH, endpoint, payload);
    }
    public async head(endpoint: string, payload?: string | unknown): Promise<WebResponse> {
        return this.request(HEAD, endpoint, payload);
    }
    public async delete(endpoint: string, payload?: string | unknown): Promise<WebResponse> {
        return this.request(DELETE, endpoint, payload);
    }

    public setHeader(name: string, value: string): void {
        this._config.webOptions.headers[name] = value;
    }

    public async terminate(): Promise<void> {
        return Promise.resolve();
    }

    public setOauth2Client(v: Oauth2Client): void {
        this._oauth2Client = v;
    }
}

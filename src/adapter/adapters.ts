import { Rejection, Resolution, Saphira } from '../';

import { AuthConfig } from './auth_config';
import { BaseAdapter } from './base-adapter';
import { MSG_ADAPTER_NOT_FOUND } from '../constants/messages';
import { WebClient } from './web-client';
import { WebConfig } from './web-config';
import { WebConnection } from './web-connection';

const DEFAULT_WEB: string = 'DEFAULT_WEB';

export type WebServerConfig = WebConfig;
export interface AdapterStatus {
    [name: string]: {
        online: boolean;
        lastSuccessfulCall: Date;
        lastError?: string;
    };
}

export interface AdaptersConfig {
    sysAuth?: Array<AuthConfig>;
    // databases?: Array<Config | string>;
    webServices?: Array<WebServerConfig | string>;
    // soapServers?: Array<SoapServerConfig>;
    // storage?: Array<Config>;
}

export class Adapters {
    private static readonly connections: Map<string, BaseAdapter> = new Map();

    /* istanbul ignore next */
    private constructor() {}

    private static getWebConnection(name: string): WebConnection {
        return Adapters.connections.get(name) as WebConnection;
    }

    public static setupWebConnection(config: WebConfig, name?: string): WebConnection {
        // const isSoap: boolean = false/*!!(config as SoapConfig).wsdl*/;
        name = name || /*(isSoap ? DEFAULT_SOAP : DEFAULT_WEB)*/ DEFAULT_WEB;
        const c: BaseAdapter = /*isSoap ? new SoapClient(name, config as SoapConfig) :*/ new WebClient(name, config);
        c.isRequired = config.required;
        return (Adapters.connections.get(name) || Adapters.connections.set(name, c).get(name)) as WebConnection;
    }

    public static getWebService(name?: string): WebClient {
        const result: WebClient = Adapters.getWebConnection(name || DEFAULT_WEB) as WebClient;
        /* istanbul ignore else */
        if (result) {
            return result;
        } else {
            throw new Error(MSG_ADAPTER_NOT_FOUND.format(name || 'Web Service'));
        }
    }

    public static allConnected(): boolean {
        let result: boolean = true;
        Adapters.connections.forEach((c: BaseAdapter) => {
            if (c.isRequired) {
                result = result && c.isConnected;
            }
        });
        return result;
    }

    public static async closeConnection(name: string): Promise<void> {
        if (Adapters.connections.has(name)) {
            const result: Promise<void> = Adapters.connections.get(name).terminate();
            Adapters.connections.delete(name);
            return result;
        }
    }

    public static async closeAll(): Promise<void> {
        return new Promise((resolve: Resolution<void>, reject: Rejection) => {
            /* istanbul ignore else */
            if (Saphira.TEST) {
                resolve();
            } else {
                const promises: Array<Promise<void>> = [];
                Adapters.connections.forEach((c: BaseAdapter) => {
                    promises.push(c.terminate());
                });
                Promise.all(promises)
                    .then(() => {
                        Adapters.connections.clear();
                        resolve();
                    })
                    .catch(reject);
            }
        });
    }

    public static status(): AdapterStatus {
        const result: AdapterStatus = {};
        Adapters.connections.forEach((c: BaseAdapter, k: string) => {
            result[k] = {
                online: c.isConnected,
                lastSuccessfulCall: c.lastSuccess,
            };
            if (!result[k].online) {
                result[k].lastError = c.lastError.message;
            }
        });
        return result;
    }
}

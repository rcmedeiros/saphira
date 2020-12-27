import { Rejection, Resolution } from '../';

import { BaseAdapter } from './base-adapter';
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
    // sysAuth?: Array<AuthConfig>;
    // databases?: Array<Config | string>;
    webServices?: Array<WebServerConfig | string>;
    // soapServers?: Array<SoapServerConfig>;
    // storage?: Array<Config>;
}

export class Adapters {
    private static readonly connections: Map<string, BaseAdapter> = new Map();

    private constructor() {}

    public static setupWebConnection(config: WebConfig, name?: string): WebConnection {
        // const isSoap: boolean = false/*!!(config as SoapConfig).wsdl*/;
        name = name || /*(isSoap ? DEFAULT_SOAP : DEFAULT_WEB)*/ DEFAULT_WEB;
        const c: BaseAdapter = /*isSoap ? new SoapClient(name, config as SoapConfig) :*/ new WebClient(name, config);
        c.isCoadjuvant = config.coadjuvant;
        return (Adapters.connections.get(name) || Adapters.connections.set(name, c).get(name)) as WebConnection;
    }

    public static getWebConnection(name: string): WebConnection {
        return Adapters.connections.get(name) as WebConnection;
    }

    public static getWebService(name?: string): WebClient {
        return Adapters.getWebConnection(name || DEFAULT_WEB) as WebClient;
    }

    public static allConnected(): boolean {
        let result: boolean = true;
        Adapters.connections.forEach((c: BaseAdapter) => {
            if (!c.isCoadjuvant) {
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

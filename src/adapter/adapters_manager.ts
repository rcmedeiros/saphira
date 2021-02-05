import { Adapters, AdaptersConfig, WebServerConfig } from './adapters';
import { NameValue, Rejection, Resolution } from '..';

import { AuthConfig } from './auth_config';
import { MISSING_ENV_VAR } from '../constants/messages';
import { Oauth2Client } from '../oauth2_client';
import { Resource } from './resource';
import { WebConfig } from './web-config';
import { WebConnection } from './web-connection';
import { parseJson } from '../helpers';

export interface AdaptersResult {
    success: boolean;
    data: NameValue;
}

export class AdaptersManager {
    private readonly adapters: AdaptersConfig;
    private readonly oauth2Clients: { [name: string]: Oauth2Client };

    constructor(adapters: AdaptersConfig) {
        this.adapters = adapters;
        this.oauth2Clients = {};
    }

    private async resolve<T>(p: Promise<T>): Promise<T | Error> {
        return new Promise((resolve: Resolution<T | Error>): void => {
            p.then((result: T) => {
                resolve(result);
            }).catch((e: Error) => {
                resolve(e);
            });
        });
    }

    public async connect(): Promise<AdaptersResult> {
        const name: Array<[string, string, boolean]> = [];
        const promises: Array<Promise<void | Error>> = [];

        if (this.adapters) {
            if (this.adapters.sysAuth) {
                this.adapters.sysAuth.forEach((auth: AuthConfig) => {
                    const cfg: AuthConfig = parseJson(process.env[auth.envVar]) as AuthConfig;
                    if (cfg) {
                        auth = { ...auth, ...cfg };
                        name.push([auth.name, auth.serverURI, auth.independent]);

                        const client: Oauth2Client = new Oauth2Client()
                            .setClient(auth.clientId, auth.clientSecret, auth.serverURI, auth.tokenEndpoint)
                            .setPublicKey(auth.publicKey)
                            .setCustomArgs(
                                auth.clientIdProp,
                                auth.clientSecretProp,
                                auth.tokenProp,
                                auth.subjectProp,
                                auth.fixedExpiration,
                            );

                        const promise: Promise<void> = new Promise((resolve: Resolution<void>, reject: Rejection) => {
                            new Resource(auth.publicKey)
                                .get()
                                .then((publicKey: string) => {
                                    client.setPublicKey(publicKey);
                                    client
                                        .keepFresh()
                                        .then(() => {
                                            resolve();
                                        })
                                        .catch(reject);
                                })
                                .catch(reject);
                        });

                        this.oauth2Clients[auth.name] = client;
                        promises.push(this.resolve(promise));
                    } else {
                        throw new Error(MISSING_ENV_VAR.format(auth.envVar));
                    }
                });
            }
            if (this.adapters.webServices) {
                this.adapters.webServices.forEach((ws: WebServerConfig | string) => {
                    let webServer: WebServerConfig =
                        typeof ws === 'string' ? { name: ws, envVar: ws, healthCheckEndpoint: '' } : ws;
                    const cfg: WebConfig =
                        (parseJson(process.env[webServer.envVar], true) as WebConfig) ||
                        (!process.env[webServer.envVar]
                            ? undefined
                            : {
                                  envVar: webServer.envVar,
                                  // host: process.env[webServer.envVar],
                                  host: new URL(process.env[webServer.envVar]).toString(),
                                  healthCheckEndpoint: '',
                                  independent: true,
                              });
                    if (cfg) {
                        webServer = {
                            ...webServer,
                            ...cfg,
                            ...{ parameters: { ...webServer?.parameters, ...cfg?.parameters } },
                        };
                        webServer.host =
                            webServer.host.lastChar() === '/' ? webServer.host.substringUpToLast('/') : webServer.host;
                        name.push([webServer.name || 'Web Server', webServer.host, webServer.independent]);
                        const c: WebConnection = Adapters.setupWebConnection(webServer, webServer.name);
                        if (webServer.systemAuth) {
                            c.setOauth2Client(this.oauth2Clients[webServer.systemAuth]);
                        }
                        promises.push(this.resolve(c.connect()));
                    } else {
                        throw new Error(MISSING_ENV_VAR.format(webServer.envVar));
                    }
                });
            }
        }

        const returns: Array<void | Error> = await Promise.all(promises);
        const result: AdaptersResult = { success: true, data: {} };

        returns.forEach((e: Error & { code: string }, i: number) => {
            result.data[name[i][0]] = { '': name[i][1], status: 'OK' };
            if (e) {
                (result.data[name[i][0]] as { status: string }).status = e.code || e.name;
                result.success = name[i][2] ? result.success : false;
            }
        });

        return result;
    }

    get environmentVariables(): Array<string> {
        const result: Array<string> = [];
        if (this.adapters) {
            if (this.adapters.webServices) {
                this.adapters.webServices.forEach((ws: WebServerConfig | string) => {
                    result.push(typeof ws === 'string' ? ws : ws.envVar);
                });
            }
        }
        return result;
    }
}

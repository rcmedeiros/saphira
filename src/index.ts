import '@rcmedeiros/prototypes';

import * as core from 'express-serve-static-core';
import * as http from 'http';

import { Adapters, AdaptersConfig, WebServerConfig } from './adapter/adapters';
import { AdaptersManager, AdaptersResult } from './adapter/adapters_manager';
import { Controller, Handler, HandlersByMethod, Method } from './controller/controller';
import {
    DEFAULT_HTTPS_PORT,
    DEFAULT_HTTP_PORT,
    ENDPOINT_API_SPEC,
    ENDPOINT_HEALTH_CHECK,
    ENDPOINT_INFO,
    ENDPOINT_OPEN_API,
    ENV_DEBUG_ROUTES,
    ENV_TLS,
    FILENAME_TLS_CERTIFICATE,
    FILENAME_TLS_KEY,
    HEADER_X_HRTIME,
    HEADER_X_PAGINATION,
    HEADER_X_SUMMARY,
    JWT_CLOCK_TOLERANCE,
    JWT_KEY,
    JWT_OPTS,
    OAUTH2_SERVER,
    UTF8,
} from './constants/settings';
import { Express, Request } from './express';
import { Info, OpenAPI, OpenAPIHelper } from './open-api.helper';
import { NameValue, Rejection, Resolution, StringSet } from './types';
import bodyParser, { OptionsUrlencoded } from 'body-parser';
import cert, { CertInfo } from 'cert-info';
import { decodeJWT, envVarAsBoolean, envVarAsString, parseJson, uuid } from './helpers';
import express, { Request as ERequest, Response, Router } from 'express';
import sshpk, { Key } from 'sshpk';
import yaml, { DEFAULT_SCHEMA, JSON_SCHEMA } from 'js-yaml';

import { BadGatewayError } from './errors/bad_gateway-error';
import { BadRequestError } from './errors/bad_request-error';
import { ContentType } from './constants/content_types';
import { DTO } from './dto/dto';
import { HttpError } from './errors/http-error';
import { HttpStatusCode } from './constants/http_status_codes';
import { JWT } from './jwt';
import { PagedResult } from './controller/paged_result';
import { Responder } from './controller/responder';
import { ServerError } from './errors/server-error';
import { Type } from './data-types';
import { URL } from 'url';
import { Vault } from './vault';
import { WebClient } from './adapter/web-client';
import { WebConfig } from './adapter/web-config';
import { WebConnection } from './adapter/web-connection';
import { WebOptions } from './adapter/web-options';
import { WebResponse } from './adapter/web-response';
import compression from 'compression'; // compresses requests
import cors from 'cors';
import figlet from 'figlet';
import fs from 'fs';
import helmet from 'helmet';
import https from 'https';
import path from 'path';
import swaggerUiExpress from 'swagger-ui-express';

export interface ServerInfo {
    url: URL;
    description: string;
}

/* == cors.CorsOptions == */
type CustomOrigin = (requestOrigin: string, callback: (err: Error | null, allow?: boolean) => void) => void;
interface CorsOptions {
    origin?: boolean | string | RegExp | Array<string | RegExp> | CustomOrigin;
    methods?: string | Array<string>;
    allowedHeaders?: string | Array<string>;
    exposedHeaders?: string | Array<string>;
    credentials?: boolean;
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
}

export interface SaphiraOptions {
    port?: number;
    urlencodedOptions?: OptionsUrlencoded;
    requestLimit?: number | string;
    servers?: Array<ServerInfo>;
    openApiComponents?: { [index: string]: unknown };
    corsOptions?: CorsOptions;
    adapters?: AdaptersConfig;
}

interface TLSOptions {
    key: string;
    cert: string;
}

const PORT: string = 'port';
export class Saphira {
    public static readonly PRODUCTION: boolean = (process.env.NODE_ENV || '').toLowerCase().startsWith('prod');
    public static TEST: boolean = (process.env.NODE_ENV || '').toLowerCase() === 'test';

    private readonly app: core.Express;
    private server: http.Server;
    private readonly options: SaphiraOptions;
    private readonly controllerTypes: Array<typeof Controller>;
    private info: NameValue;
    private readonly adapters: AdaptersConfig;
    private since: Date;
    public tls: [string, string];

    constructor(controllerTypes: Array<typeof Controller>, options?: SaphiraOptions) {
        this.options = options || {};
        this.adapters = this.options.adapters || {};
        this.options.requestLimit = this.options.requestLimit || '100kb';

        this.options.corsOptions = this.options.corsOptions || {};

        this.options.corsOptions.exposedHeaders =
            this.options.corsOptions.exposedHeaders && typeof this.options.corsOptions.exposedHeaders === 'string'
                ? [
                      ...[this.options.corsOptions.exposedHeaders],
                      ...[HEADER_X_PAGINATION, HEADER_X_SUMMARY, HEADER_X_HRTIME],
                  ]
                : [
                      ...(this?.options?.corsOptions?.exposedHeaders || []),
                      ...[HEADER_X_PAGINATION, HEADER_X_SUMMARY, HEADER_X_HRTIME],
                  ];

        this.app = express();
        this.app.use(bodyParser.json({ limit: this.options.requestLimit }));
        this.app.use(
            bodyParser.urlencoded(
                this.options.urlencodedOptions || { extended: false, limit: this.options.requestLimit },
            ),
        );
        this.app.use(bodyParser.raw({ limit: this.options.requestLimit }));
        this.app.use(compression());

        if (Saphira.PRODUCTION || !envVarAsString('SERVER_PATHS')?.contains('http:')) {
            this.app.use(helmet());
        }

        this.app.use(cors(this.options.corsOptions));

        this.controllerTypes = controllerTypes;
    }

    private servers(): Array<ServerInfo> {
        const port: string = this.options.port ? this.options.port.toString() : '';
        const servers: string = envVarAsString('SERVER_PATHS');

        return !servers
            ? [{ url: new URL(`http${this.tls ? 's' : ''}://localhost:${port}/api`), description: 'Local Server' }]
            : servers.split(',').map<ServerInfo>((serverPath: string) => {
                  return {
                      url: new URL(`${serverPath}/api`),
                      description: `${process.env.NODE_ENV || 'undefined'} server`,
                  };
              });
    }

    private returnInfo(request: ERequest, response: Response): void {
        if (Saphira.PRODUCTION) {
            try {
                new JWT(request.headers.authorization);
            } catch (e) {
                response.sendStatus((e as HttpError).status);
                return;
            }
        }

        response.setHeader('Content-Type', ContentType.JSON_format);
        response.send({
            ...this.info,
            ...{ upSince: this.since.toLocalISOString() },
            ...{ upTime: this.since.period() },
            ...{ connections: Adapters.status() },
        });
    }

    private verifyRequiredEnvVars(requiredEnvVars: Array<string>): boolean {
        if (requiredEnvVars?.length) {
            const missing: Array<string> = [];
            requiredEnvVars.forEach((name: string) => {
                if (!process.env[name]) {
                    missing.push(name);
                }
            });

            if (missing.length) {
                let msg: string = `MISSING ENVIRONMENT VARIABLE${missing.length > 1 ? 'S' : ''}: ${missing.join(
                    ', ',
                )}.`;

                if (missing.length > 1) {
                    msg = `${msg.substringUpToLast(',')} and${msg.substringFromLast(',')}`;
                }

                console.error(msg);
                return false;
            }
        }
        return true;
    }

    private loadSecurityLayer(): TLSOptions {
        const s: string = envVarAsString(ENV_TLS);

        if (s) {
            const result: TLSOptions = s.contains('"')
                ? (parseJson(s) as TLSOptions)
                : {
                      key: fs.readFileSync(path.join(s, FILENAME_TLS_KEY), UTF8),
                      cert: fs.readFileSync(path.join(s, FILENAME_TLS_CERTIFICATE), UTF8),
                  };

            const info: CertInfo = cert.info(result.cert.substringUpTo('END CERTIFICATE-----'));
            let expiration: string;
            if (Date.now() > info.expiresAt) {
                expiration = 'EXPIRED';
            } else {
                expiration = Date.now() + 2592000000 > info.expiresAt ? 'expiring...' : 'Valid';
            }

            this.tls = [
                'to {0} from {1} to {2}.'.format(
                    info.subject,
                    new Date(info.issuedAt).toFormattedString('yyyy/MM/dd'),
                    new Date(info.expiresAt).toFormattedString('yyyy/MM/dd'),
                ),
                expiration,
            ];

            return result;
        } else {
            return undefined;
        }
    }

    private showRoutes(): void {
        if (envVarAsBoolean(ENV_DEBUG_ROUTES)) {
            const routes: Array<unknown> = [];

            (this.app as Express & { _router: { stack: Array<NameValue> } })._router.stack.forEach(
                (middleware: NameValue) => {
                    if (middleware.route) {
                        // routes registered directly on the app
                        routes.push(middleware.route);
                    } else if (middleware.name === 'router') {
                        // router middleware
                        (middleware.handle as { stack: Array<unknown> }).stack.forEach(
                            (handler: { route: unknown }) => {
                                routes.push(handler.route);
                            },
                        );
                    }
                },
            );

            const paths: NameValue = {};
            routes.forEach((r: { path: string; methods: unknown }) => {
                paths[r.path] = paths[r.path]
                    ? {
                          methods: `${(paths[r.path] as { methods: string }).methods}, ${Object.keys(r.methods).join(
                              ', ',
                          )}`,
                      }
                    : { methods: Object.keys(r.methods).join(', ') };
            });

            console.table(paths);
        }
    }

    private fingerprint(): string {
        const k: string = Vault.getInstance().get(JWT_KEY) as string;

        if (!k) {
            return undefined;
        } else {
            let key: Key;

            try {
                key = sshpk.parseKey(k, 'auto');
            } catch {
                return undefined;
            }

            return `${key.type.toUpperCase()}-${key.size}: ${key.fingerprint('md5').toString()}`;
        }
    }

    private async banner(connections?: NameValue): Promise<void> {
        return new Promise((resolve: Resolution<void>, reject: Rejection): void => {
            figlet.text(
                __moduleInfo.name,
                {
                    font: 'Star Wars',
                    horizontalLayout: 'default',
                    verticalLayout: 'default',
                },
                (err: Error, data: string) => {
                    /* istanbul ignore if */
                    if (err) {
                        reject(err);
                    } else {
                        console.info(`\n${data}\n`);

                        let versionStatus: string;
                        if (__moduleInfo.version.indexOf('-dev') !== -1) {
                            versionStatus = 'local';
                        } else {
                            versionStatus = __moduleInfo.version.indexOf('-') !== -1 ? 'development' : 'release';
                        }

                        const fingerprint: string = this.fingerprint();

                        this.info = {
                            name: __moduleInfo.name,
                            version: __moduleInfo.version,
                            description: __moduleInfo.description,
                            certificate: this.tls ? this.tls[0] : undefined,
                            jwtKey: fingerprint,
                        };

                        const table: NameValue = {
                            VERSION: { '': __moduleInfo.version, status: versionStatus },
                            PORT: { '': this.app.get(PORT), status: 'open' },
                            ENVIRONMENT: { '': process.env.NODE_ENV },
                            /*Log: {
                            '': Logger.outputDir ? path.join(Logger.outputDir, __moduleInfo.name.toLowerCase()) : undefined ||
                                'CONSOLE ONLY', status: LogLevel[Logger.level],
                        },*/
                            'TLS Certificate': this.tls
                                ? { '': this.tls[0], status: this.tls[1] }
                                : { '': 'none', status: 'OFF' },
                            ...(this.fingerprint
                                ? { 'JWT Public Key': { '': fingerprint, status: fingerprint ? 'loaded' : 'FAILED' } }
                                : {}),
                            ...connections,
                        };

                        if (this.options.servers) {
                            table['     '] = {};
                            this.options.servers.forEach((server: ServerInfo, idx: number) => {
                                const item: string = `${server.description.capitalize()}${
                                    this.options.servers.length > 1 ? `[${idx}]` : ''
                                }`;
                                table[item] = {
                                    '': `${server.url}${Saphira.PRODUCTION ? '/' : '-docs/'}`,
                                };
                                if (!Saphira.PRODUCTION && server.url.protocol === 'http:') {
                                    (table[item] as { status: string }).status = 'Security off';
                                }
                            });
                        }

                        console.table(table);
                        this.showRoutes();
                        resolve();
                    }
                },
            );
        });
    }

    private route(app: Express, controllerTypes: Array<typeof Controller>): void {
        const expressRouter: Router = express.Router();

        app.get(ENDPOINT_HEALTH_CHECK, (_request: ERequest, response: Response) => {
            response.sendStatus(Adapters.allConnected() ? HttpStatusCode.OK : HttpStatusCode.BAD_GATEWAY);
        });
        app.get(ENDPOINT_INFO, (request: ERequest, response: Response) => {
            this.returnInfo(request, response);
        });

        const controllers: Array<Controller> = [];

        controllerTypes.forEach((controller: typeof Controller) => {
            let c: Controller;
            try {
                c = new controller();
            } catch (e) {
                console.error(e);
                throw new Error((e as Error).message);
            }
            controllers.push(c);
            c.paths.forEach((cPath: string): void => {
                const handlersByMethod: HandlersByMethod = c.getHandler(cPath);
                Object.keys(handlersByMethod).forEach((method: string) => {
                    const handler: Handler = handlersByMethod[method];
                    expressRouter[handler.method](cPath, Responder.route(c, handler));
                });
            });
        });

        app.use(expressRouter);

        const servers: Array<ServerInfo> = this.servers();
        this.options.servers = servers;

        if (!Saphira.PRODUCTION) {
            const apiDocs: Info = {
                module: {
                    name: __moduleInfo.name,
                    version: `${__moduleInfo.version} (Saphira --dev--)`,
                    description: __moduleInfo.description,
                },
                controllers: controllers,
                servers: servers,
                components: this.options.openApiComponents,
            };
            const doc: OpenAPI = OpenAPIHelper.buildOpenApi(apiDocs);
            app.use(
                ENDPOINT_OPEN_API,
                swaggerUiExpress.serve,
                swaggerUiExpress.setup(doc, { customSiteTitle: __moduleInfo.name }),
            );

            const spec: string = yaml.dump(yaml.load(JSON.stringify(doc), { schema: JSON_SCHEMA }), {
                schema: DEFAULT_SCHEMA,
            });
            app.use(ENDPOINT_API_SPEC, (_req: Request, res: Response) => {
                res.setHeader('Content-Type', ContentType.YAML_from_users);
                res.send(spec);
            });
        }
    }

    public async listen(): Promise<void> {
        this.since = new Date();
        return new Promise((resolve: Resolution<void>, reject: Rejection) => {
            this.server = { close: (): Promise<void> => Promise.resolve() } as unknown as http.Server;

            const vault: Vault = Vault.getInstance();

            // Logger.setUp();
            const httpsOptions: TLSOptions = this.loadSecurityLayer();
            this.app.set(PORT, this.options.port || (this.tls ? DEFAULT_HTTPS_PORT : DEFAULT_HTTP_PORT));

            const oauth: boolean = !!process.env[OAUTH2_SERVER];

            if (oauth) {
                this.adapters.webServices = this.adapters.webServices || [];
                if (this.adapters.webServices.filter((c: WebServerConfig) => c.envVar === OAUTH2_SERVER).length === 0) {
                    this.adapters.webServices.push(OAUTH2_SERVER);
                }

                this.adapters.webServices
                    .filter((c: WebServerConfig) => c.envVar === OAUTH2_SERVER)
                    .forEach((ws: WebServerConfig) => {
                        ws.name = OAUTH2_SERVER;
                    });
            }

            const adaptersMgr: AdaptersManager = new AdaptersManager(this.adapters);
            this.verifyRequiredEnvVars(adaptersMgr.environmentVariables);

            adaptersMgr
                .connect()
                .then((connections: AdaptersResult) => {
                    new Promise((res: Resolution<void>) => {
                        if (oauth) {
                            Adapters.getWebService(OAUTH2_SERVER)
                                .get('/key')
                                .then((response: WebResponse) => {
                                    response.okOnly();
                                    vault
                                        .set(JWT_KEY, response.body)
                                        .set(JWT_OPTS, { clockTolerance: JWT_CLOCK_TOLERANCE });
                                    res();
                                    Adapters.closeConnection(OAUTH2_SERVER).catch(console.warn);
                                })
                                .catch((e: Error) => {
                                    console.error('FAILED to obtain OAuth2 Server key');
                                    console.error(e);
                                    (connections.data[OAUTH2_SERVER] as { status: string }).status = e.name;
                                    res();
                                });
                        } else {
                            res();
                        }
                    })
                        .then(() => {
                            if (connections.success) {
                                try {
                                    this.route(this.app, this.controllerTypes);
                                } catch (e) {
                                    reject(e);
                                    return undefined;
                                }

                                if (!httpsOptions) {
                                    this.server = this.app.listen(this.app.get(PORT), async () => {
                                        this.banner(connections.data)
                                            .then(() => {
                                                resolve();
                                            })
                                            .catch(reject);
                                    });
                                } else {
                                    this.server = https
                                        .createServer(
                                            {
                                                key: httpsOptions.key,
                                                cert: httpsOptions.cert,
                                            },
                                            this.app as unknown as http.RequestListener,
                                        )
                                        .listen(this.app.get(PORT), async () => {
                                            this.banner(connections.data)
                                                .then(() => {
                                                    resolve();
                                                })
                                                .catch(reject);
                                        });
                                }
                            } else {
                                this.banner(connections.data)
                                    .then(() => {
                                        reject(new Error('>>> FAILED TO LOAD CONFIGURATION <<<'));
                                    })
                                    .catch(console.error);
                            }
                        })
                        .catch((e: Error) => {
                            reject(e);
                        });
                })
                .catch((e: Error) => {
                    reject(e);
                });
        });
    }

    public async close(): Promise<void> {
        return new Promise((resolve: Resolution<void>, reject: Rejection) => {
            this.server.close((err: Error) => {
                /* istanbul ignore if */
                if (err) {
                    reject(err);
                }
                Adapters.closeAll().then(resolve).catch(reject);
            });
        });
    }
}

export {
    BadRequestError,
    Controller,
    decodeJWT,
    DTO,
    Handler,
    Method,
    BadGatewayError,
    ServerError,
    PagedResult,
    Type,
    Vault,
    NameValue,
    StringSet,
    Rejection,
    Resolution,
    Adapters,
    WebClient,
    WebConfig,
    WebConnection,
    WebOptions,
    WebResponse,
    parseJson,
    uuid,
    envVarAsString,
    envVarAsBoolean,
    HttpStatusCode,
    JWT,
    ContentType,
};

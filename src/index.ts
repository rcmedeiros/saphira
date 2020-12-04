import '@rcmedeiros/prototypes';
import bodyParser, { OptionsUrlencoded } from 'body-parser';
import compression from 'compression';  // compresses requests
import cors from 'cors';
import express, { Request as ERequest, Response, Router } from 'express';
// tslint:disable-next-line: no-implicit-dependencies
import * as core from 'express-serve-static-core';
import figlet from 'figlet';
import fs from 'fs';
import helmet from 'helmet';
import * as http from 'http';
import https from 'https';
import path from 'path';
import swaggerUiExpress from 'swagger-ui-express';
import { URL } from 'url';
import yaml, { DEFAULT_SAFE_SCHEMA, JSON_SCHEMA } from 'js-yaml';
import {
    DEFAULT_HTTP_PORT, DEFAULT_HTTPS_PORT, ENDPOINT_HEALTH_CHECK, ENDPOINT_OPEN_API, UTF8, ENDPOINT_API_SPEC, ENV_DEBUG_ROUTES, JWT_KEY,
    JWT_OPTS, JWT_CLOCK_TOLERANCE, ENDPOINT_INFO, FILENAME_TLS_KEY, FILENAME_TLS_CERTIFICATE, ENV_TLS, HEADER_X_PAGINATION, HEADER_X_SUMMARY, HEADER_X_HRTIME,
} from './constants/settings';
import { Controller, Handler, HandlersByMethod, Method } from './controller/controller';
import { PagedResult } from './controller/paged_result';
import { Responder } from './controller/responder';
import { Type } from './data-types';
import { StringSet, Rejection, Resolution, NameValue } from './types';
import { DTO } from './dto/dto';
import { BadGatewayError } from './errors/bad_gateway-error';
import { BadRequestError } from './errors/bad_request-error';
import { HttpStatusCode } from './constants/http_status_codes';
import { ServerError } from './errors/server-error';
import { Logger, LogLevel, LogOptions } from './logger';
import { Info, OpenAPI, OpenAPIHelper } from './open-api.helper';
import { Vault } from './vault';
import { Adapters, AdaptersManager, ConnectionsResult, WebServerConfig } from './adapters_manager';
import { envVarAsBoolean, envVarAsString } from './helpers';
import { MimeType } from './constants/mime_types';
import { HttpError } from './errors/http-error';
import { JWT } from './jwt';
import { Connections } from './adapter/adapters';
import cert, { CertInfo } from 'cert-info';
import { Express, Request } from './express';
import sshpk, { Key } from 'sshpk';
import { WebResponse } from './adapter/web-response';

const OAUTH2_SERVER: string = 'OauthServer';
export interface ServerInfo {
    url: URL;
    description: string;
}

/* == cors.CorsOptions == */
type CustomOrigin = (requestOrigin: string, callback: (err: Error | null, allow?: boolean) => void) => void;
interface CorsOptions {
    origin?: boolean | string | RegExp | Array<(string | RegExp)> | CustomOrigin;
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
    logOptions?: LogOptions;
    adapters?: Adapters;
}

interface HttpsOptions {
    key: string;
    cert: string;
}


const PORT: string = 'port';
const MODULE_PREFIX: string = __moduleInfo.name.toUpperCase().replaceAll('-', '_');
export class Saphira {
    public static readonly PRODUCTION: boolean = (process.env.NODE_ENV || '').toLowerCase().startsWith('prod');
    public static TEST: boolean = (process.env.NODE_ENV || '').toLowerCase() === 'test';

    private readonly app: core.Express;
    private server: http.Server;
    private readonly options: SaphiraOptions;
    private readonly controllerTypes: Array<typeof Controller>;
    public tls: [string, string];
    private info: NameValue;
    private readonly adapters: Adapters;

    constructor(controllerTypes: Array<typeof Controller>, options?: SaphiraOptions) {
        this.options = options || {};
        this.options.requestLimit = this.options.requestLimit || '100kb';

        if (!this.options.corsOptions) {
            this.options.corsOptions = {
                exposedHeaders: [HEADER_X_PAGINATION, HEADER_X_SUMMARY, HEADER_X_HRTIME],
            };
        } else if (!this.options.corsOptions.exposedHeaders) {
            this.options.corsOptions.exposedHeaders = [HEADER_X_PAGINATION, HEADER_X_SUMMARY, HEADER_X_HRTIME];
        } else {
            if (typeof this.options.corsOptions.exposedHeaders === 'string') {
                this.options.corsOptions.exposedHeaders = [this.options.corsOptions.exposedHeaders];
            }
            if (this.options.corsOptions.exposedHeaders.indexOf(HEADER_X_PAGINATION) === -1) {
                this.options.corsOptions.exposedHeaders.push(HEADER_X_PAGINATION);
            }
            if (this.options.corsOptions.exposedHeaders.indexOf(HEADER_X_SUMMARY) === -1) {
                this.options.corsOptions.exposedHeaders.push(HEADER_X_SUMMARY);
            }
            if (this.options.corsOptions.exposedHeaders.indexOf(HEADER_X_HRTIME) === -1) {
                this.options.corsOptions.exposedHeaders.push(HEADER_X_HRTIME);
            }
        }


        Logger.getInstance(this.options.logOptions || { logLevel: Saphira.TEST ? LogLevel.warn : LogLevel.debug });

        this.app = express();
        // tslint:disable: deprecation
        this.app.use(bodyParser.json({ limit: this.options.requestLimit }));
        this.app.use(bodyParser.urlencoded(this.options.urlencodedOptions || { extended: false, limit: this.options.requestLimit }));
        this.app.use(bodyParser.raw({ limit: this.options.requestLimit }));
        this.app.use(compression());
        this.app.use(helmet());
        this.app.use(cors(this.options.corsOptions));

        this.controllerTypes = controllerTypes;

    }

    private servers(): Array<ServerInfo> {
        const port: string = this.options.port ? this.options.port.toString() : '';
        const SERVERS: string = `${MODULE_PREFIX}_SERVERS`;
        const CNAME: string = `${MODULE_PREFIX}_CNAME`;
        const vault: Vault = Vault.getInstance();

        const result: Array<ServerInfo> =
            this.options.servers ? this.options.servers :
                vault.has(SERVERS) ? vault.get(SERVERS) as Array<ServerInfo> :
                    vault.has(CNAME) ? [{ url: new URL(`https://${vault.get(CNAME)}:${port}/api`), description: `${process.env.NODE_ENV || ''} server` }] :
                        [];

        if (result.filter((i: ServerInfo) => i.url.host.toLowerCase().contains('localhost') || i.url.host.contains('127.0.0.1')).length === 0) {
            result.push({ url: new URL(`http${this.tls ? 's' : ''}://localhost:${port}/api`), description: 'Local Server' });
        }

        return result;
    }

    private returnInfo(request: ERequest, response: Response): void {
        if (Saphira.PRODUCTION) {
            try {
                new JWT(request.headers.authorization)
            } catch (e) {
                response.sendStatus((e as HttpError).status);
                return;
            }
        }

        response.setHeader('Content-Type', MimeType.JSON_format);
        response.send({ ...this.info, ...{ connections: Connections.status() } });
    }

    private verifyRequiredEnvVars(requiredEnvVars: Array<string>): boolean {
        if (requiredEnvVars && requiredEnvVars.length) {
            const missing: Array<string> = [];
            requiredEnvVars.forEach((name: string) => {
                if (!process.env[name]) {
                    missing.push(name);
                }
            });

            if (missing.length) {
                console.error(`MISSING ENVIRONMENT VARIABLE${missing.length > 1 ? 'S' : ''}: ${missing.join(', ')}.`);
                return false;
            }
        }
        return true;
    }

    private loadSecurityLayer(): HttpsOptions {
        const s: string = envVarAsString(ENV_TLS);

        if (!!s) {
            const result: HttpsOptions = {
                key: fs.readFileSync(path.join(s, FILENAME_TLS_KEY), UTF8),
                cert: fs.readFileSync(path.join(s, FILENAME_TLS_CERTIFICATE), UTF8),
            };

            const info: CertInfo = cert.info(result.cert.substringUpTo('END CERTIFICATE-----'));
            this.tls = ['to {0} from {1} to {2}.'.format(
                info.subject,
                new Date(info.issuedAt).toFormattedString('yyyy/MM/dd'),
                new Date(info.expiresAt).toFormattedString('yyyy/MM/dd')),
            Date.now() > info.expiresAt ? 'EXPIRED' : (Date.now() + 2592000000) > info.expiresAt ? 'expiring...' : 'Valid'];

            return result;
        } else {
            return undefined;
        }
    }

    private showRoutes(): void {
        if (envVarAsBoolean(ENV_DEBUG_ROUTES)) {
            const routes: Array<unknown> = [];

            (this.app as Express & { _router: { stack: Array<NameValue> } })._router.stack.forEach((middleware: NameValue) => {
                if (middleware.route) { // routes registered directly on the app
                    routes.push(middleware.route);
                } else if (middleware.name === 'router') { // router middleware
                    (middleware.handle as { stack: Array<unknown> }).stack.forEach((handler: { route: unknown }) => {
                        routes.push(handler.route);
                    });
                }
            });

            const paths: NameValue = {};
            routes.forEach((r: { path: string; methods: object }) => {
                paths[r.path] = paths[r.path] ?
                    { methods: `${(paths[r.path] as { methods: string }).methods}, ${Object.keys(r.methods).join(', ')}` } :
                    { methods: Object.keys(r.methods).join(', ') };
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
                key = sshpk.parseKey(Vault.getInstance().get(JWT_KEY) as string, 'auto');
            } catch {
                return undefined;
            }

            return `${key.type.toUpperCase()}-${key.size}: ${key.fingerprint('md5').toString()}`;
        }
    }

    private async banner(connections?: NameValue): Promise<void> {
        return new Promise((resolve: Function, reject: Rejection): void => {
            figlet.text(__moduleInfo.name, {
                font: 'Star Wars',
                horizontalLayout: 'default',
                verticalLayout: 'default',
            }, (err: Error, data: string) => {
                if (err) {
                    reject(err);
                } else {
                    console.info(`\n${data}\n`);

                    const versionStatus: string =
                        __moduleInfo.version.indexOf('-dev') !== -1 ? 'local' :
                            __moduleInfo.version.indexOf('-') !== -1 ? 'development' :
                                'release';

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
                        'TLS Certificate': this.tls ? { '': this.tls[0], status: this.tls[1] } : { '': 'none', status: 'OFF' },
                        ...(this.fingerprint ? { 'JWT Public Key': { '': fingerprint, status: fingerprint ? 'loaded' : 'FAILED' } } : {}),
                        ...connections,
                    };

                    if (this.options.servers) {
                        table['     '] = {};
                        this.options.servers.forEach((server: ServerInfo) => {
                            table[server.description.capitalize()] = {
                                '': `${server.url}${Saphira.PRODUCTION ? '/' : '-docs/'}`,
                            };
                        });
                    }

                    console.table(table);
                    this.showRoutes();
                    resolve();
                }
            });
        });

    }

    public async listen(): Promise<void> {
        return new Promise((resolve: Resolution<void>, reject: Rejection) => {
            this.server = { close: (): Promise<void> => Promise.resolve() } as unknown as http.Server;
            const vault: Vault = Vault.getInstance();
            vault.connect().then(() => {
                // Logger.setUp();
                const httpsOptions: HttpsOptions = this.loadSecurityLayer();
                this.app.set(PORT, this.options.port || (this.tls ? DEFAULT_HTTPS_PORT : DEFAULT_HTTP_PORT));

                const oauth: boolean = !!process.env.OAUTH2_URI;

                if (oauth) {
                    this.adapters.webServices = this.adapters.webServices || [];
                    if (this.adapters.webServices.filter((c: WebServerConfig) => c.envVar === 'OAUTH2_URI').length === 0) {
                        this.adapters.webServices.push({
                            name: OAUTH2_SERVER,
                            envVar: 'OAUTH2_URI',
                            healthCheckEndpoint: '/health-check',
                        });
                    }
                }

                const adaptersMgr: AdaptersManager = new AdaptersManager(this.adapters);
                this.verifyRequiredEnvVars(adaptersMgr.environmentVariables);

                adaptersMgr.connect().then((connections: ConnectionsResult) => {

                    new Promise((res: Function) => {
                        if (oauth) {
                            Connections.getWebConnection(OAUTH2_SERVER).get('/key').then((response: WebResponse) => {
                                response.okOnly();
                                vault
                                    .set(JWT_KEY, response.body)
                                    .set(JWT_OPTS, { clockTolerance: JWT_CLOCK_TOLERANCE });
                                res();
                                Connections.closeConnection(OAUTH2_SERVER).catch(console.warn);
                            }).catch((e: Error) => {
                                console.error('FAILED to obtain key from Oauth2 Server');
                                console.error(e);
                                (connections.data.OauthServer as { status: string }).status = e.name;
                                res();
                            });
                        } else {
                            res();
                        }
                    }).then(() => {
                        if (vault.loaded && connections.success) {
                            try {
                                this.route(this.app, this.controllerTypes);
                            } catch (e) {
                                reject(e);
                                return undefined;
                            }

                            if (!httpsOptions) {
                                this.server = this.app.listen(this.app.get(PORT), async () => {
                                    this.banner(connections.data).then(() => {
                                        resolve();
                                    }).catch(reject);
                                });
                            } else {
                                this.server = https.createServer({
                                    key: httpsOptions.key,
                                    cert: httpsOptions.cert,
                                }, this.app as unknown as http.RequestListener)
                                    .listen(this.app.get(PORT), async () => {
                                        this.banner(connections.data).then(() => {
                                            resolve();
                                        }).catch(reject);
                                    });
                            }
                        } else {
                            this.banner(connections.data).then(() => {
                                reject(new Error('>>> FAILED TO LOAD CONFIGURATION <<<'));
                            }).catch(console.error);
                        }
                    }).catch(reject);
                }).catch(reject);
            }).catch(reject);
        });
    }

    private route(app: Express, controllerTypes: Array<typeof Controller>): void {
        const expressRouter: Router = express.Router();

        app.get(ENDPOINT_HEALTH_CHECK, (_request: ERequest, response: Response) => {
            response.sendStatus(Connections.allConnected() ? HttpStatusCode.OK : HttpStatusCode.BAD_GATEWAY);
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
                    version: `${__moduleInfo.version} (Atlas --dev--)`,
                    description: __moduleInfo.description,
                },
                controllers: controllers,
                servers: servers,
                components: this.options.openApiComponents,
            };
            const doc: OpenAPI = OpenAPIHelper.buildOpenApi(apiDocs);
            app.use(ENDPOINT_OPEN_API, swaggerUiExpress.serve, swaggerUiExpress.setup(doc, { customSiteTitle: __moduleInfo.name }));

            const spec: string = yaml.safeDump(yaml.safeLoad(JSON.stringify(doc), { schema: JSON_SCHEMA }), { schema: DEFAULT_SAFE_SCHEMA });
            app.use(ENDPOINT_API_SPEC, (_req: Request, res: Response) => {
                res.setHeader('Content-Type', MimeType.YAML_from_users);
                res.send(spec);
            });
        }

    }

    public async close(): Promise<void> {
        return new Promise((resolve: Resolution<void>, reject: Rejection) => {
            this.server.close((err: Error) => {
                /* istanbul ignore if */
                if (err) {
                    reject(err);
                }
                Connections.closeAll().then(resolve).catch(reject);
            });
        });
    }
}

export {
    BadRequestError, Controller, DTO, Handler, LogOptions, Method, BadGatewayError, ServerError, PagedResult, Type, Vault, NameValue, StringSet, Rejection, Resolution,
};

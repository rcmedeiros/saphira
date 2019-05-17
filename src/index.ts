import '@rcmedeiros/prototypes';
import bodyParser, { OptionsUrlencoded } from 'body-parser';
import compression from 'compression';  // compresses requests
import cors from 'cors';
import express, { NextFunction, Request, Response, Router } from 'express';
// tslint:disable-next-line: no-implicit-dependencies
import * as core from 'express-serve-static-core';
import figlet from 'figlet';
import fs from 'fs';
import helmet from 'helmet';
import * as http from 'http';
import https from 'https';
import path from 'path';
import prettyHrtime from 'pretty-hrtime';
import swaggerUiExpress from 'swagger-ui-express';
import { URL } from 'url';
import { MSG_HTTP_UNEXPECTED_ERROR } from './constants/messages';
import {
    DEFAULT_HTTP_PORT, DEFAULT_HTTPS_PORT, DEFAULT_PACKAGE, ENDPOINT_HEALTH_CHECK, ENDPOINT_OPEN_API,
    HEADER_X_HRTIME, HEADER_X_PAGINATION, HEADER_X_SUMMARY, UTF8,
} from './constants/settings';
import { Controller, Handler, HandlersByMethod, Method, Type } from './controller/controller';
import { DTO } from './dto/dto';
import { BadGatewayError } from './errors/bad_gateway-error';
import { BadRequestError } from './errors/bad_request-error';
import { HttpError } from './errors/http-error';
import { HttpStatusCode } from './errors/http_status_codes';
import { ServerError } from './errors/server.error';
import { Logger, LogOptions, setupLogging } from './logger';
import { Info, ModuleInfo, OpenAPI, OpenAPIHelper } from './open-api.helper';
import { PagedResult } from './paged_result';
import { UnknownObj } from './unknown-obj';
import { NameValue, Vault } from './vault';

export interface ServerInfo {
    url: URL;
    description: string;
}

interface SSLOptions {
    key?: string;
    keyPath?: string;
    cert?: string;
    certPath?: string;
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
    https?: SSLOptions;
    urlencodedOptions?: OptionsUrlencoded;
    servers?: Array<ServerInfo>;
    concealApiDocs?: boolean;
    openApiComponents?: { [index: string]: unknown };
    corsOptions?: CorsOptions;
    logOptions?: LogOptions;
}

export class Saphira {
    public static readonly PRODUCTION: boolean = (process.env.NODE_ENV || '').toLowerCase() === 'production';

    private readonly app: core.Express;
    private server: http.Server;
    private readonly sslOptions: SSLOptions;

    private moduleInfo: ModuleInfo;

    constructor(controllerTypes: Array<typeof Controller>, options?: SaphiraOptions) {
        if (!options) {
            options = {};
        }

        this.sslOptions = options.https || undefined;
        this.loadModuleInfo();
        setupLogging(options.logOptions);

        this.app = express();
        this.app.set('port', options.port || (options.https ? DEFAULT_HTTPS_PORT : DEFAULT_HTTP_PORT));

        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded(options.urlencodedOptions || { extended: false }));
        this.app.use(bodyParser.raw());
        this.app.use(compression());
        this.app.use(helmet());

        if (!options.corsOptions) {
            options.corsOptions = {};
        }
        if (!options.corsOptions.exposedHeaders) {
            options.corsOptions.exposedHeaders = [HEADER_X_PAGINATION, HEADER_X_SUMMARY, HEADER_X_HRTIME];
        } else {
            if (typeof options.corsOptions.exposedHeaders === 'string') {
                options.corsOptions.exposedHeaders = [options.corsOptions.exposedHeaders];
            }
            [HEADER_X_PAGINATION, HEADER_X_SUMMARY, HEADER_X_HRTIME].forEach((header: string) => {
                if (options.corsOptions.exposedHeaders.indexOf(header) === -1) {
                    (options.corsOptions.exposedHeaders as Array<string>).push(header);
                }
            });
        }

        this.app.use(cors(options.corsOptions));

        const expressRouter: Router = express.Router();

        expressRouter.use(ENDPOINT_HEALTH_CHECK, (_request: Request, response: Response) => {
            response.sendStatus(HttpStatusCode.OK);
        });

        const controllers: Array<Controller> = [];
        controllerTypes.forEach((controller: typeof Controller) => {
            let c: Controller;
            try {
                c = new controller();
            } catch (e) {
                throw new Error((e as Error).message);
            }
            controllers.push(c);
            c.paths.forEach((cPath: string): void => {
                const handlersByMethod: HandlersByMethod = c.getHandler(cPath);
                Object.keys(handlersByMethod).forEach((method: string) => {
                    if (handlersByMethod[method]) {
                        const handler: Handler = handlersByMethod[method];
                        expressRouter[handler.method](cPath, (request: Request, response: Response, next: NextFunction) => {
                            const t: [number, number] = process.hrtime();
                            // tslint:disable-next-line:no-any
                            c.handler(handler, request).then((result: any) => {
                                if (!result || (result && !(result as UnknownObj).handlerRejected)) {
                                    if (// if result is null or empty, send HTTP NO_CONTENT
                                        !result
                                        || (Array.isArray(result) && !result.length)
                                        || ((result as PagedResult<unknown>).pageNumber && !(result as PagedResult<unknown>).entries.length)
                                    ) {
                                        response.sendStatus(
                                            handler.response.type === Type.HttpAccepted ? HttpStatusCode.ACCEPTED
                                                : handler.response.type === Type.HttpCreated ? HttpStatusCode.CREATED
                                                    : HttpStatusCode.NO_CONTENT,
                                        );
                                    } else {
                                        if ((result as PagedResult<unknown>).entriesCount) {
                                            response.setHeader(HEADER_X_PAGINATION, `{Count: ${(result as PagedResult<unknown>).entriesCount},` +
                                                ` Pages: ${(result as PagedResult<unknown>).pagesCount}}`);
                                            result = (result as PagedResult<unknown>).entries;
                                        } else {
                                            // tslint:disable-next-line:no-null-keyword
                                            result = result !== undefined ? result : null;
                                        }
                                        response.setHeader(
                                            HEADER_X_HRTIME, prettyHrtime(process.hrtime(t), { precise: true }).toString().safeReplace('μ', 'u'));
                                        response.json(result);
                                    }
                                }
                            }).catch((err: Error) => {
                                console.error(JSON.stringify(err));
                                const code: number = (err as HttpError).status ? (err as HttpError).status : HttpStatusCode.INTERNAL_SERVER_ERROR;

                                if (code >= HttpStatusCode.INTERNAL_SERVER_ERROR && process.env.NODE_ENV && Saphira.PRODUCTION) {
                                    response.status(code).json({ error: MSG_HTTP_UNEXPECTED_ERROR });
                                } else {
                                    response.status(code).json({ message: err.message, stack: err.stack });
                                }
                            }).then(next).catch((err: Error) => console.error({ err }));
                        });
                    }
                });
            });
        });

        this.app.use(expressRouter);

        let servers: Array<ServerInfo>;

        if (options.servers) {
            servers = options.servers;
        } else {
            const port: number = this.app.get('port') as number;
            const strPort: string =
                (options.https && (port === DEFAULT_HTTPS_PORT)) || (!options.https && (port === DEFAULT_HTTP_PORT)) ? '' : port.toString();
            servers = [{
                url: new URL(`http${options.https ? 's' : ''}://localhost:${strPort}/api`), description: 'Local Server',
            }];
        }

        if (!(Saphira.PRODUCTION || options.concealApiDocs)) {
            const apiDocs: Info = {
                module: this.moduleInfo,
                servers: servers,
                controllers: controllers,
                components: options.openApiComponents,
            };
            const doc: OpenAPI = OpenAPIHelper.buildOpenApi(apiDocs);
            this.app.use(ENDPOINT_OPEN_API, swaggerUiExpress.serve, swaggerUiExpress.setup(doc));
        }

    }

    private loadModuleInfo(): void {
        const filename: string = path.join(process.cwd(), DEFAULT_PACKAGE);

        const packageJson: Buffer = fs.readFileSync(filename);
        const project: unknown = JSON.parse(packageJson.toString(UTF8));

        this.moduleInfo = {
            name: (project as ModuleInfo).name,
            version: (project as ModuleInfo).version,
            description: (project as ModuleInfo).description,
        };
    }

    private resolveContent(data: { path: string; content: string }): string {
        if (data.path) {
            if (!path.isAbsolute(data.path)) {
                data.path = path.join(process.cwd(), data.path);
            }
            data.content = fs.readFileSync(data.path, UTF8);
        }
        return data.content;
    }

    private banner(afterText?: string): void {

        figlet.text(this.moduleInfo.name, {
            font: 'Star Wars',
            horizontalLayout: 'default',
            verticalLayout: 'default',
        }, (err: Error, data: string) => {
            /* istanbul ignore if */
            if (err) {
                console.error('Figlet failed...', err);
            } else {
                console.info(`${data}\nv${this.moduleInfo.version}\n`);
                /* istanbul ignore else */
                if (afterText) {
                    console.info(afterText);
                }
            }
        });
    }

    public listen = async (): Promise<void> => new Promise<void>((resolve: Function, reject: Function): void => {
        try {
            if (!this.sslOptions) {
                this.server = this.app.listen(this.app.get('port'), () => {
                    this.banner(`Server listening on port ${this.app.get('port')}`);
                    resolve();
                });
            } else {

                this.server = https.createServer({
                    key: this.resolveContent({ path: this.sslOptions.keyPath, content: this.sslOptions.key }),
                    cert: this.resolveContent({ path: this.sslOptions.certPath, content: this.sslOptions.cert }),
                }, this.app).listen(this.app.get('port'), () => {
                    this.banner(`Server listening on port ${this.app.get('port')} (HTTPS)`);
                    resolve();
                });
            }
        } catch (e) {
            /* istanbul ignore next */
            reject(e);
        }

    })

    public async close(): Promise<void> {
        return new Promise((resolve: Function, reject: Function): void => {
            this.server.close((err: Error) => {
                /* istanbul ignore next */
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

export {
    BadRequestError, Controller, DTO, Handler, LogOptions, Method, BadGatewayError, ServerError, NameValue, PagedResult, Type, Vault,
};

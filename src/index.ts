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
import https from 'https';
import path from 'path';
import prettyHrtime from 'pretty-hrtime';
import swaggerUiExpress from 'swagger-ui-express';
import { URL } from 'url';
import { DEFAULTS, ENDPOINTS } from './constants';
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

interface HttpsOptions {
    key: string;
    cert: string;
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

export interface AtlasOptions {
    port?: number;
    https?: HttpsOptions;
    urlencodedOptions?: OptionsUrlencoded;
    servers?: Array<ServerInfo>;
    suppressOpenApi?: boolean;
    openApiComponents?: { [index: string]: unknown };
    corsOptions?: CorsOptions;
    logOptions?: LogOptions;
}

const X_PAGINATION: string = 'x-pagination';
const X_SUMMARY: string = 'x-summary';

export class Saphira {
    public static readonly PRODUCTION: boolean = (process.env.NODE_ENV || '').toLowerCase() === 'production';

    private readonly app: core.Express;
    private readonly httpsOptions: HttpsOptions;
    private readonly logger: Logger;

    private moduleInfo: ModuleInfo;

    constructor(controllerTypes: Array<typeof Controller>, options?: AtlasOptions) {
        this.loadModuleInfo();

        this.logger = setupLogging(options ? options.logOptions : undefined);

        this.httpsOptions = options ? options.https : undefined;
        this.app = express();
        this.app.set('port', options.port || (this.httpsOptions ? DEFAULTS.HTTPS_PORT : DEFAULTS.HTTP_PORT));

        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded(options.urlencodedOptions || { extended: false }));
        this.app.use(bodyParser.raw());
        this.app.use(compression());
        this.app.use(helmet());

        if (!options.corsOptions) {
            options.corsOptions = {
                exposedHeaders: [X_PAGINATION, X_SUMMARY],
            };
        } else if (!options.corsOptions.exposedHeaders) {
            options.corsOptions.exposedHeaders = [X_PAGINATION, X_SUMMARY];
        } else {
            if (typeof options.corsOptions.exposedHeaders === 'string') {
                options.corsOptions.exposedHeaders = [options.corsOptions.exposedHeaders];
            }
            if (options.corsOptions.exposedHeaders.indexOf(X_PAGINATION) === -1) {
                options.corsOptions.exposedHeaders.push(X_PAGINATION);
            }
            if (options.corsOptions.exposedHeaders.indexOf(X_SUMMARY) === -1) {
                options.corsOptions.exposedHeaders.push(X_SUMMARY);
            }
        }

        this.app.use(cors(options.corsOptions));

        const expressRouter: Router = express.Router();

        expressRouter.use(ENDPOINTS.HEALTH_CHECK, (_request: Request, response: Response) => {
            response.sendStatus(HttpStatusCode.OK);
        });

        const controllers: Array<Controller> = [];
        controllerTypes.forEach((controller: typeof Controller) => {
            let c: Controller;
            try {
                c = new controller();
            } catch (e) {
                console.error(e);
                process.exit(1);
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
                                    response.setHeader('handled', 'true');

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
                                            response.setHeader(X_PAGINATION, `{Count: ${(result as PagedResult<unknown>).entriesCount},` +
                                                ` Pages: ${(result as PagedResult<unknown>).pagesCount}}`);
                                            result = (result as PagedResult<unknown>).entries;
                                        } else {
                                            // tslint:disable-next-line:no-null-keyword
                                            result = result !== undefined ? result : null;
                                        }
                                        //
                                        response.json({
                                            result: result,
                                            timeStamp: new Date(),
                                            performance: prettyHrtime(process.hrtime(t), { precise: true }),
                                        });
                                    }
                                }
                            }).catch((err: Error) => {
                                console.error(JSON.stringify(err));
                                const code: number = (err as HttpError).status ? (err as HttpError).status : HttpStatusCode.INTERNAL_SERVER_ERROR;

                                if (code >= HttpStatusCode.INTERNAL_SERVER_ERROR && process.env.NODE_ENV && Saphira.PRODUCTION) {
                                    response.status(code).json({ error: 'An unexpected error has ocurred', timeStamp: new Date() });
                                } else {
                                    response.status(code).json({ error: err, timeStamp: new Date() });
                                }
                            }).then(next).catch((err: Error) => console.error(err));
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
            servers = [{
                url: new URL(`http${options.https ? 's' : ''}://localhost:${options.port}/api`), description: 'Local Server',
            }];
        }

        if (process.env.NODE_ENV === 'production' || !options.suppressOpenApi) {
            const apiDocs: Info = {
                module: this.moduleInfo,
                servers: servers,
                controllers: controllers,
                components: options.openApiComponents,
            };
            const doc: OpenAPI = OpenAPIHelper.buildOpenApi(apiDocs);
            this.app.use(ENDPOINTS.OPEN_API, swaggerUiExpress.serve, swaggerUiExpress.setup(doc));
        }

    }

    private loadModuleInfo(): void {
        let filename: string = 'package.json';

        while (!fs.existsSync(path.join(__dirname, filename))) {
            filename = '../' + filename;
        }

        const packageJson: Buffer = fs.readFileSync(filename);
        const project: unknown = JSON.parse(packageJson.toString('utf-8'));

        this.moduleInfo = {
            name: (project as ModuleInfo).name,
            version: (project as ModuleInfo).version,
            description: (project as ModuleInfo).description,
        };
    }

    private banner(afterText?: string): void {

        figlet.text(this.moduleInfo.name, {
            font: 'Star Wars',
            horizontalLayout: 'default',
            verticalLayout: 'default',
        }, (err: Error, data: string) => {
            if (err) {
                this.logger.error('Figlet failed...', err);
                console.error('Figlet failed...', err);
            } else {
                console.info(`..::## ${this.moduleInfo.name.toUpperCase()}##::..\nv${this.moduleInfo.version}\n`);
                this.logger.info(`${data}\nv${this.moduleInfo.version}\n`);
                if (afterText) {
                    this.logger.info(afterText);
                    console.info(afterText);
                }
            }
        });
    }

    public listen = async (): Promise<void> =>
        new Promise<void>((resolve: Function): void => {

            if (!this.httpsOptions) {
                this.app.listen(this.app.get('port'), () => {
                    this.banner(`Server listening on port ${this.app.get('port')}`);
                    resolve();
                });
            } else {
                https.createServer({
                    key: this.httpsOptions.key,
                    cert: this.httpsOptions.cert,
                }, this.app).listen(this.app.get('port'), () => {
                    this.banner(`Server listening on port ${this.app.get('port')} (HTTPS)`);
                    resolve();
                });
            }
        })
}

export {
    BadRequestError, DTO, Handler, LogOptions, Method, BadGatewayError, ServerError, NameValue, PagedResult, Type, Vault,
};

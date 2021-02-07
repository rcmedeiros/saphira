import '@rcmedeiros/prototypes';

import { DataTypes, Type } from '../data-types';

import { BadRequestError } from '../errors/bad_request-error';
import { ConcreteDTO } from '../dto/dto';
import { JWT } from '../';
import { PAYLOAD } from '../constants/settings';
import { Request } from 'express';
import { Resolution } from '../types';
import { UnknownObj } from './unknown-obj';
import { v4 } from 'uuid';

export interface Param {
    name?: string;
    type: Type;
    dto?: ConcreteDTO;
    required?: boolean;
    path?: boolean;
    ignore?: Array<string>; // FIXME: Fast & lazy solution. Can be calculated.
    parentPath?: boolean;
    description?: string;
    example?: unknown;
    reference?: string;
}

export interface Response {
    type: Type;
    reference?: string;
    description?: string;
}

export interface ServiceTag {
    description: string;
    externalDocs?: { description: string; url: string };
}

interface EndpointTag {
    summary: string;
    description?: string;
}

export enum Method {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
    PATCH = 'patch',
    DELETE = 'delete',
    HEAD = 'head',
    OPTIONS = 'options',
    TRACE = 'trace',
}

interface SystemRestriction {
    systems?: string | Array<string>;
}

export interface Handler {
    tag?: EndpointTag;
    uuid?: string;
    method: Method;
    // eslint-disable-next-line @typescript-eslint/ban-types
    action: Function;
    payload?: Param;
    params?: Array<Param>;
    response: Response;
    restricted?: boolean | SystemRestriction;
}

export interface HandlersByMethod {
    [method: string]: Handler;
}

export class Controller {
    private readonly handlers: { [path: string]: HandlersByMethod } = {};
    private readonly apiPath: string;
    private readonly _tag: ServiceTag;
    private _restricted: boolean;

    constructor(apiPath?: string, tag?: ServiceTag) {
        this.apiPath = apiPath || 'api';
        this._tag = tag;
        this._restricted = false;
    }

    protected route(path: string, handler: Handler): void {
        if (handler.params && handler.payload) {
            throw new Error("Declare either a payload, or it's params. Can't have both");
        } else {
            if (handler.payload) {
                if (
                    [Type.Object, Type.ObjectArray, Type.StringArray, Type.NumberArray].indexOf(
                        handler.payload.type,
                    ) === -1
                ) {
                    throw new Error(`Payload must be either an object or an array`);
                } else if ([Method.POST, Method.PUT].indexOf(handler.method) === -1) {
                    throw new Error(`Cannot ${handler.method.toUpperCase()} with a body payload`);
                }
                handler.params = [handler.payload];
                handler.params[0].name = PAYLOAD;
            }

            if ((handler.params !== undefined ? handler.params.length : 0) === handler.action.length) {
                const paths: Array<string> = [
                    `/${this.apiPath}/${this.constructor.name.charAt(0).toLowerCase()}` +
                        `${this.constructor.name.substring(1)}${
                            path !== '' ? `/${path.charAt(0).toLowerCase()}${path.substring(1)}` : ''
                        }`,
                ];
                let parentPathParameter: string;
                if (handler.params) {
                    handler.params.forEach((parameter: Param) => {
                        if (!parameter.name) {
                            throw new Error(`Missing parameter name`);
                        } else if (
                            [Type.HttpAccepted, Type.HttpCreated, Type.HttpModified].indexOf(parameter.type) !== -1
                        ) {
                            throw new Error(`${parameter.type} is not a valid parameter type`);
                        } else {
                            if (parameter.path) {
                                paths.push(`${paths.last()}/:${parameter.name}`);
                                paths.shift();
                            } else if (parameter.parentPath) {
                                if (!parentPathParameter) {
                                    paths.push(
                                        `/${this.apiPath}/${this.constructor.name}/:${parameter.name}${
                                            path !== '' ? `/${path}` : ''
                                        }`,
                                    );
                                    paths.shift();
                                    parentPathParameter = parameter.name;
                                } else {
                                    throw new Error(
                                        `Only one path parameter allowed between. ${parentPathParameter} and ${parameter.name} are conflicting`,
                                    );
                                }
                            }
                            if (!parameter.ignore) {
                                parameter.ignore = [];
                            } else {
                                // FIXME: This should be calculated, not declared
                                for (let i: number = 0; i < parameter.ignore.length; i++) {
                                    parameter.ignore[i] = parameter.ignore[i].toLowerCase();
                                }
                            }
                        }
                    });
                }
                handler.uuid = v4();

                if (handler.restricted) {
                    this._restricted = true;

                    handler.restricted =
                        typeof handler.restricted !== 'boolean' && !Array.isArray(handler.restricted?.systems)
                            ? { systems: [handler.restricted.systems] }
                            : handler.restricted;
                }

                paths.forEach((p: string) => {
                    this.handlers[p] = this.handlers[p] || {};

                    if (!this.handlers[p][handler.method]) {
                        this.handlers[p][handler.method] = handler;
                    } else {
                        throw new Error(`The route for ${handler.method.toUpperCase()} ${p} is already handled`);
                    }
                });
            } else {
                throw new Error('The operation and its method must declare the same parameters');
            }
        }
    }

    public get restricted(): boolean {
        return this._restricted;
    }

    public get paths(): Array<string> {
        return Object.keys(this.handlers);
    }

    public getHandler(path: string): HandlersByMethod {
        return this.handlers[path];
    }

    public get tag(): ServiceTag {
        return this._tag;
    }

    public handle = async (route: Handler, request: Request): Promise<unknown> =>
        new Promise<unknown>((resolve: Resolution<unknown>, reject: (reason: unknown) => void): void => {
            let jwt: JWT;
            if (route.restricted) {
                try {
                    jwt = new JWT(request.headers.authorization);

                    if (typeof route.restricted !== 'boolean') {
                        jwt.tryForSubjects(route.restricted.systems as Array<string>);
                    }
                } catch (e) {
                    reject(e);
                    return;
                }
            }

            if (!route.params) {
                (route.action.apply(this) as Promise<unknown>).then((result: unknown) => {
                    resolve(result);
                }, reject);
            } else {
                const args: Array<unknown> = [];

                if (
                    route.params.every((param: Param) => {
                        const v: unknown =
                            param.name == PAYLOAD
                                ? request.body
                                : param.path || param.parentPath
                                ? (request.params as UnknownObj)[param.name]
                                : route.method === Method.GET ||
                                  route.method === Method.HEAD ||
                                  route.method === Method.DELETE
                                ? (request.query as UnknownObj)[param.name]
                                : (request.body as UnknownObj)[param.name];
                        // eslint-disable-next-line no-null/no-null
                        if (v === null || v === undefined || v === '') {
                            if (param.required) {
                                reject(new BadRequestError(`${param.name} is required`));
                                return false;
                            } else {
                                args.push(undefined);
                                return true;
                            }
                        } else if (
                            param.ignore &&
                            v.toString &&
                            param.ignore.indexOf(v.toString().toLocaleLowerCase()) >= 0
                        ) {
                            resolve({ rejectedByHandler: 'FALSE_PATH_PARAM' });
                        } else {
                            try {
                                args.push(DataTypes.get(param.type).digest(v, param.dto));
                                return true;
                            } catch {
                                reject(new BadRequestError(`${param.name} should be of type ${param.type}`));
                                return false;
                            }
                        }
                    })
                ) {
                    (route.action.apply(this, args) as Promise<unknown>).then((result: unknown) => {
                        resolve(result);
                    }, reject);
                }
            }
        });
}

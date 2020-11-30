import '@rcmedeiros/prototypes';
import { Request } from 'express';
import { v4 } from 'uuid';
import { DataTypes, Type } from '../data-types';
import { BadRequestError } from '../errors/bad_request-error';
import { UnknownObj } from './unknown-obj';

export interface Param {
    name: string;
    type: Type;
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

export interface Handler {
    tag?: EndpointTag;
    uuid?: string;
    method: Method;
    action: Function;
    params?: Array<Param>;
    response: Response;
}

export interface HandlersByMethod {
    [method: string]: Handler;
}

export class Controller {

    private readonly handlers: { [path: string]: HandlersByMethod } = {};
    private readonly apiPath: string;
    private readonly _tag: ServiceTag;

    constructor(apiPath?: string, tag?: ServiceTag) {
        this.apiPath = apiPath || 'api';
        this._tag = tag;
    }

    protected route(path: string, handler: Handler): void {
        if ((handler.params !== undefined ? handler.params.length : 0) === handler.action.length) {
            const paths: Array<string> = [`/${this.apiPath}/${this.constructor.name}${path !== '' ? '/' + path : ''}`];
            let parentPathParameter: string;
            if (handler.params) {
                handler.params.forEach((parameter: Param) => {
                    if ([Type.HttpAccepted, Type.HttpCreated, Type.HttpModified].indexOf(parameter.type) === -1) {
                        if (parameter.path) {
                            paths.push(`${paths.last()}/:${parameter.name}`);
                            paths.shift();
                        } else if (parameter.parentPath) {
                            if (!parentPathParameter) {
                                paths.push(`/${this.apiPath}/${this.constructor.name}/:${parameter.name}${path !== '' ? '/' + path : ''}`);
                                paths.shift();
                                parentPathParameter = parameter.name;
                            } else {
                                throw new Error(`Only one path parameter allowed between. ${parentPathParameter} and ${parameter.name} are conflicting`);
                            }
                        }
                        if (!parameter.ignore) {
                            parameter.ignore = [];
                        } else { // FIXME: This should be calculated, not declared
                            for (let i: number = 0; i < parameter.ignore.length; i++) {
                                parameter.ignore[i] = parameter.ignore[i].toLowerCase();
                            }
                        }
                    } else {
                        throw new Error(`${parameter.type} is not a valid parameter type`);
                    }
                });
            }
            handler.uuid = v4();

            paths.forEach((p: string) => {
                this.handlers[p] = this.handlers[p] || {};

                if (!this.handlers[p][handler.method]) {
                    this.handlers[p][handler.method] = handler;
                } else {
                    throw new Error(`The route for ${(handler.method.toUpperCase())} ${p} is already handled`);
                }
            });
        } else {
            throw new Error('The operation and its method must declare the same parameters');
        }
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
        new Promise<unknown>((resolve: Function, reject: (reason: unknown) => void): void => {

            if (!route.params) {
                (route.action.apply(this) as Promise<unknown>).then((result: unknown) => {
                    resolve(result);
                }, reject);
            } else {
                const args: Array<unknown> = [];

                if (route.params.every((param: Param) => {
                    const v: unknown = param.path || param.parentPath ? (request.params as UnknownObj)[param.name]
                        : route.method === Method.GET || route.method === Method.DELETE ? (request.query as UnknownObj)[param.name]
                            : (request.body as UnknownObj)[param.name];
                    if (v === null || v === undefined || v === '') {
                        if (param.required) {
                            reject(new BadRequestError(param.name + ' is required'));
                            return false;
                        } else {
                            args.push(undefined);
                            return true;
                        }
                    } else if (param.ignore && param.ignore.indexOf((v as string).toString().toLocaleLowerCase()) >= 0) {
                        resolve({ rejectedByHandler: 'FALSE_PATH_PARAM' });
                    } else {

                        try {
                            args.push(DataTypes.get(param.type).digest(v));
                            return true;
                        } catch {
                            reject(new BadRequestError(`${param.name} should be of type ${param.type}`));
                            return false;
                        }
                    }
                })) {
                    (route.action.apply(this, args) as Promise<unknown>).then((result: unknown) => {
                        resolve(result);
                    }, reject);
                }
            }
        })
}

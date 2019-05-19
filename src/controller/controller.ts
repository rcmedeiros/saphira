import '@rcmedeiros/prototypes';
import { Request } from 'express';
import v4 from 'uuid/v4';
import { BadRequestError } from '../errors/bad_request-error';
import { HttpError } from '../errors/http-error';
import { ServerError } from '../errors/server.error';
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

export enum Type {
    Base64 = 'Base64',
    Binary = 'Binary',
    Boolean = 'Boolean',
    Date = 'Date',
    DateTime = 'DateTime',
    HttpAccepted = 'Http202',
    HttpCreated = 'Http201',
    HttpModified = 'Http204',
    Number = 'Number',
    NumberArray = 'NumberArray',
    Object = 'Object',
    ObjectArray = 'ObjectArray',
    Password = 'Password',
    String = 'String',
    StringArray = 'StringArray',
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
                    if (parameter.path) {
                        paths.push(`${paths.last()}/:${parameter.name}`);
                        paths.shift();
                    } else if (parameter.parentPath) {
                        if (!parentPathParameter) {
                            paths.push(`/${this.apiPath}/${this.constructor.name}/:${parameter.name}${path !== '' ? '/' + path : ''}`);
                            paths.shift();
                            parentPathParameter = parameter.name;
                        } else {
                            throw new Error(`Only one path parameter allowed between. ${parentPathParameter} and ${parameter.name} are conflicting.`);
                        }
                    }
                    if (!parameter.ignore) {
                        parameter.ignore = [];
                    } else if (parameter.ignore.length) { // FIXME: This should be calculated, not declared
                        for (let i: number = 0; i < parameter.ignore.length; i++) {
                            parameter.ignore[i] = parameter.ignore[i].toLowerCase();
                        }
                    }
                });
            }
            handler.uuid = v4();

            paths.forEach((p: string) => {
                this.handlers[p] = this.handlers[p] || {};

                if (!this.handlers[p][handler.method]) {
                    this.handlers[p][handler.method] = handler;
                } else {
                    throw new Error(`The route for ${(handler.method.toUpperCase())} ${p} is already handled.`);
                }
            });
        } else {
            throw new Error('The number of method arguments must match then number of declared parameters.');
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
        new Promise<unknown>((resolve: Function, reject: Function): void => {

            if (!route.params) {
                (route.action.apply(this) as Promise<unknown>).then((result: unknown) => {
                    resolve(result);
                }).catch((err: Error) => {
                    reject(new ServerError(err));
                });
            } else {
                const args: Array<unknown> = [];

                if (route.params.every((param: Param) => {
                    const v: unknown = param.path || param.parentPath ? (request.params as UnknownObj)[param.name]
                        : route.method === Method.GET || route.method === Method.DELETE ? (request.query as UnknownObj)[param.name]
                            : (request.body as UnknownObj)[param.name];
                    if (v === null || v === undefined) {
                        if (param.required) {
                            reject(param.name + ' is required');
                            return false;
                        } else {
                            args.push(undefined);
                            return true;
                        }
                    } else if (param.ignore && param.ignore.indexOf((v as string).toString().toLocaleLowerCase()) >= 0) {
                        resolve({ handlerRejected: 'FALSE_PATH_PARAM' });
                    } else {
                        let invalid: boolean = false;
                        let failedParsing: boolean = false;
                        switch (param.type) {
                            case Type.StringArray: {
                                if (typeof v === 'string') {
                                    args.push(v.split(','));
                                    return true;
                                } else if (typeof v === 'object' && v.constructor === Array
                                    && (v as Array<unknown>).every((e: unknown) => typeof e === 'string')) {
                                    args.push(v);
                                    return true;
                                } else {
                                    invalid = true;
                                }
                                break;
                            }
                            case Type.NumberArray: {
                                const x: Array<number> = [];
                                if (typeof v === 'object' && v.constructor === Array) {
                                    invalid = !((v as Array<number>).every((e: unknown) => {
                                        if (typeof e === 'number') {
                                            x.push(e);
                                            return true;
                                        } else if (typeof e === 'string' && e.isNumeric()) {
                                            try {
                                                x.push(parseFloat(e));
                                                return true;
                                            } catch {
                                                failedParsing = true;
                                                return false;
                                            }
                                        } else {
                                            return false;
                                        }
                                    }));
                                } else if (typeof v === 'string') {
                                    const w: Array<string> = v.split(',');
                                    invalid = !(w.every((e: string) => {
                                        if (e.isNumeric()) {
                                            x.push(parseFloat(e));
                                            return true;
                                        } else {
                                            return false;
                                        }
                                    }));
                                } else {
                                    return false;
                                }
                                if (!invalid) {
                                    args.push(x);
                                    return true;
                                }
                                break;
                            }
                            case Type.Object: {
                                if (typeof v === 'object' && v.constructor === Object) {
                                    args.push(v);
                                    return true;
                                } else if (typeof v === 'string') {
                                    try {
                                        args.push(JSON.parse(v) as object);
                                        return true;
                                    } catch {
                                        failedParsing = true;
                                        invalid = true;
                                    }
                                } else {
                                    invalid = true;
                                }
                                break;
                            }
                            case Type.ObjectArray: {
                                let w: Array<object> = [];
                                if (typeof v === 'object' && v.constructor === Array) {
                                    invalid = !((v as Array<unknown>).every((e: unknown) => {
                                        if (typeof e === 'string') {
                                            try {
                                                w.push(JSON.parse(e) as object);
                                            } catch {
                                                failedParsing = true;
                                                return false;
                                            }
                                            return true;
                                        } else if (typeof e === 'object' && e.constructor === Object) {
                                            args.push(v);
                                            return true;
                                        } else {
                                            return false;
                                        }
                                    }));
                                } else if (typeof v === 'string') {
                                    try {
                                        w = v.firstChar() !== '[' && v.lastChar() !== ']'
                                            ? JSON.parse(`[${v}]`) as Array<object>
                                            : JSON.parse(v) as Array<object>;
                                    } catch {
                                        invalid = true;
                                        failedParsing = true;
                                    }
                                } else {
                                    invalid = true;
                                }
                                if (!invalid) {
                                    args.push(w);
                                    return true;
                                }
                                break;
                            }
                            case Type.Date:
                            case Type.DateTime: {
                                const n: number = typeof v === 'string' ? Date.parse(v) : v as number;
                                invalid = isNaN(n);
                                if (!invalid) {
                                    args.push(new Date(n));
                                    return true;
                                }
                                break;
                            }
                            case Type.String:
                            case Type.Password:
                            case Type.Base64:
                            case Type.Binary: {
                                if (typeof v === 'string') {
                                    args.push(v);
                                    return true;
                                } else {
                                    invalid = true;
                                }
                                break;
                            }
                            case Type.Number: {
                                if (typeof v === 'string' && v.isNumeric()) {
                                    args.push(parseFloat(v));
                                    return true;
                                } else if (typeof v === 'number') {
                                    args.push(v);
                                    return true;
                                } else {
                                    invalid = true;
                                }
                                break;
                            }
                            case Type.Boolean: {
                                if (typeof v === 'string') {
                                    switch (v.toLowerCase()) {
                                        case 'true':
                                        case '1':
                                            args.push(true);
                                            return true;
                                        case 'false':
                                        case '0':
                                            args.push(false);
                                            return true;
                                        default:
                                            invalid = true;
                                    }
                                } else if (typeof v === 'boolean') {
                                    args.push(v);
                                    return true;
                                } else {
                                    invalid = true;
                                }
                                break;
                            }
                            case Type.HttpCreated:
                            case Type.HttpModified:
                            case Type.HttpAccepted: {
                                invalid = true;
                                break;
                            }
                            default:
                                invalid = typeof v !== param.type;
                        }

                        if (invalid) {
                            reject(new BadRequestError(`'${param.name}' should be of type '${param.type}'`));
                            return false;
                        }
                    }
                })) {
                    (route.action.apply(this, args) as Promise<unknown>).then((result: unknown) => {
                        resolve(result);
                    }).catch((err: Error) => {
                        console.error(err);
                        reject((err as HttpError).status ? err : new ServerError(err));
                    });
                }
            }
        })
}

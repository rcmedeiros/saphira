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
    NumberArray = 'NumberArray',
    StringArray = 'StringArray',
    Object = 'Object',
    ObjectArray = 'ObjectArray',
    Boolean = 'Boolean',
    Number = 'Number',
    String = 'String',
    Date = 'Date',
    DateTime = 'DateTime',
    Password = 'Password',
    Base64 = 'Base64',
    Binary = 'Binary',
    HttpCreated = 'Http201',
    HttpAccepted = 'Http202',
    HttpModified = 'Http204',
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

                if (request.headers['content-type'] && request.headers['content-type'].includes('application/json')) {
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
                            switch (param.type) {
                                case Type.StringArray: {
                                    if (typeof v === 'object' && v.constructor === Array
                                        && (v as Array<unknown>).every((e: unknown) => typeof e === 'string')) {
                                        args.push(v);
                                        return true;
                                    } else {
                                        invalid = true;
                                    }
                                    break;
                                }
                                case Type.NumberArray: {
                                    if (typeof v === 'object' && v.constructor === Array
                                        && (v as Array<unknown>).every((e: unknown) => typeof e === 'number')) {
                                        args.push(v);
                                        return true;
                                    } else {
                                        invalid = true;
                                    }
                                    break;
                                }
                                case Type.Object: {
                                    if (typeof v === 'object' && v.constructor === Object) {
                                        args.push(v);
                                        return true;
                                    } else {
                                        invalid = true;
                                    }
                                    break;
                                }
                                case Type.ObjectArray: {
                                    if (typeof v === 'object' && v.constructor === Array
                                        && (v as Array<unknown>).every((e: unknown) =>
                                            typeof e === 'object' && e.constructor === Object)) {
                                        args.push(v);
                                        return true;
                                    } else {
                                        invalid = true;
                                    }
                                    break;
                                }
                                case Type.Date:
                                case Type.DateTime: {
                                    if (typeof v === 'string') {

                                        // assure string is UTC if GMT not specified
                                        const j2: string = v + (v.indexOf('+') < 0 && v.indexOf('-', 10) < 0 && v.indexOf('Z', 10) < 0 ? 'Z' : '');
                                        const n: number = Date.parse(j2);
                                        invalid = isNaN(n);
                                        if (!invalid) {
                                            args.push(new Date(n));
                                            return true;
                                        }
                                        break;
                                    } else {
                                        invalid = true;
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
                                    if (typeof v === 'boolean') {
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
                } else {
                    if (route.params.every((param: Param) => {
                        const v: string = param.path || param.parentPath
                            ? (request.params as UnknownObj)[param.name] as string
                            : route.method === Method.GET || route.method === Method.DELETE
                                ? (request.query as UnknownObj)[param.name] as string
                                : (request.body as UnknownObj)[param.name] as string;
                        if (v === null || v === undefined) {
                            if (param.required) {
                                reject(param.name + ' is required');
                                return false;
                            } else {
                                args.push(undefined);
                                return true;
                            }
                        } else if (param.ignore && param.ignore.indexOf(v.toString().toLocaleLowerCase()) >= 0) {
                            resolve({ handlerRejected: 'FALSE_PATH_PARAM' });
                        } else {
                            let invalid: boolean = false;
                            let failedParsing: boolean = false;
                            switch (param.type) {
                                case Type.StringArray:
                                    try {
                                        args.push(v.split(','));
                                        return true;
                                    } catch (e) {
                                        return false;
                                    }
                                case Type.NumberArray: {
                                    try {
                                        const a: Array<string> = v.split(',');
                                        const b: Array<number> = [];
                                        a.forEach((e: string) => { b.push(parseFloat(e)); });
                                        args.push(b);
                                        return true;
                                    } catch (e) {
                                        return false;
                                    }
                                }
                                case Type.Object: {
                                    let o: object;
                                    try {
                                        o = JSON.parse(v) as object;
                                    } catch (e) {
                                        invalid = true;
                                        failedParsing = true;
                                    }
                                    try {
                                        invalid = typeof o !== 'object' || o.constructor !== Object;
                                        if (!invalid) {
                                            args.push(o);
                                            return true;
                                        }
                                    } catch (e) {
                                        invalid = true;
                                    }
                                    break;
                                }
                                case Type.ObjectArray: {
                                    let a: Array<unknown>;
                                    try {
                                        a = JSON.parse(`[${v}]`) as Array<unknown>;
                                    } catch (e) {
                                        invalid = true;
                                        failedParsing = true;
                                    }
                                    try {
                                        invalid = typeof a !== 'object' || a.constructor !== Array;
                                        if (!invalid) {
                                            args.push(a);
                                            return true;
                                        }
                                    } catch (e) {
                                        invalid = true;
                                    }
                                    break;
                                }
                                case Type.Date:
                                case Type.DateTime:
                                    invalid = isNaN(Date.parse(v));
                                    if (!invalid) {
                                        args.push(new Date(v));
                                        return true;
                                    }
                                    break;
                                case Type.String:
                                case Type.Password:
                                case Type.Base64:
                                case Type.Binary:
                                    args.push(v);
                                    return true;
                                case Type.Number:
                                    invalid = !v.isNumeric();
                                    if (!invalid) {
                                        args.push(parseFloat(v));
                                        return true;
                                    }
                                    break;
                                case Type.Boolean:
                                    switch (v.toString().toLowerCase()) {
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
                                    break;
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
                                reject(new BadRequestError(
                                    failedParsing
                                        ? `${param.name}:${param.type} is not a valid JSON object.`
                                        : `'${param.name}' should be of type '${param.type}'`));
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
            }
        })
}

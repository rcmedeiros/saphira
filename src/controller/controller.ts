import '@rcmedeiros/prototypes';
import { Request } from 'express';
import v4 from 'uuid/v4';
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
                        resolve({ handlerRejected: 'FALSE_PATH_PARAM' });
                    } else {
                        switch (param.type) {
                            case Type.StringArray: {
                                if (typeof v === 'string') {
                                    args.push(v.split(','));
                                    return true;
                                } else if (typeof v === 'object' && v.constructor === Array
                                    && (v as Array<unknown>).every((e: unknown) => typeof e === 'string')) {
                                    args.push(v);
                                    return true;
                                }
                                break;
                            }
                            case Type.NumberArray: {
                                let invalid: boolean = false;
                                const x: Array<number> = [];
                                if (typeof v === 'object' && v.constructor === Array) {
                                    invalid = !((v as Array<number>).every((e: unknown) => {
                                        if (typeof e === 'number') {
                                            x.push(e);
                                            return true;
                                        } else if (typeof e === 'string' && e.isNumeric()) {
                                            x.push(parseFloat(e));
                                            return true;
                                        } else {
                                            return false;
                                        }
                                    }));
                                } else if (typeof v === 'string') {
                                    const w: Array<string> = v.strip('[', ']').split(',');
                                    invalid = !(w.every((e: string) => {
                                        if (e.isNumeric()) {
                                            x.push(parseFloat(e));
                                            return true;
                                        } else {
                                            return false;
                                        }
                                    }));
                                } else {
                                    invalid = true;
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
                                } else if (typeof v === 'string' && v.trim().firstChar() === '{') {
                                    try {
                                        args.push(JSON.parse(v) as object);
                                        return true;
                                    } catch {
                                        //
                                    }
                                }
                                break;
                            }
                            case Type.ObjectArray: {
                                let invalid: boolean = false;
                                let w: Array<object> = [];
                                if (typeof v === 'object' && v.constructor === Array) {
                                    invalid = !((v as Array<unknown>).every((e: unknown) => {
                                        if (typeof e === 'string') {
                                            try {
                                                w.push(JSON.parse(e) as object);
                                            } catch {
                                                return false;
                                            }
                                            return true;
                                        } else if (typeof e === 'object' && e.constructor === Object) {
                                            w.push(e);
                                            return true;
                                        } else {
                                            return false;
                                        }
                                    }));
                                } else if (typeof v === 'string') {
                                    try {
                                        const x: string = v.trim();
                                        if (x.firstChar() !== '[' && x.lastChar() !== ']' && x.firstChar() === '{') {
                                            w = JSON.parse(`[${x}]`) as Array<object>;
                                        } else if (x.firstChar() === '[') {
                                            w = JSON.parse(x) as Array<object>;
                                            invalid = !w.every((f: unknown) => typeof f === 'object');
                                        } else {
                                            invalid = true;
                                        }
                                    } catch {
                                        invalid = true;
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
                                let invalid: boolean = false;
                                let d: Date;
                                if (typeof v === 'string') {
                                    if (v.isNumeric() && Number.isInteger(parseFloat(v))) {
                                        d = new Date(parseInt(v));
                                    } else if (v.stripIgnoreCase('-', ':', '.', '+', 'T', 'Z').isNumeric()) {
                                        d = new Date(Date.parse(v));
                                    }
                                } else if (typeof v === 'number' && Number.isInteger(v)) {
                                    d = new Date(v);
                                }

                                invalid = !d || isNaN(d.getTime());
                                if (!invalid) {
                                    args.push(d);
                                    return true;
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
                                }
                                break;
                            }
                            case Type.Boolean: {
                                if (typeof v === 'boolean') {
                                    args.push(v);
                                    return true;
                                } else if (typeof v === 'string') {
                                    switch (v.toLowerCase()) {
                                        case 't': case 'true': case 'y': case 'yes': case '1':
                                            args.push(true);
                                            return true;
                                        case 'f': case 'false': case 'n': case 'no': case '0':
                                            args.push(false);
                                            return true;
                                        default:
                                    }
                                }
                                break;
                            }
                            default: {
                                if (typeof v === 'string') {
                                    args.push(v);
                                    return true;
                                }
                            }

                        }

                        reject(new BadRequestError(`${param.name} should be of type ${param.type}`));
                        return false;

                    }
                })) {
                    (route.action.apply(this, args) as Promise<unknown>).then((result: unknown) => {
                        resolve(result);
                    }, reject);
                }
            }
        })
}

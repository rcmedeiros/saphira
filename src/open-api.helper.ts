import { Controller, Handler, HandlersByMethod, Method, Param, ServiceTag } from './controller/controller';

import { PAYLOAD } from './constants/settings';
import { Type } from './data-types';
import { URL } from 'url';

export interface ModuleInfo {
    name: string;
    version: string;
    description: string;
}

export interface Info {
    module: ModuleInfo;
    license?: string;
    servers: Array<{
        url: URL;
        description: string;
    }>;
    controllers: Array<Controller>;
    components?: { [index: string]: unknown };
}

interface Tag {
    name: string;
    description?: string;
    externalDocs?: {
        description: string;
        url: string;
    };
}

interface SchemaProperties {
    $ref?: string;
    type?: string;
    example?: unknown;
    items?: SchemaProperties;
}
interface Response {
    description?: string;
    content?: {
        'application/json': {
            schema?: {
                type?: string;
                properties?: { [index: string]: SchemaProperties };
            };
        };
    };
}
interface Responses {
    [code: string]: Response | { $ref: string };
}
interface Parameter {
    in: string;
    name: string;
    schema: SchemaType;
    required?: boolean;
    description?: string;
    example?: unknown;
    style?: ParameterStyle;
    explode?: boolean;
    allowReserved?: boolean;
}

enum ParameterStyle {
    simple = 'simple',
    form = 'form',
    label = 'label',
    matrix = 'matrix',
    pipeDelimited = 'pipeDelimited',
    spaceDelimited = 'spaceDelimited',
    deepObject = 'deepObject',
}
interface SchemaType {
    type?: string;
    format?: string;
    items?: SchemaType;
    example?: unknown;
    $ref?: string;
}
interface Schema {
    [index: string]: SchemaType;
}
interface Endpoint {
    tags?: Array<string>;
    summary?: string;
    description?: string;
    parameters?: Array<Parameter>;
    requestBody?: {
        required: boolean;
        content: {
            'application/json': {
                schema:
                    | {
                          type: string;
                          properties: Schema;
                      }
                    | Schema;
            };
            'application/x-www-form-urlencoded'?: {
                schema: {
                    type: string;
                    properties: Schema;
                };
            };
        };
    };
    responses?: Responses;
}

export interface OpenAPI {
    openapi: string;
    info?: {
        version?: string;
        title?: string;
        description?: string;
        license?: { name: string; url: string };
    };
    basePath?: string;
    servers?: Array<{
        url: URL;
        description: string;
    }>;
    tags?: Array<Tag>;
    paths?: {
        [index: string]: {
            get?: Endpoint;
            post?: Endpoint;
            put?: Endpoint;
            patch?: Endpoint;
            delete?: Endpoint;
            head?: Endpoint;
            options?: Endpoint;
            trace?: Endpoint;
        };
    };
    components?: {
        responses?: { [ref: string]: Response };
        securitySchemes?: {
            bearerAuth?: {
                type: string;
                scheme: string;
                bearerFormat: string;
            };
        };
    };
    security?: Array<{
        [name: string]: Array<unknown>;
    }>;
}

interface PathsByHandler {
    [index: string]: Array<Array<string>>;
}

interface Services {
    basePath: string;
    services: Array<ServiceHandlers>;
}

interface Action {
    path: string;
    handler: Handler;
}
interface ServiceHandlers {
    name: string;
    tag: ServiceTag;
    handlers: Array<Handler> | Array<Action>;
}

export class OpenAPIHelper {
    private static getSchemaType(type: Type): SchemaType {
        switch (type) {
            case Type.NumberArray:
                return { type: 'array', items: { type: 'number' } };
            case Type.StringArray:
                return { type: 'array', items: { type: 'string' } };
            case Type.Object:
                return { type: 'object' };
            case Type.ObjectArray:
                return { type: 'array', items: { type: 'object' } };
            case Type.Boolean:
                return { type: 'boolean' };
            case Type.Number:
                return { type: 'number' };
            case Type.Date:
                return { type: 'string', format: 'date' };
            case Type.DateTime:
                return { type: 'string', format: 'date-time' };
            case Type.Password:
                return { type: 'string', format: 'password' };
            // case Type.Base64:
            //     return { type: 'string', format: 'byte' };
            // case Type.Binary:
            //     return { type: 'string', format: 'binary' };
            default:
                return { type: 'string' };
        }
    }

    private static getResponseType(type: Type): string {
        switch (type) {
            // FIXME: Schemas with 'type: array', require a sibling 'items: ' field
            case Type.NumberArray:
            case Type.StringArray:
            case Type.ObjectArray:
            case Type.Object:
                return 'object';
            case Type.Boolean:
                return 'boolean';
            case Type.Number:
                return 'number';
            default:
                return 'string';
        }
    }

    private static getServicesHierarchy(controllers: Array<Controller>): Services {
        const parts: PathsByHandler = {};
        const handlers: { [index: string]: Handler } = {};
        const services: Array<ServiceHandlers> = [];
        // deconstruct to reconstruct
        controllers.forEach((controller: Controller) => {
            const service: Array<Handler> = [];
            controller.paths.forEach((controllerPath: string): void => {
                const handlersByMethod: HandlersByMethod = controller.getHandler(controllerPath);
                Object.keys(handlersByMethod).forEach((method: string) => {
                    const handler: Handler = handlersByMethod[method];
                    if (!parts[handler.uuid]) {
                        parts[handler.uuid] = new Array<Array<string>>();
                        handlers[handler.uuid] = handler;
                        service.push(handler);
                    }
                    parts[handler.uuid].push(controllerPath.split('/'));
                });
            });
            services.push({
                name: controller.constructor.name,
                tag: controller.tag,
                handlers: service,
            });
        });

        // consider only the largest of each handler
        const handlerPath: { [index: string]: string } = {};
        Object.keys(parts).forEach((idx: string) => {
            const part: Array<Array<string>> = parts[idx];
            let mostComplete: Array<string>;
            let structure: Array<string>;
            part.forEach((piece: Array<string>) => {
                if (!mostComplete || piece.length > mostComplete.length) {
                    mostComplete = piece;
                }
                if (!structure || piece.length < structure.length) {
                    structure = piece;
                }
            });

            for (let i: number = mostComplete.length - 1; i > 1; i--) {
                if (mostComplete[i].charAt(0) === ':') {
                    mostComplete[i] = `{${mostComplete[i].substring(1)}}`;
                }
            }

            handlerPath[idx] = mostComplete.join('/');
        });

        const result: Services = { basePath: undefined, services: new Array<ServiceHandlers>() };

        services.forEach((serviceHandlers: ServiceHandlers) => {
            if (!result.basePath) {
                const anyPath: string = handlerPath[(serviceHandlers.handlers[0] as Handler).uuid];
                result.basePath = anyPath.slice(0, anyPath.indexOf('/', 2));
            }

            const actions: Array<Action> = [];
            (serviceHandlers.handlers as Array<Handler>).forEach((handler: Handler) => {
                const action: Action = {
                    path: handlerPath[handler.uuid].slice(result.basePath.length),
                    handler: handler,
                };
                actions.push(action);
            });
            serviceHandlers.handlers = actions;
        });

        result.services = services;
        return result;
    }

    public static buildOpenApi(info: Info): OpenAPI {
        const openAPI: OpenAPI = { openapi: '3.0.0' };

        // header
        openAPI.info = {
            version: info.module.version,
            title: info.module.name,
            description: info.module.description || '',
        };

        openAPI.servers = info.servers;

        if (info.license) {
            if (info.license.startsWith('http')) {
                openAPI.info.license = {
                    name: 'SEE LICENSE',
                    url: info.license,
                };
            } else {
                openAPI.info.license = {
                    name: info.license,
                    url: `https://spdx.org/licenses/${info.license}.html`,
                };
            }
        }

        // controllers
        if (info.controllers) {
            const services: Services = OpenAPIHelper.getServicesHierarchy(info.controllers);
            openAPI.tags = [];
            openAPI.paths = {};
            services.services.forEach((service: ServiceHandlers) => {
                // tag new services
                if (!openAPI.tags.length || openAPI.tags.last().name !== service.name) {
                    const newTag: Tag = { name: service.name };
                    if (service.tag) {
                        newTag.description = service.tag.description;
                        if (service.tag.externalDocs) {
                            newTag.externalDocs = service.tag.externalDocs;
                        }
                    }
                    openAPI.tags.push(newTag);
                }

                (service.handlers as Array<Action>).forEach((action: Action) => {
                    const endpoint: Endpoint = {};

                    endpoint.tags = [service.name];
                    endpoint.summary = action.handler.tag ? action.handler.tag.summary : undefined;
                    endpoint.description = action.handler.tag?.description ? action.handler.tag.description : undefined;
                    let requestBody: boolean;
                    switch (action.handler.method) {
                        case Method.POST:
                        case Method.PUT:
                        case Method.PATCH:
                            requestBody = true;
                            break;
                        default:
                            requestBody = false;
                    }

                    if (action.handler.params) {
                        // If expects a body, parameters are actually items in the schema of a single content object
                        if (requestBody) {
                            const schema: Schema = {};
                            action.handler.params.forEach((param: Param) => {
                                // except for path parameters. Those goes separated.
                                if (param.path || param.parentPath) {
                                    endpoint.parameters = endpoint.parameters || [];
                                    endpoint.parameters.push({
                                        in: 'path',
                                        name: param.name,
                                        schema: OpenAPIHelper.getSchemaType(param.type),
                                        required: true,
                                        description: param.description,
                                        example: param.example,
                                    });
                                } else {
                                    if (param.reference) {
                                        schema[param.name] = { $ref: `#/components/schemas/${param.reference}` };
                                    } else {
                                        schema[param.name] = OpenAPIHelper.getSchemaType(param.type);
                                        schema[param.name].example = param.example;
                                    }
                                }
                            });

                            if (schema[PAYLOAD]) {
                                endpoint.requestBody = {
                                    required: true,
                                    content: {
                                        'application/json': {
                                            schema: schema[PAYLOAD] as Schema,
                                        },
                                    },
                                };
                            } else {
                                endpoint.requestBody = {
                                    required: true,
                                    content: {
                                        'application/json': {
                                            schema: {
                                                type: 'object',
                                                properties: schema,
                                            },
                                        },
                                        'application/x-www-form-urlencoded': {
                                            schema: {
                                                type: 'object',
                                                properties: schema,
                                            },
                                        },
                                    },
                                };
                            }
                        } else {
                            endpoint.parameters = [];
                            action.handler.params.forEach((param: Param) => {
                                // SEE: https://swagger.io/docs/specification/serialization/

                                let explode: boolean = undefined;
                                if (param.type === Type.Object) {
                                    explode = true;
                                } else if (param.type === Type.StringArray || param.type === Type.NumberArray) {
                                    explode = false;
                                }
                                endpoint.parameters.push({
                                    in: param.path || param.parentPath ? 'path' : 'query',
                                    name: param.name,
                                    schema: param.reference
                                        ? { $ref: `#/components/schemas/${param.reference}` }
                                        : OpenAPIHelper.getSchemaType(param.type),
                                    required: param.required || param.path || param.parentPath,
                                    description: param.description,
                                    example: param.example,
                                    style: param.type === Type.Object ? ParameterStyle.deepObject : undefined,
                                    explode: explode,
                                    allowReserved: param.type === Type.ObjectArray ? true : undefined,
                                });
                            });
                        }
                    }

                    openAPI.paths[action.path] = openAPI.paths[action.path] || {};

                    endpoint.responses = {};
                    switch (action.handler.response.type) {
                        case Type.HttpCreated:
                            endpoint.responses[201] = action.handler.response.description
                                ? { description: action.handler.response.description }
                                : { $ref: '#/components/responses/HTTP201' };
                            break;
                        case Type.HttpAccepted:
                            endpoint.responses[202] = action.handler.response.description
                                ? { description: action.handler.response.description }
                                : { $ref: '#/components/responses/HTTP202' };
                            break;
                        case Type.HttpModified:
                            endpoint.responses[204] = action.handler.response.description
                                ? { description: action.handler.response.description }
                                : { $ref: '#/components/responses/HTTP204' };
                            break;
                        default:
                            const listOf: string = action.handler.response.type !== Type.ObjectArray ? '' : 'list of ';
                            const responseSchema: Record<string, unknown> =
                                action.handler.response.type === Type.ObjectArray
                                    ? {
                                          type: 'array',
                                          items: {
                                              $ref: `#/components/schemas/${action.handler.response.reference}`,
                                          },
                                      }
                                    : {
                                          $ref: `#/components/schemas/${action.handler.response.reference}`,
                                      };

                            endpoint.responses[200] = {
                                description:
                                    action.handler.response.description || action.handler.response.reference
                                        ? `Result is ${listOf}${action.handler.response.reference} model`
                                        : 'OK',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                result: !action.handler.response.reference
                                                    ? {
                                                          type: OpenAPIHelper.getResponseType(
                                                              action.handler.response.type,
                                                          ),
                                                      }
                                                    : responseSchema,
                                                timeStamp: { type: 'string', example: '2019-05-07T22:41:39.714Z' },
                                                performance: { type: 'string', example: '2.328301 ms' },
                                            },
                                        },
                                    },
                                },
                            };
                    }
                    endpoint.responses[400] = { $ref: '#/components/responses/HTTP400' };
                    endpoint.responses[500] = { $ref: '#/components/responses/HTTP500' };

                    openAPI.paths[action.path][action.handler.method] = endpoint;
                });
            });
            openAPI.components = info.components || {};
            openAPI.components.responses = openAPI.components.responses || {};
            openAPI.components.responses.HTTP201 = {
                description: 'Created Successfully',
            };
            openAPI.components.responses.HTTP202 = {
                description: 'Asynchronous call accepted',
            };
            openAPI.components.responses.HTTP204 = {
                description: 'Modification successful',
            };
            openAPI.components.responses.HTTP400 = {
                description: 'Bad request',
                content: {
                    'application/json': {
                        schema: {
                            properties: {
                                message: { type: 'string', example: "You've send incorrect data" },
                            },
                        },
                    },
                },
            };
            openAPI.components.responses.HTTP500 = {
                description: 'An unexpected error has occurred',
                content: {
                    'application/json': {
                        schema: {
                            properties: {
                                message: { type: 'string', example: "Cannot read property 'toString' of undefined" },
                                stack: {
                                    type: 'string',
                                    example: `Error: Cannot read property \'toString\' of undefined
    at constructor.handler.route.action.apply.then.catch
    (C:\\...\\src\\controller\\controller.ts:425:70)
    at process._tickCallback (internal/process/next_tick.js:68:7)`,
                                },
                            },
                        },
                    },
                },
            };

            openAPI.components.securitySchemes = {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            };
            openAPI.security = [{ bearerAuth: [] }];

            return openAPI;
        }
    }
}

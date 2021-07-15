import { Controller, Handler } from './controller';
import { ENV_LOG_CALLS, HEADER_X_HRTIME, HEADER_X_PAGINATION, HEADER_X_REQUEST_ID } from '../constants/settings';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { Saphira, safeStringify } from '../';
import { envVarAsString, uuid } from '../helpers';

import { HttpError } from '../errors/http-error';
import { HttpStatusCode } from '../constants/http_status_codes';
import { MSG_HTTP_UNEXPECTED_ERROR } from '../constants/messages';
import { PagedResult } from './paged_result';
import { SaphiraError } from '../errors/saphira-error';
import { Type } from '../data-types';
import { UnknownObj } from './unknown-obj';
import prettyHrtime from 'pretty-hrtime';

export class Responder {
    private static readonly SHOULD_LOG: boolean =
        (!(process.env.NODE_ENV || '').toLowerCase().startsWith('prod') && (process.env.NODE_ENV || '') !== 'test') ||
        !!envVarAsString(ENV_LOG_CALLS);

    /* istanbul ignore next */
    private constructor() {
        // static class
    }

    private static handleByType(handler: Handler, response: Response, result: unknown, t: [number, number]): void {
        switch (handler.response.type) {
            case Type.HttpAccepted:
                response.sendStatus(HttpStatusCode.ACCEPTED);
                if (this.SHOULD_LOG) {
                    console.debug(`==========RESPONSE ${response.getHeader(HEADER_X_REQUEST_ID)}: ACCEPTED`);
                }

                break;
            case Type.HttpCreated:
                response.sendStatus(HttpStatusCode.CREATED);
                if (this.SHOULD_LOG) {
                    console.debug(`==========RESPONSE ${response.getHeader(HEADER_X_REQUEST_ID)}: CREATED`);
                }
                break;
            case Type.HttpModified:
                response.sendStatus(HttpStatusCode.NO_CONTENT);
                if (this.SHOULD_LOG) {
                    console.debug(`==========RESPONSE ${response.getHeader(HEADER_X_REQUEST_ID)}: NO_CONTENT`);
                }
                break;
            default:
                // TODO: Deprecate paged results like this. Use X-Headers instead.
                if (result && (result as PagedResult<unknown>).entriesCount) {
                    response.setHeader(
                        HEADER_X_PAGINATION,
                        `{"count": ${(result as PagedResult<unknown>).entriesCount},` +
                            ` "pages": ${(result as PagedResult<unknown>).pagesCount}}`,
                    );
                    result = (result as PagedResult<unknown>).entries;
                }

                response.setHeader(
                    HEADER_X_HRTIME,
                    prettyHrtime(process.hrtime(t), { precise: true }).toString().safeReplace('μ', 'u'),
                );

                if (result === undefined) {
                    // eslint-disable-next-line no-null/no-null
                    result = null;
                }

                response.json(result);
                if (Responder.SHOULD_LOG) {
                    console.debug(
                        `==========RESPONSE ${response.getHeader(HEADER_X_REQUEST_ID)}\nbody ${safeStringify(
                            response,
                        )}`,
                    );
                }
        }
    }
    public static route(controller: Controller, handler: Handler): RequestHandler {
        return (request: Request, response: Response, next: NextFunction): void => {
            // TODO: Propagate requestId throughout all errors and adapter calls
            const id: string = uuid();
            request.headers[HEADER_X_REQUEST_ID] = id;
            response.setHeader(HEADER_X_REQUEST_ID, id);
            if (Responder.SHOULD_LOG) {
                console.info(
                    `==========REQUEST ${id}\n` +
                        `\t${request.method} ${request.path}\n` +
                        `\theaders: ${JSON.stringify(request.headers, undefined, 2)}\n` +
                        `\tparams: ${JSON.stringify(request.params, undefined, 2)}\n` +
                        `\tquery: ${JSON.stringify(request.query, undefined, 2)}\n` +
                        `\tbody: ${safeStringify(request.body)}`,
                );
            }
            const t: [number, number] = process.hrtime();
            controller
                .handle(handler, request)
                .then((result: unknown) => {
                    if (!result || !(result as UnknownObj).rejectedByHandler) {
                        this.handleByType(handler, response, result, t);
                    }
                })
                .catch((err: Error) => {
                    if ((err as SaphiraError).toJSON) {
                        console.error((err as SaphiraError).toJSON());
                    } else {
                        console.error(err.message ? err.message : JSON.stringify(err));
                    }
                    const code: number = (err as HttpError).status
                        ? (err as HttpError).status
                        : HttpStatusCode.INTERNAL_SERVER_ERROR;
                    const json: unknown =
                        code >= HttpStatusCode.INTERNAL_SERVER_ERROR && Saphira.PRODUCTION
                            ? { message: MSG_HTTP_UNEXPECTED_ERROR }
                            : { message: err.message, stack: err.stack };
                    response.status(code).json(json);
                })
                .then(next)
                .catch(console.error);
        };
    }
}

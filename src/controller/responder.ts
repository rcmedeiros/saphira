import { NextFunction, Request, RequestHandler, Response } from 'express';
import prettyHrtime from 'pretty-hrtime';
import { Saphira } from '../';
import { MSG_HTTP_UNEXPECTED_ERROR } from '../constants/messages';
import { Type } from '../data-types';
import { HttpError } from '../errors/http-error';
import { HttpStatusCode } from '../constants/http_status_codes';
import { Controller, Handler } from './controller';
import { PagedResult } from './paged_result';
import { UnknownObj } from './unknown-obj';
import { HEADER_X_PAGINATION } from '../constants/settings';
import { HEADER_X_HRTIME } from '../constants/settings';

export class Responder {
    /* istanbul ignore next */
    private constructor() {}

    public static route = (controller: Controller, handler: Handler): RequestHandler => (
        request: Request,
        response: Response,
        next: NextFunction,
    ): void => {
        console.debug(`${request.method} ${request.path}`);
        console.debug('headers', request.headers);
        console.debug('params', request.params);
        console.debug('query', request.query);
        console.debug('body', request.body);

        const t: [number, number] = process.hrtime();
        controller
            .handle(handler, request)
            .then((result: unknown) => {
                if (!result || !(result as UnknownObj).rejectedByHandler) {
                    switch (handler.response.type) {
                        case Type.HttpAccepted:
                            response.sendStatus(HttpStatusCode.ACCEPTED);
                            break;
                        case Type.HttpCreated:
                            response.sendStatus(HttpStatusCode.CREATED);
                            break;
                        case Type.HttpModified:
                            response.sendStatus(HttpStatusCode.NO_CONTENT);
                            break;
                        default:
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
                                // tslint:disable-next-line: no-null-keyword
                                result = null;
                            }

                            response.json(result);
                    }
                }

                console.debug('response:', result);
            })
            .catch((err: Error) => {
                console.error(JSON.stringify(err));
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

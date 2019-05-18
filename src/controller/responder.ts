import express, { NextFunction, Request, RequestHandler, Response } from 'express';
import prettyHrtime from 'pretty-hrtime';
import { Saphira } from '../';

import { MSG_HTTP_UNEXPECTED_ERROR } from '../constants/messages';
import { HEADER_X_HRTIME, HEADER_X_PAGINATION } from '../constants/settings';
import { HttpError } from '../errors/http-error';
import { HttpStatusCode } from '../errors/http_status_codes';
import { Controller, Handler, Type } from './controller';
import { PagedResult } from './paged_result';
import { UnknownObj } from './unknown-obj';

export class Responder {

    private constructor() { }

    public static route = (controller: Controller, handler: Handler): RequestHandler =>
        (request: Request, response: Response, next: NextFunction): void => {
            const t: [number, number] = process.hrtime();
            controller.handle(handler, request).then((result: unknown) => {
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
        }
}

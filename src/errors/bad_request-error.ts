import { HttpError } from './http-error';
import { HttpStatusCode } from './http_status_codes';

export class BadRequestError extends HttpError {

    constructor(message?: string) {
        super(HttpStatusCode.BAD_REQUEST, message);
    }
}

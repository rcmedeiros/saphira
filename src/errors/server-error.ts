import { HttpError } from './http-error';
import { HttpStatusCode } from '../constants/http_status_codes';

export class ServerError extends HttpError {

    constructor(err: Error | string) {
        if (typeof err === 'string') {
            super(HttpStatusCode.INTERNAL_SERVER_ERROR, err);
        } else {
            super(HttpStatusCode.INTERNAL_SERVER_ERROR, (err).message || undefined);
        }
    }

}

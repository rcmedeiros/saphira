import { HttpError } from './http-error';
import { HttpStatusCode } from './http_status_codes';

export class BadGatewayError extends HttpError {

    constructor(message?: string) {
        super(HttpStatusCode.BAD_GATEWAY, message);
    }
}

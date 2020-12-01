import { HttpError } from './http-error';
import { HttpStatusCode } from '../constants/http_status_codes';

export class UnauthorizedError extends HttpError {

    constructor(message?: string) {
        super(HttpStatusCode.UNAUTHORIZED, message || 'Forbidden');
    }
}

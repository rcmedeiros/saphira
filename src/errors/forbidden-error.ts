import { HttpError } from './http-error';
import { HttpStatusCode } from '../constants/http_status_codes';

export class ForbiddenError extends HttpError {
    constructor(message?: string) {
        super(HttpStatusCode.FORBIDDEN, message || 'Forbidden');
    }
}

import { SaphiraError } from './saphira-error';
export class HttpError extends SaphiraError {
    public readonly status: number;

    constructor(status: number, message?: string) {
        super(message);
        this.status = status;
    }
}

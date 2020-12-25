import { HttpStatusCode } from '../constants/http_status_codes';
import { NeedleResponse } from 'needle';
import { StringSet } from '../types';

export class WebResponse {
    public httpVersion: string;
    public httpVersionMajor: number;
    public httpVersionMinor: number;
    public complete: boolean;
    public statusCode: number;
    public body: unknown;
    public method: string;
    public url: string;
    public headers: StringSet;

    constructor(response: NeedleResponse) {
        this.httpVersion = response.httpVersion;
        this.httpVersionMajor = response.httpVersionMajor;
        this.httpVersionMinor = response.httpVersionMinor;
        this.complete = response.complete;
        this.statusCode = response.statusCode;
        this.body = response.body;
        this.method = response.method;
        this.url = response.url;
        this.headers = response.headers as StringSet;
    }

    private getError(): Error {
        const result: Error = new Error();
        result.name = `Status code ${this.statusCode}`;
        let b: string = this.body.toString();

        // code bellow just for convenience. Might or might not work
        if (b.contains('<title>Error</title>')) {
            b = b.substringFrom('<body>').substringUpTo('</body>').trim();
        }

        result.message = b;
        return result;
    }

    public okOnly(): WebResponse {
        if (this.statusCode === HttpStatusCode.OK) {
            return this;
        } else {
            throw this.getError();
        }
    }

    public successOnly(): WebResponse {
        if (this.statusCode >= HttpStatusCode.OK && this.statusCode <= HttpStatusCode.PARTIAL_CONTENT) {
            return this;
        } else {
            throw this.getError();
        }
    }
}

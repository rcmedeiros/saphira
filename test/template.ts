
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { HttpResponse } from 'chai-http-ext';
import { HttpStatusCode } from '../src/constants/http_status_codes';
import { URI } from './setup';

chai.use(chaiHttp);

export interface SampleObject {
    name: string;
    age: number;
    surgeBinding: { order: string; bond: string; surges: Array<string> };
}

export interface UnknownPayload {
    [idx: string]: unknown;
}

export interface SamplePayload {
    [idx: string]: unknown;
    a?: boolean;
    b?: Date | string | number;
    c?: Date | string | number;
    d?: number;
    e?: Array<number>;
    f?: SampleObject;
    g?: Array<SampleObject>;
    h?: string;
    i?: string;
    j?: Array<string>;
}

declare type ToFormFunction = (payload: SamplePayload) => string;

const toForm: ToFormFunction = (payload: SamplePayload): string => {
    const newPayload: Array<string> = [];

    Object.keys(payload).forEach((k: string) => {
        if (payload[k] !== undefined) {
            switch (typeof payload[k]) {
                case 'boolean':
                    newPayload.push(`${k}=${payload[k] ? 'true' : 'false'}`);
                    break;
                case 'number':
                    newPayload.push(`${k}=${encodeURIComponent(((payload[k] as number).toString()))}`);
                    break;
                case 'object':
                    switch ((payload[k] as object).constructor) {
                        case Date:
                            newPayload.push(`${k}=${encodeURIComponent((payload[k] as Date).toFormattedString())}`);
                            break;
                        case Array: {
                            const aux: Array<unknown> = payload[k] as Array<unknown>;
                            if (aux.length && typeof aux[0] === 'object' && (aux[0] as {}).constructor !== Date) {
                                newPayload.push(`${k}=${encodeURIComponent(JSON.stringify(payload[k]))}`);
                            } else {
                                const tmp: Array<string> = [];
                                (payload[k] as Array<unknown>).forEach((e: unknown) => {
                                    switch (typeof e) {
                                        case 'object':
                                            tmp.push(encodeURIComponent(JSON.stringify(e)));
                                            break;
                                        case 'number':
                                            tmp.push(encodeURIComponent(e.toString()));
                                            break;
                                        case 'boolean':
                                            tmp.push((e ? 'true' : 'false'));
                                            break;
                                        default:
                                            tmp.push(encodeURIComponent(e as string));
                                    }
                                });
                                newPayload.push(`${k}=${tmp.join(',')}`);
                            }

                            break;
                        }
                        default:
                            newPayload.push(`${k}=${encodeURIComponent(JSON.stringify(payload[k]))}`);
                    }
                    break;
                default:
                    newPayload.push(`${k}=${encodeURIComponent(payload[k] as string)}`);
            }
        }
    });

    return newPayload.join('&');
};

declare type TestSuccessfulGET = (endpoint: string, expected: unknown, description?: string) => Promise<HttpResponse>;
export const testSuccessfulGET: TestSuccessfulGET = async (endpoint: string, expected: unknown, description?: string): Promise<HttpResponse> =>
    new Promise<HttpResponse>((resolve: Function, reject: (reason: unknown) => void): void => {
        chai.request(URI).get(endpoint).end((err: Function, res: HttpResponse) => {
            if (err) { reject(err); } else {
                try {
                    expect(JSON.stringify(res.body), description).to.be.equal(JSON.stringify(expected));
                    expect(res.status >= HttpStatusCode.OK && res.status <= HttpStatusCode.NO_CONTENT).to.be.true;
                    expect(res.header['content-type'], description).to.be
                        .equal(`${res.status === HttpStatusCode.OK ? 'application/json' : 'text/plain'}; charset=utf-8`);
                    expect(res.header['x-high-resolution-elapsed-time'], description).to.not.be.null;
                    resolve(res);
                } catch (e) {
                    reject(e);
                }
            }
        });
    });

export interface TestFailedGETOpts {
    description?: string;
    expectedStatus?: HttpStatusCode;
}

declare type TestFailedGET = (endpoint: string, errorMessage: string, opts?: TestFailedGETOpts | string) => Promise<HttpResponse>;
export const testFailedGET: TestFailedGET = async (endpoint: string, errorMessage: string, opts?: TestFailedGETOpts | string): Promise<HttpResponse> =>
    new Promise<HttpResponse>((resolve: Function, reject: (reason: unknown) => void): void => {

        const options: TestFailedGETOpts = typeof opts === 'string' ? { description: opts, expectedStatus: HttpStatusCode.BAD_REQUEST } : opts;

        chai.request(URI).get(endpoint).end((err: Error, res: HttpResponse) => {
            if (err) { reject(err); } else {
                try {
                    expect((res.body as Error).message, options.description).to.be.equal(errorMessage);
                    expect(res.status, options.description).to.be.equal(options.expectedStatus);
                    expect(res.header['content-type'], options.description).to.be.equal('application/json; charset=utf-8');
                    expect(res.header['x-high-resolution-elapsed-time'], options.description).to.be.undefined;
                    resolve(res);
                } catch (e) {
                    reject(e);
                }
            }
        });
    });

declare type TestSuccessfulPOST = (endpoint: string, payload: SamplePayload | Array<SamplePayload>, expected: unknown, description: string) => Promise<Array<HttpResponse>>;
export const testSuccessfulPOST: TestSuccessfulPOST =
    async (endpoint: string, payload: SamplePayload | Array<SamplePayload>, expected: unknown, description: string): Promise<Array<HttpResponse>> =>
        new Promise<Array<HttpResponse>>((resolve: Function, reject: (r: Error) => void): void => {
            const promises: Array<Promise<HttpResponse>> = [];

            promises.push(new Promise<HttpResponse>((res: Function, rej: Function): void => {
                const type: string = 'application/json';
                chai.request(URI)
                    .post(endpoint)
                    .set('content-type', type)
                    .send(JSON.stringify(payload))
                    .end((err: Error, response: HttpResponse) => {
                        if (err) { rej(err); } else {
                            try {
                                description = `${description} - ${type}`;
                                expect(JSON.stringify(response.body), description).to.be.equal(JSON.stringify(expected));
                                expect(response.status >= HttpStatusCode.OK && response.status <= HttpStatusCode.NO_CONTENT).to.be.true;
                                expect(response.header['content-type'], description).to.be.equal('application/json; charset=utf-8');
                                expect(response.header['x-high-resolution-elapsed-time'], description).to.not.be.null;
                                res(response);
                            } catch (e) {
                                rej(e);
                            }
                        }
                    });
            }));

            if (!description.startsWith('root')) {
                promises.push(new Promise<HttpResponse>((res: Function, rej: Function): void => {
                    const type: string = 'application/x-www-form-urlencoded';
                    chai.request(URI)
                        .post(endpoint)
                        .set('content-type', type)
                        .type('form')
                        .send(payload?.length ? undefined : toForm(payload as SamplePayload))
                        .end((err: Error, response: HttpResponse) => {
                            if (err) { rej(err); } else {
                                try {
                                    description = `${description} - ${type}`;
                                    expect(JSON.stringify(response.body), description).to.be.equal(JSON.stringify(expected));
                                    expect(response.status >= HttpStatusCode.OK && response.status <= HttpStatusCode.NO_CONTENT).to.be.true;
                                    expect(response.header['content-type'], description).to.be.equal('application/json; charset=utf-8');
                                    expect(response.header['x-high-resolution-elapsed-time'], description).to.not.be.null;
                                    res(response);
                                } catch (e) {
                                    rej(e);
                                }
                            }
                        });
                }));
            }

            Promise.all(promises).then((responses: Array<HttpResponse>) => { resolve(responses); }, reject);
        });

export interface TailedPOSTOpts {
    description?: string;
    ignoreForm?: boolean;
}

declare type TestFailedPOST = (endpoint: string, payload: UnknownPayload, errorMessage: string, opts?: TailedPOSTOpts | string) => Promise<Array<HttpResponse>>;
export const testFailedPOST: TestFailedPOST =
    async (endpoint: string, payload: UnknownPayload, errorMessage: string, opts?: TailedPOSTOpts | string): Promise<Array<HttpResponse>> =>
        new Promise<Array<HttpResponse>>((resolve: Function, reject: (e: Error) => void): void => {
            const promises: Array<Promise<HttpResponse>> = [];

            const options: TailedPOSTOpts = typeof opts === 'string' ? { description: opts } : opts;

            promises.push(new Promise<HttpResponse>((res: Function, rej: Function): void => {
                const type: string = 'application/json';
                chai.request(URI)
                    .post(endpoint)
                    .set('content-type', type)
                    .send(JSON.stringify(payload))
                    .end((err: Error, response: HttpResponse) => {
                        if (err) { rej(err); } else {
                            try {
                                options.description = `${options.description} - ${type}`;
                                expect((response.body as Error).message, options.description).to.be.equal(errorMessage);
                                expect(response.status, options.description).to.be.equal(HttpStatusCode.BAD_REQUEST);
                                expect(response.header['content-type'], options.description).to.be.equal('application/json; charset=utf-8');
                                expect(response.header['x-high-resolution-elapsed-time'], options.description).to.be.undefined;
                                res(response);
                            } catch (e) {
                                rej(e);
                            }
                        }
                    });
            }));

            if (options && !options.ignoreForm) {
                promises.push(new Promise<HttpResponse>((res: Function, rej: Function): void => {
                    const type: string = 'application/x-www-form-urlencoded';
                    chai.request(URI)
                        .post(endpoint)
                        .set('content-type', type)
                        .type('form')
                        .send(toForm(payload))
                        .end((err: Error, response: HttpResponse) => {
                            if (err) { rej(err); } else {
                                try {
                                    options.description = `${options.description} - ${type}`;
                                    expect((response.body as Error).message, options.description).to.be.equal(errorMessage);
                                    expect(response.status, options.description).to.be.equal(HttpStatusCode.BAD_REQUEST);
                                    expect(response.header['content-type'], options.description).to.be.equal('application/json; charset=utf-8');
                                    expect(response.header['x-high-resolution-elapsed-time'], options.description).to.be.undefined;
                                    res(response);
                                } catch (e) {
                                    rej(e);
                                }
                            }
                        });
                }));
            }

            Promise.all(promises).then((responses: Array<HttpResponse>) => { resolve(responses); }, reject);
        });

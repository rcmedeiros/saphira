
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
chai.use(chaiHttp)
import { URI } from './setup';
import { HttpStatusCode } from '../src/errors/http_status_codes';

export interface SampleObject {
    name: string;
    age: number;
    surgeBinding: { order: string; bond: string; surges: Array<string> }
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

const toForm = (payload: SamplePayload): string => {
    const newPayload: Array<string> = [];

    Object.keys(payload).forEach((k: string) => {
        if (payload[k] !== undefined) {
            switch (typeof payload[k]) {
                case 'boolean':
                    newPayload.push(`${k}=${payload[k] ? 'true' : 'false'}`)
                    break;
                case 'number':
                    newPayload.push(`${k}=${encodeURIComponent(((payload[k] as number).toString()))}`)
                    break;
                case 'object':
                    switch ((payload[k] as object).constructor) {
                        case Date:
                            newPayload.push(`${k}=${encodeURIComponent((payload[k] as Date).toFormattedString())}`)
                            break;
                        case Array: {
                            const aux: Array<unknown> = payload[k] as Array<unknown>;
                            if (aux.length && typeof aux[0] === 'object' && (aux[0] as Object).constructor !== Date) {
                                newPayload.push(`${k}=${encodeURIComponent(JSON.stringify(payload[k]))}`);
                            } else {
                                const tmp: Array<string> = [];
                                (payload[k] as Array<unknown>).forEach((e: unknown) => {
                                    switch (typeof e) {
                                        case 'object':
                                            tmp.push(encodeURIComponent(JSON.stringify(e)));
                                            break;
                                        case 'number':
                                            tmp.push(encodeURIComponent((e.toString()) as string));
                                            break;
                                        case 'boolean':
                                            tmp.push((e ? 'true' : 'false'));
                                            break;
                                        default:
                                            tmp.push(encodeURIComponent(e as string));
                                            break;
                                    }
                                });
                                newPayload.push(`${k}=${tmp.join(',')}`);
                            }

                            break;
                        }
                        default:
                            newPayload.push(`${k}=${encodeURIComponent(JSON.stringify(payload[k]))}`)
                            break;
                    }
                    break;
                default:
                    newPayload.push(`${k}=${encodeURIComponent(payload[k] as string)}`)
                    break;
            }
        }
    })

    return newPayload.join('&');
}

export function testSuccessfulGET(endpoint: string, expected: unknown, description?: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        chai.request(URI).get(endpoint).end((err, res) => {
            if (err) { reject(err) } else {
                try {
                    expect(JSON.stringify(res.body), description).to.be.equal(JSON.stringify(expected || {}));
                    expect(res.status >= HttpStatusCode.OK && res.status <= HttpStatusCode.NO_CONTENT).to.be.true;
                    expect(res.header['content-type'], description).to.be.equal(`${res.status === HttpStatusCode.OK ? 'application/json' : 'text/plain'}; charset=utf-8`);
                    expect(res.header['x-high-resolution-elapsed-time'], description).to.not.be.null;
                    resolve()
                } catch (e) {
                    reject(e);
                }
            }
        })
    })
}

export interface testFailedGETOpts {
    description?: string;
    expectedStatus?: HttpStatusCode;
}

export function testFailedGET(endpoint: string, errorMessage: string, opts?: testFailedGETOpts | string): Promise<void> {
    return new Promise<void>((resolve, reject) => {

        const options = typeof opts === 'string' ? { description: opts, expectedStatus: HttpStatusCode.BAD_REQUEST } : opts;

        chai.request(URI).get(endpoint).end((err, res) => {
            if (err) { reject(err) } else {
                try {
                    expect(res.body.message, options.description).to.be.equal(errorMessage);
                    expect(res.status, options.description).to.be.equal(options.expectedStatus);
                    expect(res.header['content-type'], options.description).to.be.equal('application/json; charset=utf-8');
                    expect(res.header['x-high-resolution-elapsed-time'], options.description).to.be.undefined;
                    resolve()
                } catch (e) {
                    reject(e);
                }
            }
        })
    })
}

export function testSuccessfulPOST(endpoint: string, payload: SamplePayload, expected: unknown, description?: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const promises: Array<Promise<void>> = [];

        promises.push(new Promise<void>((res: Function, rej: Function): void => {
            const type: string = 'application/json';
            chai.request(URI)
                .post(endpoint)
                .set('content-type', type)
                .send(JSON.stringify(payload))
                .end((err, response) => {
                    if (err) { rej(err) } else {
                        try {
                            description = `${description} - ${type}`;
                            expect(JSON.stringify(response.body), description).to.be.equal(JSON.stringify(expected));
                            expect(response.status >= HttpStatusCode.OK && response.status <= HttpStatusCode.NO_CONTENT).to.be.true;
                            expect(response.header['content-type'], description).to.be.equal('application/json; charset=utf-8');
                            expect(response.header['x-high-resolution-elapsed-time'], description).to.not.be.null;
                            res()
                        } catch (e) {
                            rej(e);
                        }
                    }
                })
        }));

        promises.push(new Promise<void>((res: Function, rej: Function): void => {
            const type: string = 'application/x-www-form-urlencoded';
            chai.request(URI)
                .post(endpoint)
                .set('content-type', type)
                .type('form')
                .send(toForm(payload))
                .end((err, response) => {
                    if (err) { rej(err) } else {
                        try {
                            description = `${description} - ${type}`;
                            expect(JSON.stringify(response.body), description).to.be.equal(JSON.stringify(expected));
                            expect(response.status >= HttpStatusCode.OK && response.status <= HttpStatusCode.NO_CONTENT).to.be.true;
                            expect(response.header['content-type'], description).to.be.equal('application/json; charset=utf-8');
                            expect(response.header['x-high-resolution-elapsed-time'], description).to.not.be.null;
                            res()
                        } catch (e) {
                            rej(e);
                        }
                    }
                })
        }));

        return Promise.all(promises).then(() => resolve(), reject);
    })
}

export interface failedPOSTOpts {
    description?: string;
    ignoreForm?: boolean;
}

export function testFailedPOST(endpoint: string, payload: UnknownPayload, errorMessage: string, opts?: failedPOSTOpts | string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const promises: Array<Promise<void>> = [];

        const options = typeof opts === 'string' ? { description: opts } : opts;

        promises.push(new Promise<void>((res: Function, rej: Function): void => {
            const type: string = 'application/json';
            chai.request(URI)
                .post(endpoint)
                .set('content-type', type)
                .send(JSON.stringify(payload))
                .end((err, response) => {
                    if (err) { rej(err) } else {
                        try {
                            options.description = `${options.description} - ${type}`;
                            expect(response.body.message, options.description).to.be.equal(errorMessage);
                            expect(response.status, options.description).to.be.equal(HttpStatusCode.BAD_REQUEST);
                            expect(response.header['content-type'], options.description).to.be.equal('application/json; charset=utf-8');
                            expect(response.header['x-high-resolution-elapsed-time'], options.description).to.be.undefined;
                            res()
                        } catch (e) {
                            rej(e);
                        }
                    }
                })
        }));

        if (options && !options.ignoreForm) {
            promises.push(new Promise<void>((res: Function, rej: Function): void => {
                const type: string = 'application/x-www-form-urlencoded';
                chai.request(URI)
                    .post(endpoint)
                    .set('content-type', type)
                    .type('form')
                    .send(toForm(payload))
                    .end((err, response) => {
                        if (err) { rej(err) } else {
                            try {
                                options.description = `${options.description} - ${type}`;
                                expect(response.body.message, options.description).to.be.equal(errorMessage);
                                expect(response.status, options.description).to.be.equal(HttpStatusCode.BAD_REQUEST);
                                expect(response.header['content-type'], options.description).to.be.equal('application/json; charset=utf-8');
                                expect(response.header['x-high-resolution-elapsed-time'], options.description).to.be.undefined;
                                res()
                            } catch (e) {
                                rej(e);
                            }
                        }
                    })
            }));
        }

        return Promise.all(promises).then(() => resolve(), reject);
    })
}
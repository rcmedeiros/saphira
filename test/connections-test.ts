// cSpell:ignore soapenv tecnologia seguranca detran usuario senha
import { ConnectionWebServer, ID as WEB_ID } from './mocks/sample_server/connection_web';
import { Done, after, before, describe, it } from 'mocha';
import { ENDPOINT_API_SPEC, ENDPOINT_HEALTH_CHECK, ENDPOINT_INFO, ENDPOINT_OPEN_API } from '../src/constants/settings';
import { HttpStatusCode, NameValue, Rejection, Resolution, Saphira, SaphiraOptions } from '../src';
import { LOCALHOST, mockServers } from './mocks/http_servers';
import chai, { expect } from 'chai';

import { WebServerConfig } from '../src/adapter/adapters';
import chaiHttp from 'chai-http';
import request from 'superagent';

chai.use(chaiHttp);

describe('Web Server test', () => {
    process.env.NODE_ENV = 'test';
    process.env.WEB_SERVER = `{"host": "${LOCALHOST}:${mockServers.restServer.port}"}`;

    const options: SaphiraOptions = {
        port: 4321,
        adapters: {
            webServices: [
                {
                    // test default name
                    envVar: 'WEB_SERVER',
                    parameters: {
                        revenant: 4,
                    },
                },
                {
                    name: WEB_ID,
                    envVar: 'WEB_SERVER',
                    parameters: {
                        revenant: 4,
                    },
                },
            ],
        },
    };

    const server: Saphira = new Saphira([ConnectionWebServer], options);

    before((done: Done) => {
        server.listen().then(() => {
            done();
        }, done);
    });

    after((done: Done) => {
        if (server) {
            server.close().then(() => {
                done();
            }, done);
        } else {
            done();
        }
    });

    const call: (operation: string) => Promise<[string, unknown]> = async (
        operation: string,
    ): Promise<[string, unknown]> =>
        new Promise((resolve: Resolution<[string, unknown]>, reject: Rejection): void => {
            chai.request(`http://127.0.0.1:${options.port}`)
                .get(operation)
                .end(async (err: Error, res: request.Response) => {
                    if (err) {
                        reject(err);
                    } else if (res.status < HttpStatusCode.OK || res.status > HttpStatusCode.PARTIAL_CONTENT) {
                        reject(new Error(`Status code: ${res.status}`));
                    } else {
                        resolve([operation, res.body]);
                    }
                });
        });

    it('Should connect to Webserver', (done: Done) => {
        const promises: Array<Promise<[string, unknown]>> = [
            call(ENDPOINT_HEALTH_CHECK),
            call(ENDPOINT_OPEN_API),
            call(ENDPOINT_API_SPEC),
            call(ENDPOINT_INFO),
            call('/api/connectionWebServer/pureGet'),
            call('/api/connectionWebServer/getUrlEncoded'),
            call('/api/connectionWebServer/getWithObject'),
            call('/api/connectionWebServer/purePost'),
            call('/api/connectionWebServer/postUrlEncoded'),
            call('/api/connectionWebServer/postWithObject'),
            call('/api/connectionWebServer/purePut'),
            call('/api/connectionWebServer/purePatch'),
            call('/api/connectionWebServer/pureHead'),
            call('/api/connectionWebServer/pureDelete'),
        ];

        Promise.all(promises)
            .then((results: Array<[string, unknown]>) => {
                results
                    .map((result: [string, unknown]) => result[1])
                    .forEach((respBody: unknown, index: number) => {
                        switch (index) {
                            case 0:
                            case 1:
                            case 2:
                                console.debug(respBody);
                                break;
                            case 3:
                                const resp: NameValue = respBody as NameValue;
                                expect(resp.name).to.be.equal(__moduleInfo.name);
                                expect(resp.version).to.be.equal(__moduleInfo.version);
                                expect(Date.parse(resp.since as string)).not.to.be.null;
                                const connectionKeys: Array<string> = Object.keys(resp.connections);
                                const wsKeys: Array<string> = options.adapters.webServices.map(
                                    (ws: WebServerConfig | string) =>
                                        (ws as WebServerConfig).envVar
                                            ? (ws as WebServerConfig).name || 'DEFAULT_WEB'
                                            : (ws as string),
                                );
                                wsKeys.forEach((key: string) => {
                                    expect(connectionKeys).to.contain(key);
                                });

                                break;
                            default:
                                expect(respBody).to.be.equal(1);
                                break;
                        }
                    });
                done();
            })
            .catch(done);
    });
});

describe('Starting server with missing environment variable', () => {
    it('Should abort with error message', (done: Done) => {
        const server2: Saphira = new Saphira([ConnectionWebServer], {
            port: 5432,
            adapters: {
                webServices: [
                    {
                        envVar: 'WEB_SERVER2',
                    },
                ],
            },
        });
        server2
            .listen()
            .then(() => {
                done(new Error("Server shouldn't start without a required environment variable"));
            })
            .catch((err: Error) => {
                expect(err.message).to.be.equal('Environment variable WEB_SERVER2 not set');
                done();
            });
    });
    it('Should abort with error message', (done: Done) => {
        const server2: Saphira = new Saphira([ConnectionWebServer], {
            port: 5432,
            adapters: {
                webServices: [
                    {
                        envVar: 'WEB_SERVER2',
                    },
                    'WEB_SERVER3',
                ],
            },
        });
        server2
            .listen()
            .then(() => {
                done(new Error("Server shouldn't start without a required environment variable"));
            })
            .catch((err: Error) => {
                expect(err.message).to.be.equal('Environment variable WEB_SERVER2 not set');
                done();
            });
    });
});

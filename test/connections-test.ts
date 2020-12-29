import { ConnectionWebServer, ID as WEB_ID } from './mocks/sample_server/connection_web';
import { Done, after, before, describe, it } from 'mocha';
import { HttpStatusCode, Rejection, Resolution, Saphira, SaphiraOptions } from '../src';
import { LOCALHOST, mockServers } from './mocks/http_servers';
// cSpell:ignore soapenv tecnologia seguranca detran usuario senha
import chai, { expect } from 'chai';

import chaiHttp from 'chai-http';
import request from 'superagent';

chai.use(chaiHttp);

process.env.NODE_ENV = 'test';
process.env.WEB_SERVER = `{"host": "${LOCALHOST}:${mockServers.restServer.port}"}`;

const options: SaphiraOptions = {
    port: 4321,
    adapters: {
        webServices: [
            {
                // test default name
                envVar: 'WEB_SERVER',
                healthCheckEndpoint: '/health-check',
                parameters: {
                    revenant: 4,
                },
            },
            {
                name: WEB_ID,
                envVar: 'WEB_SERVER',
                healthCheckEndpoint: '/health-check',
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

const call: (operation: string) => Promise<unknown> = async (operation: string): Promise<unknown> =>
    new Promise((resolve: Resolution<unknown>, reject: Rejection): void => {
        chai.request(`http://127.0.0.1:${options.port}`)
            .get(`/${operation}`)
            .end(async (err: Error, res: request.Response) => {
                if (err) {
                    reject(err);
                } else if (res.status < HttpStatusCode.OK || res.status > HttpStatusCode.PARTIAL_CONTENT) {
                    reject(new Error(`Status code: ${res.status}`));
                } else {
                    resolve(res.body);
                }
            });
    });

describe('Web Server test', () => {
    it('Should connect to Webserver', (done: Done) => {
        const promises: Array<unknown> = [
            call('health-check'),
            call('api-info'),
            call('api/connectionWebServer/pureGet'),
            call('api/connectionWebServer/getUrlEncoded'),
            call('api/connectionWebServer/getWithObject'),
            call('api/connectionWebServer/purePost'),
            call('api/connectionWebServer/postUrlEncoded'),
            call('api/connectionWebServer/postWithObject'),
            call('api/connectionWebServer/purePut'),
            call('api/connectionWebServer/purePatch'),
            call('api/connectionWebServer/pureHead'),
            call('api/connectionWebServer/pureDelete'),
        ];

        Promise.all(promises)
            .then((results: Array<unknown>) => {
                results.forEach((respBody: unknown, index: number) => {
                    if (index > 2) {
                        expect(respBody).to.be.equal(1);
                    }
                });
                done();
            })
            .catch(done);
    });
});

describe('Missing environment variable', () => {
    it('Should abort server start', (done: Done) => {
        const server2: Saphira = new Saphira([ConnectionWebServer], {
            port: 5432,
            adapters: {
                webServices: [
                    {
                        envVar: 'WEB_SERVER2',
                        healthCheckEndpoint: '/health-check',
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
});

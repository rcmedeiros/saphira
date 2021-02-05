import '@rcmedeiros/prototypes';

import { Done, after, before, describe, it } from 'mocha';
import { HttpStatusCode, JWT, Rejection, Resolution, Saphira } from '../src';
import { LOCALHOST, PUBLIC_KEY, mockServers } from './mocks/http_servers';
import {
    SECURE_SERVER_JUST_RESTRICTED,
    SECURE_SERVER_RESTRICTED_TO_SYSTEM,
    SECURE_SERVER_SELF_REQUEST,
    SELF_REQUEST,
    SecureService,
} from './mocks/sample_server/secure_service';
import chai, { expect } from 'chai';

import { BootPanel } from './boot_panel';
import { HttpResponse } from 'chai-http-ext';
import { LogCapture } from './log_capture';
import { OAUTH2_SERVER } from '../src/constants/settings';
import { Oauth2Client } from '../src/oauth2_client';
import chaiHttp from 'chai-http';

chai.use(chaiHttp);

describe('JWT Protected Server', () => {
    const SECURE_SERVER_PORT: number = 6789;
    const SECURE_SERVER_PORT2: number = 6790;
    const SECURE_SERVER_PORT3: number = 6791;
    const server: Saphira = new Saphira([SecureService], {
        port: SECURE_SERVER_PORT,
        adapters: {
            sysAuth: [
                {
                    name: 'OAUTH2_CLIENT',
                    envVar: 'OAUTH2_CLIENT',
                    clientId: 'the_system',
                },
            ],
            webServices: [
                { envVar: 'OAUTH2_SERVER', healthCheckEndpoint: '' },
                {
                    name: SELF_REQUEST,
                    envVar: SELF_REQUEST,
                    healthCheckEndpoint: '',
                    independent: true,
                },
            ],
        },
    });
    const server2: Saphira = new Saphira([SecureService], { port: SECURE_SERVER_PORT2 });
    const server3: Saphira = new Saphira([SecureService], { port: SECURE_SERVER_PORT3 });

    before((done: Done) => {
        process.env.OAUTH2_SERVER = `${LOCALHOST}:${mockServers.fakeOauth2.port}`;
        process.env.OAUTH2_CLIENT = JSON.stringify({
            clientSecret: 'th3_s3cr37',
            serverURI: `${LOCALHOST}:${mockServers.okServer.port}`,
            publicKey: PUBLIC_KEY,
            tokenEndpoint: '/token',
        });
        process.env[SELF_REQUEST] = JSON.stringify({
            host: `${LOCALHOST}:${SECURE_SERVER_PORT}`,
            systemAuth: 'OAUTH2_CLIENT',
        });
        server.listen().then(() => {
            process.env.OAUTH2_SERVER = JSON.stringify({
                host: `${LOCALHOST}:${mockServers.fakeOauth2.port}`,
                healthCheckEndpoint: '',
            });
            server2.listen().then(() => {
                delete process.env.OAUTH2_SERVER;
                process.env.OAUTH2_SERVER = `${LOCALHOST}:${mockServers.okServer.port}`;
                done();
            }, done);
        }, done);
    });

    after((done: Done) => {
        const promises: Array<Promise<void>> = [
            new Promise((resolve: Resolution<void>, reject: Rejection) => {
                server.close().then(() => {
                    resolve();
                }, reject);
            }),
            new Promise((resolve: Resolution<void>, reject: Rejection) => {
                server2.close().then(() => {
                    resolve();
                }, reject);
            }),
        ];

        Promise.all(promises).then(() => {
            done();
        }, done);
    });
    it('Should deny access to unauthenticated requests', (done: Done) => {
        chai.request(`${LOCALHOST}:${SECURE_SERVER_PORT}`)
            .get(SECURE_SERVER_JUST_RESTRICTED)
            .end((err: Error, res: HttpResponse) => {
                expect(res.status).to.be.equal(HttpStatusCode.UNAUTHORIZED);
                done(err);
            });
    });

    let goodToken: string;
    let badToken: string;
    it('Get bearer token to test security', (done: Done) => {
        new Oauth2Client()
            .setUser(
                'the_system3',
                'the_user3',
                'th3_p@55w0rd',
                `${LOCALHOST}:${mockServers.okServer.port}`,
                'token',
                `${LOCALHOST}:${mockServers.callback.port}/callback`,
            )
            .getBearerToken()
            .then((badBearerToken: JWT) => {
                badToken = badBearerToken.toString();
                new Oauth2Client()
                    .setClient('the_system', 'th3_s3cr37', `${LOCALHOST}:${mockServers.okServer.port}`, '/token')
                    .getBearerToken()
                    .then((goodBearerToken: JWT) => {
                        goodToken = goodBearerToken.toString();
                        done();
                    }, done);
            }, done);
    });

    it('Should authorize any token to simply restricted operations', (done: Done) => {
        chai.request(`${LOCALHOST}:${SECURE_SERVER_PORT}`)
            .get(SECURE_SERVER_JUST_RESTRICTED)
            .set('Authorization', `Bearer ${badToken}`)
            .end((err: Error, res: HttpResponse) => {
                expect(res.status).to.be.equal(HttpStatusCode.OK);
                expect(res.body).to.be.equal(1);
                done(err);
            });
    });

    it('Should forbid access to authenticated but unauthorized request', (done: Done) => {
        chai.request(`${LOCALHOST}:${SECURE_SERVER_PORT}`)
            .get(SECURE_SERVER_RESTRICTED_TO_SYSTEM)
            .set('Authorization', `Bearer ${badToken}`)
            .end((err: Error, res: HttpResponse) => {
                expect(res.status).to.be.equal(HttpStatusCode.FORBIDDEN);
                done(err);
            });
    });
    it('Should allow access to request authorized by system', (done: Done) => {
        chai.request(`${LOCALHOST}:${SECURE_SERVER_PORT}`)
            .get(SECURE_SERVER_RESTRICTED_TO_SYSTEM)
            .set('Authorization', `Bearer ${goodToken}`)
            .end((err: Error, res: HttpResponse) => {
                expect(res.status).to.be.equal(HttpStatusCode.OK);
                done(err);
            });
    });
    it('Should allow access to request authorized by system (server 2)', (done: Done) => {
        chai.request(`${LOCALHOST}:${SECURE_SERVER_PORT2}`)
            .get(SECURE_SERVER_RESTRICTED_TO_SYSTEM)
            .set('Authorization', `Bearer ${goodToken}`)
            .end((err: Error, res: HttpResponse) => {
                expect(res.status).to.be.equal(HttpStatusCode.OK);
                done(err);
            });
    });
    it('Should be able to handle authenticated calls', (done: Done) => {
        chai.request(`${LOCALHOST}:${SECURE_SERVER_PORT}`)
            .get(SECURE_SERVER_SELF_REQUEST)
            .end((err: Error, res: HttpResponse) => {
                expect(res.status).to.be.equal(HttpStatusCode.OK);
                done(err);
            });
    });

    describe('Failed protection configuration', () => {
        it('Should accuse when server has no key', (done: Done) => {
            const stdOut: LogCapture = new LogCapture();
            const stdErr: LogCapture = new LogCapture(process.stderr);
            server3.listen().then(() => {
                expect(stdErr.getCaptured()).to.contain('FAILED to obtain OAuth2 Server key');
                expect(new BootPanel(stdOut.getCaptured()).getStatus(OAUTH2_SERVER)).to.be.equals("'Status code 404'");
                done();
            }, done);
        });
    });
});

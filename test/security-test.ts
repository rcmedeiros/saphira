import '@rcmedeiros/prototypes';

import { Done, after, before, describe, it } from 'mocha';
import { HttpStatusCode, JWT, Saphira } from '../src';
import { LOCALHOST, mockServers } from './mocks/http_servers';
import {
    SECURE_SERVER_JUST_RESTRICTED,
    SECURE_SERVER_RESTRICTED_TO_SYSTEM,
    SecureService,
} from './mocks/sample_server/secure_service';
import chai, { expect } from 'chai';

import { HttpResponse } from 'chai-http-ext';
import { Oauth2Client } from '../src/oauth2_client';
import chaiHttp from 'chai-http';

chai.use(chaiHttp);

const SECURE_SERVER_PORT: number = 6789;
const server: Saphira = new Saphira([SecureService], { port: SECURE_SERVER_PORT });

before((done: Done) => {
    process.env.OAUTH2_SERVER = `${LOCALHOST}:${mockServers.fakeOauth2.port}`;
    server.listen().then(() => {
        delete process.env.OAUTH2_SERVER;
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
describe('JWT Protected Server', () => {
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
                `${LOCALHOST}:${mockServers.callback.port}/callback`,
            )
            .getBearerToken()
            .then((badBearerToken: JWT) => {
                badToken = badBearerToken.toString();
                new Oauth2Client()
                    .setClient('the_system', 'th3_s3cr37', `${LOCALHOST}:${mockServers.okServer.port}`)
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
});

import '@rcmedeiros/prototypes';

import { Done, after, before, describe, it } from 'mocha';
import { HttpStatusCode, MimeType, Saphira, Vault } from '../src';
import { LOCALHOST, mockServers } from './mocks/http_servers';
import { SECURE_SERVER_POST, ServiceCaller } from './mocks/sample_server/service_caller';
import chai, { expect } from 'chai';

import { HttpResponse } from 'chai-http-ext';
import { JWT_KEY } from '../src/constants/settings';
import chaiHttp from 'chai-http';

chai.use(chaiHttp);

describe('Custom Oauth Token Server', () => {
    const SERVER_PORT: number = 7777;
    const server: Saphira = new Saphira([ServiceCaller], {
        port: SERVER_PORT,
        adapters: {
            sysAuth: [
                {
                    name: 'OAUTH2_CUSTOM_CLIENT',
                    envVar: 'OAUTH2_CUSTOM_CLIENT',
                    clientId: 'custom_sys',
                    clientIdProp: 'idClient',
                    clientSecretProp: 'password',
                    tokenProp: 'response.data.bearerToken',
                    subjectProp: 'email',
                    fixedExpiration: 180,
                    tokenEndpoint: 'login',
                },
            ],
            webServices: [{ envVar: 'SOME_SERVICE', healthCheckEndpoint: '/' }],
        },
    });

    const vault: Vault = Vault.getInstance();
    let somebodyElsesJwtKey: string;

    before((done: Done) => {
        process.env.OAUTH2_CUSTOM_CLIENT = JSON.stringify({
            clientSecret: 'cu570m_s3cr37',
            serverURI: `${LOCALHOST}:${mockServers.fakeCustomOauth.port}`,
        });
        process.env.SOME_SERVICE = JSON.stringify({
            name: 'SOME_SERVICE',
            host: `${LOCALHOST}:${mockServers.fakeCustomOauth.port}`,
            healthCheckEndpoint: '',
            systemAuth: 'OAUTH2_CUSTOM_CLIENT',
        });
        somebodyElsesJwtKey = vault.get(JWT_KEY) as string;
        vault.delete(JWT_KEY);
        server.listen().then(() => {
            done();
        }, done);
    });

    after((done: Done) => {
        server.close().then(() => {
            vault.set(JWT_KEY, somebodyElsesJwtKey);
            done();
        }, done);
    });
    it('Should call', (done: Done) => {
        chai.request(`${LOCALHOST}:${SERVER_PORT}`)
            .post(SECURE_SERVER_POST)
            .set('content-type', MimeType.JSON_format)
            .send(
                JSON.stringify({
                    service: 'SOME_SERVICE',
                    endpoint: '/someCall',
                    payload: { heil: 'Miðgarðr' },
                }),
            )
            .end((err: Error, res: HttpResponse) => {
                expect(res.status).to.be.equal(HttpStatusCode.OK);
                done(err);
            });
    });
});

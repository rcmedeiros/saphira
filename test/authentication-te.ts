process.env.TOKEN_SAFETY_MARGIN = '0';

import { expect } from 'chai';
import { describe, Done, it } from 'mocha';
import { JWT } from '../src';
import { Oauth2Client } from '../src/oauth2_client';
import { LOCALHOST, mockServers } from './mocks/http_servers';

describe('Oauth2Client', () => {
    it('Should NOT authenticate invalid User', (done: Done) => {

        const wrongUserAuth: Oauth2Client = new Oauth2Client()
            .setUser('the_system', 'the_user', 'wrongPass',
                `${LOCALHOST}:${mockServers.okServer.port}`, `${LOCALHOST}:${mockServers.callback.port}/callback`);
        wrongUserAuth.getBearerToken()
            .then(() => {
                expect(true, 'should never succeed').to.be.false;
            }).catch((err: Error) => {
                expect(err.name).to.be.equal('access_denied');
                expect(wrongUserAuth.isAuthenticated()).to.be.false;
                done();
            });
    });
    it('Should NOT authenticate invalid Client', (done: Done) => {
        const wrongClientAuth: Oauth2Client = new Oauth2Client()
            .setClient('the_system', 'wrongSecret', `${LOCALHOST}:${mockServers.okServer.port}`);
        wrongClientAuth.getBearerToken()
            .then(() => {
                expect(true, 'should never succeed').to.be.false;
            }).catch((err: Error) => {
                expect(err.name).to.be.equal('access_denied');
                expect(wrongClientAuth.isAuthenticated()).to.be.false;
                done();
            });
    });

    const userAuth: Oauth2Client = new Oauth2Client()
        .setUser('the_system', 'the_user', 'th3_p@55w0rd',
            `${LOCALHOST}:${mockServers.okServer.port}`, `${LOCALHOST}:${mockServers.callback.port}/callback`);
    let userToken: string;
    it('Should authenticate User', (done: Done) => {
        userAuth.getBearerToken()
            .then((token: JWT) => {
                expect(userAuth.isAuthenticated()).to.be.true;
                userToken = token.toString();
                userAuth.getBearerToken().then((sameToken: JWT) => {
                    expect(token.toString()).to.be.equal(sameToken.toString());
                    done();
                }).catch((e: Error) => {
                    done(e);
                });
            }).catch((e: Error) => {
                done(e);
            });
    });

    const clientAuth: Oauth2Client = new Oauth2Client()
        .setClient('the_system', 'th3_s3cr37', `${LOCALHOST}:${mockServers.okServer.port}`);
    let clientToken: string;
    it('Should authenticate Client', (done: Done) => {
        clientAuth.getBearerToken()
            .then((token: JWT) => {
                expect(clientAuth.isAuthenticated()).to.be.true;
                clientToken = token.toString();
                clientAuth.getBearerToken().then((sameToken: JWT) => {
                    expect(token.toString()).to.be.equal(sameToken.toString());
                    done();
                }).catch(done);
            }).catch(done);
    });

    const distrustfulAuth: Oauth2Client = new Oauth2Client()
        .setUser('the_system', 'the_user', 'th3_p@55w0rd',
            `${LOCALHOST}:${mockServers.distrustfulServer.port}`, `${LOCALHOST}:${mockServers.callback.port}/callback`);
    let userToken2: string;
    it('Should deal with server that won\'t bestow refresh tokens', (done: Done) => {
        distrustfulAuth.getBearerToken()
            .then((token: JWT) => {
                userToken2 = token.toString();
                expect(distrustfulAuth.isAuthenticated()).to.be.true;
                done();
            }).catch(done);
    });

    // Login before expiration time
    const failRefresh1: Oauth2Client = new Oauth2Client()
        .setUser('the_system', 'the_user', 'th3_p@55w0rd',
            `${LOCALHOST}:${mockServers.trollServer.port}`, `${LOCALHOST}:${mockServers.callback.port}/callback`);
    const failRefresh2: Oauth2Client = new Oauth2Client()
        .setUser('the_system', 'the_user', 'th3_p@55w0rd',
            `${LOCALHOST}:${mockServers.drunkServer.port}`, `${LOCALHOST}:${mockServers.callback.port}/callback`);

    it('init', (done: Done) => {
        Promise.all([
            failRefresh1.getBearerToken(),
            failRefresh2.getBearerToken(),
        ]).then(() => done()).catch(done);
    });

    it('Should refresh User Token', (done: Done) => {
        setTimeout(() => {
            userAuth.getBearerToken()
                .then((token: JWT) => {
                    expect(token.toString()).not.to.be.equal(userToken);
                    done();
                }).catch(done);
        }, 1500);
    }).timeout(2000);

    it('Should refresh User even without a refresh token', (done: Done) => {
        setTimeout(() => {
            distrustfulAuth.getBearerToken()
                .then((token: JWT) => {
                    expect(token.toString()).not.to.be.equal(userToken2);
                    done();
                }).catch(done);
        }, 1500);
    }).timeout(2000);

    it('Should refresh Client Token', (done: Done) => {
        clientAuth.getBearerToken()
            .then((token: JWT) => {
                expect(token.toString()).not.to.be.equal(clientToken);
                done();
            }).catch(done);
    });

    it('Should handle denied access upon refreshing the token', (done: Done) => {
        failRefresh1.getBearerToken()
            .then(() => {
                expect(true, 'should never succeed').to.be.false;
            }).catch((err: Error) => {
                expect(err.name).to.be.equal('access_denied');
                done();
            });
    });

    it('Should handle invalid response upon refreshing the token', (done: Done) => {
        failRefresh2.getBearerToken()
            .then(() => {
                expect(true, 'should never succeed').to.be.false;
            }).catch((err: Error) => {
                expect(err.name).to.be.equal('Invalid Server Response');
                done();
            });
    });

    it('Should gracefully deal with malformed responses upon Oauth2Client', (done: Done) => {
        new Oauth2Client().setClient('napier', 'whatever', `${LOCALHOST}:${mockServers.crazyServer.port}`)
            .getBearerToken().then(() => {
                expect(true, 'should never succeed').to.be.false;
            }).catch((err: Error) => {
                expect(err.name).to.be.equal('Invalid Server Response');
                done();
            });
    });

    it('Should gracefully deal with invalid responses upon client Oauth2Client', (done: Done) => {
        new Oauth2Client().setClient('fleck', 'neverMind', `${LOCALHOST}:${mockServers.crazyServer.port}`)
            .getBearerToken().then(() => {
                expect(true, 'should never succeed').to.be.false;
            }).catch((err: Error) => {
                expect(err.name).to.be.equal('Invalid Server Response');
                done();
            });
    });

    it('Should gracefully deal with malformed successes upon client Oauth2Client', (done: Done) => {
        new Oauth2Client().setClient('nobody', 'neverMind', `${LOCALHOST}:${mockServers.crazyServer.port}`)
            .getBearerToken().then(() => {
                expect(true, 'should never succeed').to.be.false;
            }).catch((err: Error) => {
                expect(err.name).to.be.equal('Invalid Server Response');
                done();
            });
    });

    it('Should gracefully deal with unexpected errors upon user Oauth2Client', (done: Done) => {
        new Oauth2Client().setUser('the_system', 'the_user', 'th3_p@55w0rd',
            `${LOCALHOST}:${mockServers.senileServer.port}`, `${LOCALHOST}:${mockServers.callback.port}/callback`)
            .getBearerToken().then(() => {
                expect(true, 'should never succeed').to.be.false;
            }).catch((err: Error) => {
                expect(err.name).to.be.equal('access_denied');
                done();
            });
    });

    it('Should gracefully deal with malformed successes upon user Oauth2Client', (done: Done) => {
        new Oauth2Client().setUser('a_system', 'the_user', 'th3_p@55w0rd',
            `${LOCALHOST}:${mockServers.senileServer.port}`, `${LOCALHOST}:${mockServers.callback.port}/callback`)
            .getBearerToken().then(() => {
                expect(true, 'should never succeed').to.be.false;
            }).catch((err: Error) => {
                expect(err.name).to.be.equal('Invalid Server Response');
                done();
            });
    });
});

import * as core from 'express-serve-static-core';

import { CodeResponse, ErrorResponse, FakeOauth2, TokenResponse } from '../oauth2/fake-oauth2';
import { Done, after, before, describe, it } from 'mocha';
import { Rejection, Resolution } from '../../../src';
import express, { Request as ERequest, Response as EResponse, NextFunction } from 'express';

import { MimeType } from '../../../src/file_buffer';
import { Server } from 'http';
// cSpell: ignore listofacil
import bodyParser from 'body-parser';
import { expect } from 'chai';
import fs from 'fs';
import path from 'path';

const fakeOauth2: FakeOauth2 = new FakeOauth2();

type Request = ERequest & { body: { [n: string]: string }; query: { [id: string]: number } };
type Response = EResponse;

type Call = (req: Request, resp: Response, next?: NextFunction) => void;
interface Route {
    [path: string]: Call;
}

interface MockServer {
    port?: number;
    app?: core.Express;
    server?: Server;
    get?: Route;
    post?: Route;
    use?: Route;
}

interface MockServers {
    [id: string]: MockServer;
}

export const LOCALHOST: string = 'http://127.0.0.1';

// ..::[[ SERVER LOGIC IS BUT THIS SECTION

export const PUBLIC_KEY: string = `-----BEGIN RSA PUBLIC KEY-----
MIGJAoGBAIcemcq+Wq+KT72fvGz5yqdF1VKpPxoZekP5kVxIikSJ5GSBqyJQd/4m
XHBGUdUDaFqpPYnfMm6VC8W49066r4jZ1SyP1dZnE6B0vzD5+x1uP4BYZ5ESAj6P
Hcm2ooV/HTHDT5Sq+Ppo/xoSFXhUS1fAQ6xQneXuD56JWpUosag9AgMBAAE=
-----END RSA PUBLIC KEY-----`;

type Oauth2Response = TokenResponse | CodeResponse | ErrorResponse;
type Oauth2ResponsePostProcess = (r: Oauth2Response) => Oauth2Response;
type Oauth2ResponseFunction = (
    call: Promise<Oauth2Response>,
    res: Response,
    postProcess?: Oauth2ResponsePostProcess,
) => void;

const oauth2Response: Oauth2ResponseFunction = (
    call: Promise<Oauth2Response>,
    res: Response,
    postProcess?: (r: Oauth2Response) => Oauth2Response,
): void => {
    call.then((r: Oauth2Response) => {
        if ((r as ErrorResponse).error) {
            res.status(400);
        }
        if (postProcess) {
            r = postProcess(r);
        }
        res.json(r);
    }).catch((e: Error) => {
        res.status(500).json(e);
    });
};

export const mockServers: MockServers = {
    okServer: {
        post: {
            auth: (req: Request, res: Response): void => {
                if (req.body.response_type === 'code') {
                    oauth2Response(
                        fakeOauth2.getAuthorizationCode(
                            req.body.client_id,
                            req.body.username,
                            req.body.password,
                            req.body.code_challenge,
                        ),
                        res,
                    );
                }
            },
            token: (req: Request, res: Response): void => {
                if (req.body.grant_type === 'client_credentials') {
                    oauth2Response(fakeOauth2.clientCredentials(req.body.client_id, req.body.client_secret), res);
                } else if (req.body.grant_type === 'refresh_token') {
                    oauth2Response(fakeOauth2.refreshToken(req.body.refresh_token), res);
                } else {
                    oauth2Response(fakeOauth2.authorizationCode(req.body.code, req.body.code_verifier), res);
                }
            },
        },
    },
};

mockServers.distrustfulServer = {
    post: {
        auth: mockServers.okServer.post.auth,
        token: (req: Request, res: Response): void => {
            if (req.body.grant_type === 'authorization_code') {
                oauth2Response(
                    fakeOauth2.authorizationCode(req.body.code, req.body.code_verifier),
                    res,
                    (r: Oauth2Response) => {
                        delete (r as TokenResponse).refresh_token;
                        return r;
                    },
                );
            }
        },
    },
};

mockServers.callback = {};

mockServers.trollServer = {
    post: {
        auth: mockServers.okServer.post.auth,
        token: (req: Request, res: Response): void => {
            if (req.body.grant_type === 'refresh_token') {
                res.json({
                    error: 'access_denied',
                    error_description: 'The resource owner or authorization server denied the request.',
                });
            } else {
                mockServers.okServer.post.token(req, res);
            }
        },
    },
};

mockServers.drunkServer = {
    post: {
        auth: mockServers.okServer.post.auth,
        token: (req: Request, res: Response): void => {
            if (req.body.grant_type === 'refresh_token') {
                res.json({ a: 'what access_token?' });
            } else {
                mockServers.okServer.post.token(req, res);
            }
        },
    },
};

mockServers.crazyServer = {
    post: {
        auth: (req: Request, res: Response): void => {
            switch (req.body.client_id || req.body.username) {
                case 'napier':
                    res.json({ a: 'Nobody panics when things go "according to plan". Even if the plan is horrifying' });
                    break;
                case 'fleck':
                    res.json('All I Have Are Negative Thoughts');
                    break;
                default:
                    res.json({ a: 'there is no access_token' });
            }
        },
    },
};

mockServers.senileServer = {
    post: {
        auth: (req: Request, res: Response): void => {
            if (req.body.client_id === 'the_system') {
                res.json({
                    error: 'access_denied',
                    error_description: 'The resource owner or authorization server denied the request.',
                });
            } else {
                res.json({ a: 'You shall not pass!' });
            }
        },
    },
};

mockServers.restServer = {
    use: {
        endpoint: (req: Request, res: Response): void => {
            const a: { [id: string]: number } = (req.query || req.body || {}) as { [id: string]: number };
            if (!a || !Object.keys(a).length) {
                res.sendStatus(200);
            } else {
                const r: number = Object.keys(a)
                    .map((s: string) => a[s])
                    .reduce(
                        (acc: number, val: number) =>
                            (typeof acc === 'number' ? acc : parseInt(acc)) +
                            (typeof val === 'number' ? val : parseInt(val)),
                    );
                res.sendStatus(r === 0 || r === 10 ? 200 : 400);
            }
        },
    },
};

mockServers.fakeOauth2 = {
    get: {
        'health-check': (_req: Request, res: Response): void => {
            res.sendStatus(200);
        },
        key: (_req: Request, res: Response): void => {
            res.setHeader('content-type', MimeType.Text);
            res.send(PUBLIC_KEY);
        },
    },
};

mockServers.fakeSoap = {
    post: {
        'WsPgtoCartaoCredito/wspgtocartaocredito.asmx': (_req: Request, res: Response): void => {
            const response: string = fs.readFileSync(path.join(__dirname, 'soap_response.txt')).toString();
            res.setHeader('content-type', MimeType.XML_from_applications);
            res.send(response);
        },
    },
    get: {
        'WsPgtoCartaoCredito.asmx': (_req: Request, res: Response): void => {
            res.sendStatus(200);
        },
    },
};

// End of mock logic ]]::..

let port: number = 10000;
Object.keys(mockServers).forEach((k: string) => {
    mockServers[k].port = port++;
});

const start: (mock: MockServer) => Promise<Server> = async (mock: MockServer): Promise<Server> =>
    new Promise(
        async (resolve: Resolution<Server>, reject: Rejection): Promise<void> => {
            mock.app = express();
            // tslint:disable-next-line: deprecation
            mock.app.use(bodyParser.json());
            // tslint:disable-next-line: deprecation
            mock.app.use(bodyParser.urlencoded({ extended: false }));
            mock.app.set('port', mock.port);

            mock.app.get('/health-check', (_req: Request, res: Response): void => {
                res.sendStatus(200);
            });

            if (mock.get) {
                Object.keys(mock.get)
                    .map((k: string) => [k, mock.get[k]])
                    .forEach((route: [string, Call]) => {
                        mock.app.get(`/${route[0]}`, route[1]);
                    });
            }
            if (mock.post) {
                Object.keys(mock.post)
                    .map((k: string) => [k, mock.post[k]])
                    .forEach((route: [string, Call]) => {
                        mock.app.post(`/${route[0]}`, route[1]);
                    });
            }
            if (mock.use) {
                Object.keys(mock.use)
                    .map((k: string) => [k, mock.use[k]])
                    .forEach((route: [string, Call]) => {
                        mock.app.use(`/${route[0]}`, route[1]);
                    });
            }

            mock.app.on('error', (err: unknown) => {
                // eslint-disable-next-line prefer-promise-reject-errors
                reject(err as Error);
            });

            mock.server = mock.app.listen(mock.port, () => {
                resolve();
            });
        },
    );

const stop: (mock: MockServer) => Promise<void> = async (mock: MockServer): Promise<void> =>
    new Promise((resolve: Resolution<void>, reject: Rejection): void => {
        mock.server.close((err: Error) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });

before((done: Done) => {
    Promise.all(Object.keys(mockServers).map((k: string) => start(mockServers[k])))
        .then(() => {
            done();
        })
        .catch(done);
});

after((done: Done) => {
    Promise.all(Object.keys(mockServers).map((k: string) => stop(mockServers[k])))
        .then(() => {
            done();
        })
        .catch(done);
});

describe('Mock servers', () => {
    it('successfully started', (done: Done) => {
        Object.keys(mockServers)
            .map((k: string) => mockServers[k])
            .forEach((mock: MockServer) => {
                expect(mock.server).is.not.null;
            });
        done();
    });
});

import * as core from 'express-serve-static-core';

import { CodeResponse, ErrorResponse, FakeOauth2, TokenResponse } from '../oauth2/fake-oauth2';
import { Done, after, before, describe, it } from 'mocha';
import { Rejection, Resolution } from '../../../src';
import express, { Request as ERequest, Response as EResponse, NextFunction } from 'express';

import { ContentType } from '../../../src/constants/content_types';
import { ENDPOINT_HEALTH_CHECK } from '../../../src/constants/settings';
import { Server } from 'http';
// cSpell: ignore listofacil
import bodyParser from 'body-parser';
import { expect } from 'chai';
import fs from 'fs';

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

export const PUBLIC_KEY: string = JSON.parse(fs.readFileSync('test/mocks/oauth2/oauth2_config.json').toString())
    .publicKey;

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
                if (req.body.client_id === 'the_system2') {
                    res.json({ a: 'Move along... move along...' });
                } else if (req.body.grant_type === 'client_credentials') {
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

mockServers.deceitfulServer = {
    post: {
        auth: mockServers.okServer.post.auth,
        token: (req: Request, res: Response): void => {
            res.json({
                token_type: 'Bearer',
                access_token: 'this is no token',
                expires_in: 33481690453,
            });
        },
    },
};

mockServers.crazyServer = {
    post: {
        auth: (req: Request, res: Response): void => {
            switch (req.body.client_id || req.body.username) {
                case 'solo':
                    res.json({ a: "It's not my fault." });
                    break;
                case 'jinn':
                    res.json('Your focus determines your reality.');
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
        '/': (_req: Request, res: Response): void => {
            res.sendStatus(200);
        },
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
        '/': (_req: Request, res: Response): void => {
            res.sendStatus(200);
        },
        key: (_req: Request, res: Response): void => {
            res.setHeader('content-type', ContentType.Text);
            res.send(PUBLIC_KEY);
        },
    },
};

const CUSTOM_TOKEN: string =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJob3NwaXRhbCI6eyJkb2N1bWVudHMiOnsiY25waiI6IjYwOTIyMTY4MDAwNzcxIn0sImV4cGlyYXRpb24iOjMwMCwidXJsIjoiaHR0cHM6Ly9kZXYub3JjaGVzdHJhdGlvbi5jcm50LmNvbS5ici8iLCJfaWQiOiI1ZDkzYzk0YjhlNDQwZTAwMWM3NGRmYWYiLCJuYW1lIjoiSE9TUElUQUwgU0FOVEEgQ0FUQVJJTkEiLCJhZGRyZXNzIjoiQXYgUGF1bGlzdGEgbjIwMCIsImxvZ28iOiI1ZDkzYzk0YjhlNDQwZTAwMWM3NGRmYWZfbG9nbyIsInVzZS1lcnAiOmZhbHNlLCJjcmVhdGVkQXQiOiIyMDIwLTA4LTIwVDE4OjIyOjUyLjkyN1oiLCJ1cGRhdGVkQXQiOiIyMDIwLTEwLTAxVDE3OjI2OjM1LjMzMloifSwiZW1haWwiOiJzdXBvcnRlQGNhcmVuZXQuY29tLmJyIiwiY29tcGFueUZ1bmN0aW9uIjoiQ2FyZW5ldCIsInBob25lTnVtYmVyIjpudWxsLCJlcnBDb2RlIjpudWxsLCJkZWxldGVkQXQiOm51bGwsImRpc2FsbG93RXhwaXJhdGlvbiI6ZmFsc2UsImdlbmVyYXRlZFBhc3N3b3JkIjpmYWxzZSwiX2lkIjoiNWZlYTNlN2VmMDRhYTkwMDExMGYwNjg1IiwibmFtZSI6ImFkbWluaXN0cmF0b3IiLCJpZFByb2Zpc3Npb25hbCI6ImFkbWluaXN0cmFkb3IiLCJhdXRob3JpemF0aW9uTmFtZSI6bnVsbCwiY3JlYXRlZEF0IjoiMjAyMC0xMi0yOFQyMDoyMjoyMi4xMjBaIiwidXBkYXRlZEF0IjoiMjAyMC0xMi0yOFQyMDoyMjoyMi4xMjBaIiwiX192IjowLCJpc0FkbWluIjp0cnVlLCJhdXRob3JpemF0aW9ucyI6W3sibmFtZSI6ImNoYW5nZV9pY3UiLCJwZXJtaXNzaW9uIjp0cnVlfSx7Im5hbWUiOiJjaGFuZ2Vfc2VuZF9lcnBfdmFsdWVzIiwicGVybWlzc2lvbiI6dHJ1ZX0seyJuYW1lIjoidXNlcl9nZXQiLCJwZXJtaXNzaW9uIjp0cnVlfSx7Im5hbWUiOiJzaWNrYmVkc19nZXRfc29ja2V0IiwicGVybWlzc2lvbiI6ZmFsc2V9LHsibmFtZSI6ImNoYW5nZV91c2VyIiwicGVybWlzc2lvbiI6dHJ1ZX0seyJuYW1lIjoiZGVsZXRlX3VzZXIiLCJwZXJtaXNzaW9uIjp0cnVlfSx7Im5hbWUiOiJzaWNrYmVkc19pbyIsInBlcm1pc3Npb24iOmZhbHNlfSx7Im5hbWUiOiJpY3VzX2dldCIsInBlcm1pc3Npb24iOnRydWV9LHsibmFtZSI6InZpdGFsLXNpZ24vZ3JvdXBfZ2V0IiwicGVybWlzc2lvbiI6ZmFsc2V9LHsibmFtZSI6InVzZXJzX2dldCIsInBlcm1pc3Npb24iOnRydWV9LHsibmFtZSI6InNlbmRfZXJwX3ZhbGlkYXRpb25fZ2V0IiwicGVybWlzc2lvbiI6dHJ1ZX0seyJuYW1lIjoibW9uaXRvcl9oaXN0b3J5X2dldCIsInBlcm1pc3Npb24iOnRydWV9LHsibmFtZSI6InVzZXJfYXV0aG9yaXphdGlvbl9nZXQiLCJwZXJtaXNzaW9uIjp0cnVlfSx7Im5hbWUiOiJzZW5kX2VycCIsInBlcm1pc3Npb24iOnRydWV9LHsibmFtZSI6ImNoYW5nZV9wcmVzZXRfYWxhcm1zIiwicGVybWlzc2lvbiI6dHJ1ZX0seyJuYW1lIjoiY2hhbmdlX3BhcmFtc19zZW5kX2VycCIsInBlcm1pc3Npb24iOnRydWV9LHsibmFtZSI6InBhcmFtc19zZW5kX2VycF9nZXQiLCJwZXJtaXNzaW9uIjp0cnVlfSx7Im5hbWUiOiJjcmVhdGVfdXNlciIsInBlcm1pc3Npb24iOnRydWV9LHsibmFtZSI6InNpY2tiZWRzX2dldCIsInBlcm1pc3Npb24iOnRydWV9LHsibmFtZSI6ImFsYXJtc19nZXQiLCJwZXJtaXNzaW9uIjp0cnVlfSx7Im5hbWUiOiJjaGFuZ2VfYWxhcm1zX3ZhbHVlcyIsInBlcm1pc3Npb24iOnRydWV9LHsibmFtZSI6ImdldF9wYXRpZW50IiwicGVybWlzc2lvbiI6dHJ1ZX0seyJuYW1lIjoidXNlci1sb2dzX2dldCIsInBlcm1pc3Npb24iOnRydWV9LHsibmFtZSI6Imhvc3BpdGFsX3VwZGF0ZSIsInBlcm1pc3Npb24iOmZhbHNlfSx7Im5hbWUiOiJ2aXRhbC1zaWduIiwicGVybWlzc2lvbiI6dHJ1ZX0seyJuYW1lIjoicHVsbW9uYXJ5LXZlbnRpbGF0b3IiLCJwZXJtaXNzaW9uIjp0cnVlfSx7Im5hbWUiOiJzaWNrYmVkX2dldCIsInBlcm1pc3Npb24iOnRydWV9XSwiaWF0IjoxNjExOTIxODI2fQ.-tlu7solZQMcuX8OSkN3XkoiDaRMkNkDvxM9XCP4VwM';
mockServers.fakeCustomOauth = {
    get: {
        '/': (req: Request, res: Response): void => {
            if (req.header('authorization') === 'Bearer '.concat(CUSTOM_TOKEN)) {
                res.sendStatus(200);
            } else {
                res.sendStatus(401);
            }
        },
    },
    post: {
        login: (req: Request, res: Response): void => {
            let alright: boolean = req.body?.idClient === 'custom_sys';
            alright = alright && req.body?.password === 'cu570m_s3cr37';

            if (!alright) {
                res.sendStatus(400);
            } else {
                res.send({
                    response: {
                        data: {
                            bearerToken: CUSTOM_TOKEN,
                        },
                    },
                });
            }
        },
        someCall: (_req: Request, res: Response): void => {
            res.sendStatus(200);
        },
    },
};

export const RESOURCE_FILE: string = 'test/mocks/http_servers/file_to_load.txt';
mockServers.resourceText = {
    get: {
        '/': (_req: Request, res: Response): void => {
            res.sendStatus(200);
        },
        text: (_req: Request, res: Response): void => {
            res.setHeader('content-type', ContentType.Text);
            res.send(fs.readFileSync('test/mocks/http_servers/file_to_load.txt').toString());
        },
    },
};

// End of mock logic ]]::..

let port: number = 8000;
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

            mock.app.get(ENDPOINT_HEALTH_CHECK, (_req: Request, res: Response): void => {
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

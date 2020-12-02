// cSpell: ignore PKCE
import crypto from 'crypto';
import needle, { NeedleHttpVerbs, NeedleResponse } from 'needle';
import { JWT } from './jwt';
import { Rejection } from './types';

interface PKCE {
    verifier: string;
    challenge: string;
}

interface ERROR {
    error: string;
    error_description: string;
}

interface Response {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
}

export interface ClientCredentials {
    clientId: string;
    clientSecret: string;
    serverURI: string;
}
export interface UserCredentials {
    clientId: string;
    username: string;
    password: string;
    serverURI: string;
    callbackURI: string;
}

const POST: NeedleHttpVerbs = 'post';
const RETURNED: string = 'Server returned: ';
const INVALID_RESPONSE: string = 'Invalid Server Response';
const AUTH: string = '/auth';
const TOKEN: string = '/token';
const ACCESS_TOKEN: string = 'access_token';
const CODE: string = 'code';
const PARAMS_REFRESH_TOKEN: string = 'grant_type=refresh_token&client_id={0}&refresh_token={1}';
const PARAMS_CLIENT_CREDENTIALS: string = 'grant_type=client_credentials&client_id={0}&client_secret={1}&scope=SCOPE1';
const PARAM_AUTH_CODE: string = 'grant_type=authorization_code&code={0}&code_verifier={1}&client_id={2}';
const PARAMS_CODE: string = 'response_type=code&client_id={0}&redirect_uri={1}&state=foobar&grant_type=implicit&' +
    'username={2}&password={3}&code_challenge={4}&code_challenge_method=S256';

export class Oauth2Client {

    private credentials: ClientCredentials | UserCredentials;
    private accessToken: JWT;
    private refreshToken: JWT;
    private publicKey: string;

    private base64URLEncode(buff: Buffer): string {
        return buff.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    private sha256(str: string): Buffer {
        return crypto.createHash('sha256').update(str).digest();
    }

    private genPkce(): PKCE {
        const result: PKCE = {
            verifier: this.base64URLEncode(crypto.randomBytes(32)),
            challenge: undefined,
        };

        result.challenge = this.base64URLEncode(this.sha256(result.verifier));
        return result;
    }

    private getError(body: string): Error {
        try {
            const e: ERROR = JSON.parse(body);
            const error: Error = new Error(e.error_description || e.error);
            error.name = e.error || INVALID_RESPONSE;
            return error;
        } catch {
            const error: Error = new Error(RETURNED + body.toString());
            error.name = INVALID_RESPONSE;
            return error;
        }

    }

    private async authenticateClient(): Promise<JWT> {
        return new Promise((resolve: Function, reject: Rejection): void => {
            const c: ClientCredentials = this.credentials as ClientCredentials;
            needle(POST, c.serverURI + TOKEN, PARAMS_CLIENT_CREDENTIALS.format(c.clientId, c.clientSecret), { parse: false })
                .then((r: NeedleResponse) => {
                    if (!r.body || r.body.toString().indexOf(ACCESS_TOKEN) === -1) {
                        reject(this.getError(r.body));
                    } else {
                        try {
                            const response: Response = JSON.parse(r.body.toString());
                            this.accessToken = new JWT(response.access_token, this.publicKey);
                            resolve(this.accessToken);
                        } catch (e) {
                            reject(e);
                        }
                    }
                }).catch(reject);
        });
    }

    private async authenticateUser(): Promise<JWT> {
        return new Promise((resolve: Function, reject: Rejection): void => {
            const c: UserCredentials = this.credentials as UserCredentials;
            const pkce: PKCE = this.genPkce();
            needle(POST, this.credentials.serverURI + AUTH,
                PARAMS_CODE.format(c.clientId, c.callbackURI, c.username, c.password, pkce.challenge)
                , { parse: false })
                .then((r: NeedleResponse) => {
                    if (!r.body || r.body.toString().indexOf(CODE) === -1) {
                        reject(this.getError(r.body));
                    } else {
                        needle(POST, c.serverURI + TOKEN,
                            PARAM_AUTH_CODE.format(encodeURIComponent(JSON.parse(r.body.toString()).code), pkce.verifier, c.clientId),
                            { parse: false })
                            .then((r2: NeedleResponse) => {
                                if (!r2.body || r2.body.indexOf(ACCESS_TOKEN) === -1) {
                                    reject(this.getError(r2.body));
                                } else {
                                    try {
                                        const response: Response = JSON.parse(r2.body.toString());
                                        this.accessToken = new JWT(response.access_token);
                                        if (response.refresh_token) {
                                            this.refreshToken = new JWT(response.refresh_token);
                                        }
                                        resolve(this.accessToken);
                                    } catch {
                                        reject(this.getError(r2.body));
                                    }
                                }
                            }).catch((e: Error) => {
                                reject(e);
                            });
                    }
                }).catch(reject);
        });
    }

    public isTokenExpired(): boolean {
        return this.accessToken?.isExpired();
    }

    public async keepFresh(): Promise<void> {
        return new Promise((resolve: Function, reject: Rejection): void => {
            if (this.accessToken && !this.isTokenExpired()) {
                resolve();
            } else {
                if (this.refreshToken) {
                    needle(POST, this.credentials.serverURI + TOKEN,
                        PARAMS_REFRESH_TOKEN.format(this.refreshToken.clientId, this.refreshToken.toString()),
                        { parse: false })
                        .then((r: NeedleResponse) => {
                            if (!r.body || r.body.toString().indexOf(ACCESS_TOKEN) === -1) {
                                reject(this.getError(r.body));
                            } else {
                                try {
                                    const response: Response = JSON.parse(r.body.toString());
                                    this.accessToken = new JWT(response.access_token);
                                    this.refreshToken = new JWT(response.refresh_token);
                                    resolve();
                                } catch {
                                    reject(this.getError(r.body));
                                }
                            }
                        }).catch(reject);
                } else {
                    if ((this.credentials as UserCredentials).username) {
                        this.authenticateUser().then(() => { resolve(); }).catch(reject);
                    } else {
                        this.authenticateClient()
                            .then(() => { resolve(); }).catch(reject);
                    }
                }
            }
        });
    }

    public setPublicKey(publicKey: string): Oauth2Client {
        this.publicKey = publicKey;
        return this;
    }
    public setClient(clientId: string, clientSecret: string, serverURI: string): Oauth2Client {
        this.credentials = {
            clientId: clientId,
            clientSecret: clientSecret,
            serverURI: serverURI,
        };
        return this;
    }

    public setUser(clientId: string, username: string, password: string, serverURI?: string, callbackURI?: string): Oauth2Client {
        this.credentials = {
            clientId: clientId,
            username: username,
            password: password,
            serverURI: serverURI,
            callbackURI: callbackURI,
        };
        return this;
    }

    public isAuthenticated(): boolean {
        return !!this.accessToken;
    }

    public async getBearerToken(): Promise<JWT> {
        return new Promise((resolve: Function, reject: Rejection): void => {
            this.keepFresh().then(() => {
                resolve(this.accessToken);
            }).catch((e: Error) => {
                reject(e);
            });
        });
    }
}
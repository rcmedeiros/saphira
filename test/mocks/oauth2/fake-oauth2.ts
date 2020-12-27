import { Rejection, Resolution } from '../../../src';

import { JWT_KEY } from '../../../src/constants/settings';
import NodeRSA from 'node-rsa';
import { Vault } from '../../../src/vault';
import crypto from 'crypto';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { v4 } from 'uuid';

const SERVER: string = 'https://oauth2.fake.com';

interface SysReg {
    [clientId: string]: { secret: string };
}
interface UsrReg {
    [username: string]: { clientId: string; password: string };
}

interface Config {
    publicKey: string;
    privateKey: string;
    clients: SysReg;
    users: UsrReg;
}
interface JWT {
    iss: string;
    iat?: number;
    sub: string;
    sid: number;
    aud: string;
    nbf: number;
    exp: number;
    jti: string;
    typ: 'A' | 'R';
    role: Array<string>;
}

export interface TokenResponse {
    access_token: string;
    refresh_token?: string;
    token_type: string;
    expires_in: number;
}

export interface CodeResponse {
    code: string;
    state: string;
}

export interface ErrorResponse {
    error: string;
    error_description?: string;
}

export class FakeOauth2 {
    private readonly privateKey: string;
    private readonly cypher: NodeRSA;
    private readonly decipher: NodeRSA;
    private readonly systems: SysReg;
    private readonly users: UsrReg;

    constructor() {
        const config: Config = JSON.parse(fs.readFileSync('test/mocks/oauth2/oauth2_config.json').toString());
        this.privateKey = config.privateKey;
        Vault.getInstance().set(JWT_KEY, config.publicKey);

        this.cypher = new NodeRSA(config.publicKey);
        this.decipher = new NodeRSA(config.privateKey);

        this.systems = config.clients;
        this.users = config.users;
    }

    private verify(challenge: string, verifier: string): boolean {
        return (
            crypto
                .createHash('sha256')
                .update(verifier)
                .digest()
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '') === challenge
        );
    }

    public async clientCredentials(clientId: string, clientSecret: string): Promise<TokenResponse | ErrorResponse> {
        return new Promise((resolve: Resolution<TokenResponse | ErrorResponse>, reject: Rejection): void => {
            if (!this.systems[clientId] || this.systems[clientId].secret !== clientSecret) {
                resolve({
                    error: 'access_denied',
                    error_description: 'The resource owner or authorization server denied the request.',
                });
            } else {
                const now: number = Math.floor(Date.now() / 1000);
                const jwtObj: JWT = {
                    iss: SERVER,
                    sub: clientId,
                    sid: Number().pseudoRandom(10, 99),
                    aud: `${SERVER}/auth`,
                    nbf: now,
                    exp: now + 1,
                    jti: v4(),
                    typ: 'A',
                    role: ['system'],
                };

                jwt.sign(jwtObj, this.privateKey, { algorithm: 'RS256' }, (err: Error, encoded: string) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({
                            access_token: encoded,
                            token_type: 'Bearer',
                            expires_in: jwtObj.exp,
                        });
                    }
                });
            }
        });
    }

    public async authorizationCode(code: string, verifier: string): Promise<TokenResponse | ErrorResponse> {
        return new Promise((resolve: Resolution<TokenResponse | ErrorResponse>, reject: Rejection): void => {
            let args: { username: string; challenge: string };
            try {
                args = this.decipher.decrypt(code, 'json');
            } catch (e) {
                reject(e);
            }
            if (!this.verify(args.challenge, verifier)) {
                resolve({
                    error: 'invalid_grant',
                });
            } else {
                const now: number = Math.floor(Date.now() / 1000);
                const accessObj: JWT = {
                    iss: SERVER,
                    sub: args.username,
                    sid: Number().pseudoRandom(1000, 9999),
                    aud: `${SERVER}/auth`,
                    nbf: now,
                    exp: now + 1,
                    jti: v4(),
                    typ: 'A',
                    role: ['system'],
                };
                const refreshObj: JWT = { ...accessObj };
                refreshObj.typ = 'R';
                refreshObj.exp = now + 656000000;

                jwt.sign(accessObj, this.privateKey, { algorithm: 'RS256' }, (err: Error, accessToken: string) => {
                    if (err) {
                        reject(err);
                    } else {
                        jwt.sign(
                            refreshObj,
                            this.privateKey,
                            { algorithm: 'RS256' },
                            (err2: Error, refreshToken: string) => {
                                if (err2) {
                                    reject(err2);
                                } else {
                                    resolve({
                                        access_token: accessToken,
                                        refresh_token: refreshToken,
                                        token_type: 'Bearer',
                                        expires_in: accessObj.exp,
                                    });
                                }
                            },
                        );
                    }
                });
            }
        });
    }

    public async getAuthorizationCode(
        clientId: string,
        username: string,
        password: string,
        challenge: string,
    ): Promise<CodeResponse | ErrorResponse> {
        return new Promise((resolve: Resolution<CodeResponse | ErrorResponse>, reject: Rejection): void => {
            if (
                !this.users[username] ||
                this.users[username].clientId !== clientId ||
                this.users[username].password !== password
            ) {
                resolve({
                    error: 'access_denied',
                    error_description: 'The resource owner or authorization server denied the request.',
                });
            } else {
                try {
                    resolve({
                        code: this.cypher.encrypt(
                            JSON.stringify({
                                clientId: clientId,
                                username: username,
                                password: password,
                                challenge: challenge,
                            }),
                            'base64',
                        ),
                        state: 'TESTING',
                    });
                } catch (e) {
                    reject(e);
                }
            }
        });
    }

    public async refreshToken(refreshToken: string): Promise<TokenResponse> {
        return new Promise((resolve: Resolution<TokenResponse>, reject: Rejection): void => {
            jwt.verify(
                refreshToken,
                Vault.getInstance().get(JWT_KEY) as string,
                { ignoreExpiration: true },
                (err: Error, verified: JWT) => {
                    if (err) {
                        reject(err);
                    } else {
                        const now: number = Math.floor(Date.now() / 1000);
                        const accessObj: JWT = {
                            iss: SERVER,
                            sub: verified.sub,
                            sid: verified.sid,
                            aud: `${SERVER}/auth`,
                            nbf: now,
                            exp: now + 1,
                            jti: verified.jti,
                            typ: 'A',
                            role: verified.role,
                        };
                        const refreshObj: JWT = { ...accessObj };
                        refreshObj.typ = 'R';
                        refreshObj.exp = now + 656000000;

                        jwt.sign(
                            accessObj,
                            this.privateKey,
                            { algorithm: 'RS256' },
                            (err2: Error, newAccessToken: string) => {
                                if (err2) {
                                    reject(err2);
                                } else {
                                    jwt.sign(
                                        refreshObj,
                                        this.privateKey,
                                        { algorithm: 'RS256' },
                                        (err3: Error, newRefreshToken: string) => {
                                            if (err3) {
                                                reject(err3);
                                            } else {
                                                resolve({
                                                    access_token: newAccessToken,
                                                    refresh_token: newRefreshToken,
                                                    token_type: 'Bearer',
                                                    expires_in: accessObj.exp,
                                                });
                                            }
                                        },
                                    );
                                }
                            },
                        );
                    }
                },
            );
        });
    }
}

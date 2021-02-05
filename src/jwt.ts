import { JWT_CLOCK_TOLERANCE, JWT_KEY, JWT_OPTS } from './constants/settings';
import { VerifyOptions, decode, verify } from 'jsonwebtoken';

import { ForbiddenError } from './errors/forbidden-error';
import { NameValue } from '../src';
import { ServerError } from './errors/server-error';
import { UnauthorizedError } from './errors/unauthorized-error';
import { Vault } from './vault';

const SAFETY_MARGIN: number = parseInt(process.env.TOKEN_SAFETY_MARGIN || '5000');

interface Decoded {
    iss: string;
    sub: string;
    sid: number;
    aud: string;
    nbf: number;
    exp: number;
    jti: string;
    typ: string;
    role: Array<string>;
    iat: number;
}

export class JWT {
    private static publicKey: string;
    private static opts: VerifyOptions;

    private _token: string;
    private _subject: string;
    private _expiresAt: Date;
    private _clientId: number;

    public constructor(token: string, customPublicKey?: string) {
        const vault: Vault = Vault.getInstance();

        JWT.publicKey = customPublicKey || (vault.get(JWT_KEY) as string);
        JWT.opts = { ...{ clockTolerance: JWT_CLOCK_TOLERANCE }, ...(vault.get(JWT_OPTS) as VerifyOptions) };

        if (token) {
            if (JWT.publicKey) {
                verify(
                    token.startsWith('Bearer ') ? token.substring(7) : token,
                    JWT.publicKey,
                    JWT.opts,
                    (err: Error, decoded: Decoded): void => {
                        if (err) {
                            switch (err.message) {
                                case 'jwt expired':
                                case 'invalid token':
                                case 'jwt malformed':
                                    throw new UnauthorizedError(err.message);
                                default:
                                    throw new ServerError(err.message);
                            }
                        } else {
                            this._token = token;
                            this._subject = decoded.sub;
                            this._expiresAt = new Date(decoded.exp * 1000);
                        }
                    },
                );
            } else {
                const decoded: unknown = decode(token.startsWith('Bearer ') ? token.substring(7) : token, {
                    json: true,
                });
                // eslint-disable-next-line no-null/no-null
                if (decoded === null) {
                    throw new UnauthorizedError('No Bearer Token');
                } else {
                    this._token = token;
                }
            }
        } else {
            throw new UnauthorizedError('No Bearer Token');
        }
    }

    public tryForSubjects(allowedSubjects: Array<string>): void {
        if (allowedSubjects.indexOf(this._subject) < 0) {
            throw new ForbiddenError();
        }
    }

    public isExpired(): boolean {
        return this._expiresAt.getTime() <= new Date().getTime() - SAFETY_MARGIN;
    }

    public setSubjectFromPath(subjectPath: string): JWT {
        if (subjectPath) {
            const path: Array<string> = subjectPath.split('.');
            let tmp: NameValue = decode(this._token, { json: true });
            path.forEach((prop: string) => {
                if (tmp[prop]) {
                    tmp = tmp[prop] as NameValue;
                }
            });
            this._subject = (tmp as unknown) as string;
        }
        return this;
    }

    public setExpiration(seconds: number): JWT {
        if (seconds) {
            let iat: number = decode(this._token, { json: true })?.iat;
            iat = iat || new Date().getTime() / 1000;
            this._expiresAt = new Date((iat + seconds) * 1000);
        }
        return this;
    }

    public get clientId(): number {
        return this._clientId;
    }

    public toString(): string {
        return this._token;
    }
}

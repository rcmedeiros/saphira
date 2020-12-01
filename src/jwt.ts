import { verify, VerifyOptions } from 'jsonwebtoken';
import { JWT_CLOCK_TOLERANCE, JWT_KEY, JWT_OPTS } from './constants/settings';
import { ForbiddenError } from './errors/forbidden-error';
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
    private _issuer: string;
    private _subject: string;
    private _sId: number;
    private _audience: string;
    private _notBefore: Date;
    private _expiresAt: Date;
    private _jwtId: string;
    private _roles: Array<string>;
    private _issuedAt: Date;
    private _username: string;
    private _clientId: number;

    public constructor(token: string, customPublicKey?: string) {
        const vault: Vault = Vault.getInstance();

        JWT.publicKey = customPublicKey || vault.get(JWT_KEY) as string;
        JWT.opts = { ...{ clockTolerance: JWT_CLOCK_TOLERANCE }, ...vault.get(JWT_OPTS) as VerifyOptions };

        if (token) {

            verify(token.startsWith('Bearer ') ? token.substring(7) : token, JWT.publicKey, JWT.opts, (err: Error, decoded: Decoded): void => {
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
                    this._issuer = decoded.iss;
                    this._subject = decoded.sub;
                    this._sId = decoded.sid;
                    this._audience = decoded.aud;
                    this._notBefore = new Date(decoded.nbf * 1000);
                    this._expiresAt = new Date(decoded.exp * 1000);
                    this._jwtId = decoded.jti;
                    this._roles = decoded.role;
                    this._issuedAt = new Date(decoded.iat * 1000);

                    const user: Array<string> = this._subject.split('@');
                    if (user.length === 2) {
                        this._username = user[0];
                        this._clientId = user[1].isNumeric() ? parseInt(user[1]) : undefined;
                    }
                }
            });
        } else {
            throw new UnauthorizedError('No Bearer Token');
        }
    }

    public tryForSubjects(allowedSubjects: Array<string>): void {
        if (allowedSubjects.indexOf(this._subject) < 0) {
            throw new ForbiddenError();
        }
    }

    public tryForRoles(allowedRoles: Array<string>): void {
        if (!this._roles || allowedRoles.every((allowedRole: string) => this._roles.indexOf(allowedRole) < 0)) {
            throw new ForbiddenError();
        }
    }

    public isExpired(): boolean {
        return this.expiresAt.getTime() <= (new Date().getTime() - SAFETY_MARGIN);
    }

    public get issuedAt(): Date {
        return this._issuedAt;
    }
    public set issuedAt(v: Date) {
        this._issuedAt = v;
    }

    public get roles(): Array<string> {
        return this._roles;
    }
    public set roles(v: Array<string>) {
        this._roles = v;
    }

    public get jwtId(): string {
        return this._jwtId;
    }
    public set jwtId(v: string) {
        this._jwtId = v;
    }

    public get expiresAt(): Date {
        return this._expiresAt;
    }
    public set expiresAt(v: Date) {
        this._expiresAt = v;
    }

    public get notBefore(): Date {
        return this._notBefore;
    }
    public set notBefore(v: Date) {
        this._notBefore = v;
    }

    public get audience(): string {
        return this._audience;
    }
    public set audience(v: string) {
        this._audience = v;
    }

    public get sId(): number {
        return this._sId;
    }
    public set sId(v: number) {
        this._sId = v;
    }

    public get subject(): string {
        return this._subject;
    }
    public set subject(v: string) {
        this._subject = v;
    }

    public get issuer(): string {
        return this._issuer;
    }
    public set issuer(v: string) {
        this._issuer = v;
    }

    public get username(): string {
        return this._username;
    }
    public set username(v: string) {
        this._username = v;
    }

    public get clientId(): number {
        return this._clientId;
    }
    public set clientId(v: number) {
        this._clientId = v;
    }

    public toString(): string {
        return this._token;
    }
}

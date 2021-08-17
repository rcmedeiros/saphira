import { Commitment, Retries } from '../commitment';
import { Rejection, Resolution } from '../types';
import { envVarAsNumber, envVarAsObject } from '../helpers';

import { ENV_RETRIES } from '../constants/settings';

export class Connection {
    private _lastSuccess: Date;
    private _lastError: Error;
    private _isRequired: boolean = true;
    private retries: number | Retries;
    protected readonly name: string;

    constructor(name: string) {
        this.name = name;

        const prefix: string = !!name ? name.toUpperCase() : undefined;

        const retries: number = envVarAsNumber(ENV_RETRIES, prefix);
        this.retries =
            (envVarAsObject(ENV_RETRIES, prefix) as Retries) || retries !== undefined
                ? retries
                : { times: 20, waitTime: 30 };
    }

    private fail(e: Error): void {
        console.error(e);
        this._lastError = e;
    }

    private success(): void {
        this._lastSuccess = new Date();
    }

    protected async do<T>(p: Promise<T>): Promise<T> {
        return new Commitment(this.retries, (resolve: Resolution<T>, reject: Rejection): void => {
            p.then((result: T) => {
                this.success();
                resolve(result);
            }).catch((e: Error) => {
                this.fail(e);
                reject(e);
            });
        });
    }

    public get lastSuccess(): Date {
        return this._lastSuccess;
    }

    public get lastError(): Error {
        return this._lastError;
    }

    public get isRequired(): boolean {
        return this._isRequired;
    }

    public set isRequired(v: boolean) {
        this._isRequired = v;
    }
}

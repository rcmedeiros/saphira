import { Commitment, Retries } from '../commitment';
import { ENV_RETRIES, HALF_MINUTES_IN_A_WEEK } from '../constants/settings';
import { Rejection, Resolution } from '../types';
import { envVarAsNumber, envVarAsObject } from '../helpers';

export class Connection {
    private _lastSuccess: Date;
    private _lastError: Error;
    private _isRequired: boolean = true;
    private retries: number | Retries;
    protected readonly name: string;

    constructor(name: string) {
        this.name = name;

        const retries2: number = envVarAsNumber(ENV_RETRIES);
        this.retries =
            (envVarAsObject(ENV_RETRIES) as Retries) || retries2 !== undefined
                ? retries2
                : { times: HALF_MINUTES_IN_A_WEEK, waitTime: 30 };
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

import { Rejection, Resolution } from '../types';

export class Connection {
    private _lastSuccess: Date;
    private _lastError: Error;
    private _isRequired: boolean = true;
    protected readonly name: string;

    constructor(name: string) {
        this.name = name;
    }

    private fail(e: Error): void {
        console.error(e);
        this._lastError = e;
    }

    private success(): void {
        this._lastSuccess = new Date();
    }

    protected async do<T>(p: Promise<T>): Promise<T> {
        return new Promise((resolve: Resolution<T>, reject: Rejection): void => {
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

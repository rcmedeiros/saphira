// import { CloudMetrics } from '../cloud_metrics';
import { Rejection, Resolution } from '../types';
// import { Vault } from '../vault';

// const WATCH: string = 'watch';

// interface Watch {
//     name: string;
//     error: {
//         name: string;
//         message: string;
//     };
//     metric: {
//         name: string;
//         value: number;
//     };
// }
// type MonitorArray = Array<Watch>;
export class Connection {
    // private readonly monitor: MonitorArray;
    // private readonly cloudMetrics: CloudMetrics;
    private _lastSuccess: Date;
    private _lastError: Error;
    private _isRequired: boolean = true;
    protected readonly name: string;

    constructor(name: string) {
        this.name = name;
        // this.monitor = Vault.getInstance().get(WATCH) as MonitorArray || [];
        // this.cloudMetrics = CloudMetrics.getInstance();
    }
    /*
        private watch(e: Error): void {
            this.monitor.forEach((m: Watch) => {
                if (m.name === this.name && m.error.name === e.name) {
                    if (!m.error.message || e.message.contains(m.error.message)) {
                        this.cloudMetrics.post(m.metric.name, m.metric.value).catch((err: Error) => { console.error(err); });
                    }
                }
            });
        }
    */
    private fail(e: Error): void {
        // this.watch(e);
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

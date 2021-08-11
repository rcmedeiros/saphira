import { Rejection } from './';

export declare type Resolution<T> = (value?: T | PromiseLike<T>) => void;
declare type Executor<T> = (resolve: Resolution<T>, reject: Rejection) => void;
declare type OnBeforeRetry = (reason: Error, attempt: number) => Promise<void>;

export interface Retries {
    times: number;
    waitTime: number;
    exceptWhen?: Array<string>;
}

export class Commitment<T> implements Promise<T>, PromiseLike<T> {
    private readonly promise: Promise<T>;
    private readonly exceptions: Array<string>;
    private readonly onBeforeRetry: OnBeforeRetry;
    private resolve: Resolution<T>;
    private giveUp: Rejection;
    private attempt: number;

    constructor(
        retries: number | Retries,
        executor: (resolve: Resolution<T>, reject: Rejection) => void,
        onBeforeRetry?: (reason: Error, attempt: number) => Promise<void>,
    ) {
        this.attempt = 0;
        this.onBeforeRetry = onBeforeRetry;
        this.promise = new Promise((resolve: Resolution<T>, reject: Rejection): void => {
            this.resolve = resolve;
            this.giveUp = reject;
        });
        const retry: Retries = typeof retries === 'number' ? { times: retries, waitTime: 0 } : retries;
        retry.times = retry.times >= 0 ? retry.times : 0;

        if (retry.exceptWhen) {
            this.exceptions = [];
            retry.exceptWhen.forEach((e: string) => {
                this.exceptions.push(e.toLowerCase());
            });
        }

        this.execute(executor, retry);
    }

    private bother(reason: Error): boolean {
        if (this.exceptions) {
            for (const s of this.exceptions) {
                if (reason.name.toLowerCase().indexOf(s) >= 0 || reason.message.toLowerCase().indexOf(s) >= 0) {
                    return false;
                }
            }
        }
        return true;
    }

    private canRetry(reason: Error): Promise<void> {
        if (this.onBeforeRetry) {
            return this.onBeforeRetry(reason, ++this.attempt);
        } else {
            return Promise.resolve();
        }
    }

    private doRetry(reason: Error, executor: Executor<T>, retry: Retries): void {
        this.canRetry(reason)
            .then(() => {
                setTimeout(() => {
                    this.execute(executor, retry);
                }, retry.waitTime);
            })
            .catch((err: Error) => {
                if (err) {
                    const e: Error = new Error(`Unable to meet preconditions to retry: ${err.message}`);
                    e.stack = `${e.stack.split('\n').slice(0, 2).join('\n')}\n${err.stack}`;
                    this.giveUp(e);
                } else {
                    this.giveUp(new Error('Unable to meet preconditions to retry'));
                }
            });
    }

    private execute(executor: Executor<T>, retry: Retries): void {
        executor(
            (resolution?: T | PromiseLike<T>): void => {
                this.resolve(resolution);
            },
            (reason: Error): void => {
                if (this.bother(reason) && retry.times-- > 0) {
                    this.doRetry(reason, executor, retry);
                } else {
                    this.giveUp(reason);
                }
            },
        );
    }

    public async then<TResult1 = T, TResult2 = never>(
        onFulfilled?: (value: T) => TResult1 | PromiseLike<TResult1>,
        onRejected?: (reason: unknown) => TResult2 | PromiseLike<TResult2>,
    ): Promise<TResult1 | TResult2> {
        return this.promise.then(onFulfilled, onRejected);
    }

    public async catch<TResult = never>(
        onRejected?: (reason: unknown) => TResult | PromiseLike<TResult>,
    ): Promise<T | TResult> {
        return this.promise.catch(onRejected);
    }

    public async finally(onFinally?: () => void): Promise<T> {
        return this.promise.finally(onFinally);
    }

    public get [Symbol.toStringTag](): string {
        return 'Commitment';
    }
}

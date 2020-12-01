export interface NameValue { [name: string]: unknown; }
export interface StringSet { [name: string]: string; }
export type Rejection = (reason: Error) => void; // Sugar Syntax to allow .catch(reject) or .catch(console)
export declare type Resolution<T> = (value?: T | PromiseLike<T>) => void;

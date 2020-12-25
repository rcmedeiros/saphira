import * as http from 'http';

export interface Express {
    use(...handlers: Array<unknown>): unknown;
    get(...handlers: Array<unknown>): unknown;
    set(setting: string, value: unknown): unknown;

    listen(port: number, hostname: string, backlog: number, callback?: (...args: Array<unknown>) => void): http.Server;
    listen(port: number, hostname: string, callback?: (...args: Array<unknown>) => void): http.Server;
    listen(port: number | string, callback?: (...args: Array<unknown>) => void): http.Server;
    listen(callback?: (...args: Array<unknown>) => void): http.Server;
    listen(handle: unknown, listeningListener?: () => void): http.Server;
}

export interface Request {
    headers: { [header: string]: string };
    body: { [name: string]: string };
    query: { [name: string]: string };
    params: { [name: string]: string };
}

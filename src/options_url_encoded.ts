import * as http from 'http';

// clone of body-parser for IoC
export interface OptionsUrlencoded {
    inflate?: boolean;
    limit?: number | string;
    type?: string | Array<string> | ((req: http.IncomingMessage) => unknown);
    extended?: boolean;
    parameterLimit?: number;
    verify?(req: http.IncomingMessage, res: http.ServerResponse, buf: Buffer, encoding: string): void;
}

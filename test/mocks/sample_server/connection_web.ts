import { Controller, Method, Type } from '../../../src/';

import { Adapters } from '../../../src/adapter/adapters';
import { WebResponse } from '../../../src/adapter/web-response';

export const ID: string = 'WebServer';

export class ConnectionWebServer extends Controller {
    public constructor(apiPath?: string) {
        super(apiPath, { description: 'Test Web Server' });

        this.route('pureGet', { method: Method.GET, action: this.pureGet, response: { type: Type.Number } });
        this.route('getUrlEncoded', {
            method: Method.GET,
            action: this.getUrlEncoded,
            response: { type: Type.Number },
        });
        this.route('getWithObject', {
            method: Method.GET,
            action: this.getWithObject,
            response: { type: Type.Number },
        });
        this.route('purePost', { method: Method.GET, action: this.purePost, response: { type: Type.Number } });
        this.route('postUrlEncoded', {
            method: Method.GET,
            action: this.postUrlEncoded,
            response: { type: Type.Number },
        });
        this.route('postWithObject', {
            method: Method.GET,
            action: this.postWithObject,
            response: { type: Type.Number },
        });
        this.route('purePut', { method: Method.GET, action: this.purePut, response: { type: Type.Number } });
        this.route('purePatch', { method: Method.GET, action: this.purePatch, response: { type: Type.Number } });
        this.route('pureHead', { method: Method.GET, action: this.pureHead, response: { type: Type.Number } });
        this.route('pureDelete', { method: Method.GET, action: this.pureDelete, response: { type: Type.Number } });
        // this.route('restricted', {
        //     method: Method.GET,
        //     action: this.postWithObject,
        //     response: { type: Type.Number },
        //     restricted: true,
        // });
    }

    public pureGet = async (): Promise<number> => {
        const result: WebResponse = await Adapters.getWebService(/* use default name */).get();
        return result.statusCode === 200 ? 1 : -1;
    };

    public getUrlEncoded = async (): Promise<number> => {
        const result: WebResponse = await Adapters.getWebService(ID).get('/endpoint', 'a=1&b=2&c=3&d={revenant}');
        return result.statusCode === 200 ? 1 : -1;
    };

    public getWithObject = async (): Promise<number> => {
        const result: WebResponse = await Adapters.getWebService(ID).get('/endpoint', {
            d: 1,
            e: 2,
            f: 3,
            g: '{revenant}',
        });
        return result.statusCode === 200 ? 1 : -1;
    };

    public purePost = async (): Promise<number> => {
        const result: WebResponse = await Adapters.getWebService(ID).post('/endpoint');
        return result.statusCode === 200 ? 1 : -1;
    };

    public postUrlEncoded = async (): Promise<number> => {
        const result: WebResponse = await Adapters.getWebService(ID).post('/endpoint', 'h=1&i=2&j=3&k={revenant}');
        return result.statusCode === 200 ? 1 : -1;
    };

    public postWithObject = async (): Promise<number> => {
        const result: WebResponse = await Adapters.getWebService(ID).post('/endpoint', {
            l: 1,
            m: 2,
            n: 3,
            o: '{revenant}',
        });
        return result.statusCode === 200 ? 1 : -1;
    };

    public purePut = async (): Promise<number> => {
        const result: WebResponse = await Adapters.getWebService(ID).put('/endpoint');
        return result.statusCode === 200 ? 1 : -1;
    };
    public purePatch = async (): Promise<number> => {
        const result: WebResponse = await Adapters.getWebService(ID).patch('/endpoint');
        return result.statusCode === 200 ? 1 : -1;
    };
    public pureHead = async (): Promise<number> => {
        const result: WebResponse = await Adapters.getWebService(ID).head('/endpoint');
        return result.statusCode === 200 ? 1 : -1;
    };
    public pureDelete = async (): Promise<number> => {
        const result: WebResponse = await Adapters.getWebService(ID).delete('/endpoint');
        return result.statusCode === 200 ? 1 : -1;
    };
}

import { Controller, Method, Type } from '../../src/index';

export class BadControllerInvalidJsonPayload extends Controller {

    public constructor(apiPath?: string) {
        super(apiPath, { description: 'Test BadController' });

        this.route('operation2', {
            tag: {
                summary: "bad operation",
            },
            method: Method.POST,
            action: this.operation2,
            payload: {
                type: Type.String,
            },
            response: { type: Type.ObjectArray },
        });
    }

    public operation2 = (a?: unknown): Promise<Array<unknown>> =>
        Promise.reject(new Error('Should never be possible'))

}

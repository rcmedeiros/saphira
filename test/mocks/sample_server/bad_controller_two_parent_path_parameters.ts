import { Controller, Method, Type } from '../../../src/index';

export class BadControllerTwoParentPathParameters extends Controller {
    public constructor(apiPath?: string) {
        super(apiPath, { description: 'Test BadController' });

        this.route('operation2', {
            tag: {
                summary: "Service 1's operation 1",
            },
            method: Method.GET,
            action: this.operation2,
            params: [
                {
                    name: 'a',
                    type: Type.Number,
                    parentPath: true,
                    description: 'Invalid parameter',
                    example: false,
                },
                {
                    name: 'b',
                    type: Type.Number,
                    parentPath: true,
                    description: 'Invalid parameter',
                    example: false,
                },
            ],
            response: { type: Type.HttpModified },
        });
    }

    public operation2 = (_a?: unknown, _b?: unknown): Promise<Array<unknown>> =>
        Promise.reject(new Error('Should never be possible'));
}

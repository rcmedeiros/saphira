import { Controller, Method, Type } from '../../../src/index';

export class BadControllerInvalidParameterType extends Controller {
    public constructor(apiPath?: string) {
        super(apiPath, { description: 'Test BadController' });

        this.route('operation2', {
            tag: {
                summary: "Service 1's operation 1",
                description: 'Accepts all data types in the query and returns an array of the results',
            },
            method: Method.GET,
            action: this.operation2,
            params: [
                {
                    name: 'a',
                    type: Type.HttpAccepted,
                    description: 'Invalid parameter',
                    example: false,
                },
            ],
            response: { type: Type.ObjectArray, description: 'An array representing all the parameters' },
        });
    }

    public operation2 = (_a?: unknown): Promise<Array<unknown>> =>
        Promise.reject(new Error('Should never be possible'));
}

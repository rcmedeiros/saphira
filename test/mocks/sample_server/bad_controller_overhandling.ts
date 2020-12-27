import { Controller, Method, Resolution, Type } from '../../../src/index';

export class BadControllerOverhandling extends Controller {
    public constructor(apiPath?: string) {
        super(apiPath, { description: 'Test BadController' });

        this.route('doSomething', {
            tag: {
                summary: 'Do that thing',
                description: "Does the thing you think it's done",
            },
            method: Method.GET,
            action: this.doSomething,
            params: [
                {
                    name: 'stringValue',
                    type: Type.String,
                    description: 'Any string',
                },
                {
                    name: 'numberValue',
                    type: Type.Number,
                    description: 'Any number',
                },
            ],
            response: { type: Type.Object, description: 'The Thing' },
        });
        this.route('doSomething', {
            tag: {
                summary: 'Do that thing',
                description: "Does the thing you think it's done",
            },
            method: Method.GET,
            action: this.doSomething,
            params: [
                {
                    name: 'stringValue',
                    type: Type.String,
                    description: 'Any string',
                },
                {
                    name: 'numberValue',
                    type: Type.Number,
                    description: 'Any number',
                },
            ],
            response: { type: Type.Object, description: 'The Thing' },
        });
    }

    public doSomething = async (stringValue: string, numberValue: number): Promise<Array<string>> =>
        new Promise((resolve: Resolution<Array<string>>): void => {
            setTimeout(() => {
                resolve(['The', 'Thing', stringValue, numberValue ? numberValue.toString() : undefined]);
            }, numberValue);
        });
}

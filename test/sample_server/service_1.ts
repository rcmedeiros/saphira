// cSpell: ignore Kaladin Dalinar Adolin Renarin Sylphrena Glys Wyndle Stormfather
import { Controller, Method, Type } from '../../src/index';

interface SampleObject {
    name: string;
    age: number;
    active: boolean;
}
export class Service1 extends Controller {

    public constructor(apiPath?: string) {
        super(apiPath, { description: 'Test Service1' });

        this.route('getOptional', {
            tag: {
                summary: `Do that thing`,
                description: 'Does the thing you think it\'s done',
            },
            method: Method.GET,
            action: this.getOptionalReturnArray,
            params:
                [{
                    name: 'a',
                    type: Type.Boolean,
                    description: 'Boolean',
                    example: false,
                }, {
                    name: 'b', type: Type.Date,
                    description: 'Date',
                    example: new Date(Date.UTC(1980, 5, 9)),
                }, {
                    name: 'c', type: Type.DateTime,
                    description: 'DateTime',
                    example: new Date(Date.UTC(1980, 5, 9, 16, 0)),
                }, {
                    name: 'd', type: Type.Number,
                    description: 'Number',
                    example: 123,
                }, {
                    name: 'e', type: Type.NumberArray,
                    description: 'NumberArray',
                    example: [1, 2, 3],
                }, {
                    name: 'f', type: Type.Object,
                    description: 'Object',
                    example: { name: 'Kaladin', age: 20 },
                }, {
                    name: 'g', type: Type.ObjectArray,
                    description: 'ObjectArray',
                    example: [{ name: 'Dalinar', age: 53 }, { name: 'Adolin', age: 25 }, { name: 'Renarin', age: 21 }],
                }, {
                    name: 'h', type: Type.Password,
                    description: 'Password',
                    example: 'abc123'
                }, {
                    name: 'i', type: Type.String,
                    description: 'String',
                    example: 'Sylphrena',
                }, {
                    name: 'j', type: Type.StringArray,
                    description: 'StringArray',
                    example: ['Sylphrena', 'Pattern', 'Ivory', 'Glys', 'Wyndle', 'Stormfather']
                }],
            response: { type: Type.ObjectArray, description: 'The Thing' },
        });

        this.route('getRequired', {
            tag: {
                summary: `Do that thing`,
                description: 'Does the thing you think it\'s done',
            },
            method: Method.GET,
            action: this.getRequiredReturnObject,
            params:
                [{
                    name: 'a',
                    type: Type.Boolean,
                    description: 'Boolean',
                    example: false,
                    required: true,
                }, {
                    name: 'b', type: Type.Date,
                    description: 'Date',
                    example: new Date(Date.UTC(1980, 5, 9)),
                    required: true
                }, {
                    name: 'c', type: Type.DateTime,
                    description: 'DateTime',
                    example: new Date(Date.UTC(1980, 5, 9, 16, 0)),
                    required: true
                }, {
                    name: 'd', type: Type.Number,
                    description: 'Number',
                    example: 123,
                    required: true
                }, {
                    name: 'e', type: Type.NumberArray,
                    description: 'NumberArray',
                    example: [1, 2, 3],
                    required: true,
                }, {
                    name: 'f', type: Type.Object,
                    description: 'Object',
                    example: { name: 'Kaladin', age: 20 },
                    required: true,
                }, {
                    name: 'g', type: Type.ObjectArray,
                    description: 'ObjectArray',
                    example: [{ name: 'Dalinar', age: 53 }, { name: 'Adolin', age: 25 }, { name: 'Renarin', age: 21 }],
                    required: true,
                }, {
                    name: 'h', type: Type.Password,
                    description: 'Password',
                    example: 'abc123',
                    required: true,
                }, {
                    name: 'i', type: Type.String,
                    description: 'String',
                    example: 'Sylphrena',
                    required: true,
                }, {
                    name: 'j', type: Type.StringArray,
                    description: 'StringArray',
                    example: ['Sylphrena', 'Pattern', 'Ivory', 'Glys', 'Wyndle', 'Stormfather'],
                    required: true,
                }],
            response: { type: Type.Object, description: 'The arguments' },
        });
    }


    public getOptionalReturnArray = (
        a?: boolean,
        b?: Date,
        c?: Date,
        d?: number,
        e?: Array<number>,
        f?: SampleObject,
        g?: Array<SampleObject>,
        h?: string,
        i?: string,
        j?: Array<string>
    ): Promise<Array<unknown>> =>
        Promise.resolve([a, b, c, d, e, f, g, h, i, j]);

    public getRequiredReturnObject = (
        a?: boolean,
        b?: Date,
        c?: Date,
        d?: number,
        e?: Array<number>,
        f?: SampleObject,
        g?: Array<SampleObject>,
        h?: string,
        i?: string,
        j?: Array<string>
    ): Promise<unknown> =>
        Promise.resolve({ a: a, b: b, c: c, d: d, e: e, f: f, g: g, h: h, i: i, j: j });


}

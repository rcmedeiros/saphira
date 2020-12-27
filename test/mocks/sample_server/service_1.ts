// cSpell: ignore Kaladin Dalinar Adolin Renarin Sylphrena Glys Wyndle Stormfather
import { BadGatewayError, Controller, Method, ServerError, Type } from '../../../src/index';

import { SampleObject } from '../../template';

export class Service1 extends Controller {
    public constructor(apiPath?: string) {
        super(apiPath, { description: 'Test Service 1' });

        this.route('queryParameters', {
            tag: {
                summary: "Service 1's query parameters operation",
                description: 'Accepts all data types in the query and returns an array of the results',
            },
            method: Method.GET,
            action: this.operation1,
            params: [
                {
                    name: 'a',
                    type: Type.Boolean,
                    description: 'Boolean parameter',
                    example: false,
                },
                {
                    name: 'b',
                    type: Type.Date,
                    description: 'Date parameter',
                    example: new Date(Date.UTC(1980, 5, 9)),
                },
                {
                    name: 'c',
                    type: Type.DateTime,
                    description: 'DateTime parameter',
                    example: new Date(Date.UTC(1980, 5, 9, 19, 0)),
                },
                {
                    name: 'd',
                    type: Type.Number,
                    description: 'Number parameter',
                    example: 123,
                },
                {
                    name: 'e',
                    type: Type.NumberArray,
                    description: 'NumberArray parameter',
                    example: [1, 2, 3],
                },
                {
                    name: 'f',
                    type: Type.Object,
                    description: 'Object parameter',
                    example: { name: 'Kaladin', age: 20 },
                },
                {
                    name: 'g',
                    type: Type.ObjectArray,
                    description: 'ObjectArray parameter',
                    example: [
                        {
                            name: 'Dalinar',
                            age: 53,
                            surgeBinding: { order: 'BondSmith', bond: 'Stormfather', surges: ['Tension', 'Adhesion'] },
                        },
                        { name: 'Adolin', age: 20, surgeBinding: undefined },
                        {
                            name: 'Renarin',
                            age: 21,
                            surgeBinding: {
                                order: 'TruthWatchers',
                                bond: 'Glys',
                                surges: ['Progression', 'Illumination'],
                            },
                        },
                    ],
                },
                {
                    name: 'h',
                    type: Type.Password,
                    description: 'Password parameter',
                    example: '~!@#$%^&*()_+{}:"<>?|-=[]\\;\',./',
                },
                {
                    name: 'i',
                    type: Type.String,
                    description: 'String parameter',
                    example: 'Sylphrena',
                },
                {
                    name: 'j',
                    type: Type.StringArray,
                    description: 'StringArray parameter',
                    example: ['Sylphrena', 'Pattern', 'Ivory', 'Glys', 'Wyndle', 'Stormfather'],
                },
            ],
            response: { type: Type.ObjectArray, description: 'An array representing all the parameters' },
        });

        this.route('noParameter', {
            tag: {
                summary: "Service 1's parameter-less operation",
                description: 'No parameter in, nothing out',
            },
            method: Method.GET,
            action: this.noParameter,
            response: { type: Type.HttpAccepted, description: 'An acknowledgment' },
        });

        this.route('pathParameter', {
            tag: {
                summary: "Service 1's operation with path parameter",
            },
            method: Method.DELETE,
            action: this.deleteWithPathParameter,
            params: [
                {
                    name: 'id',
                    type: Type.Number,
                    path: true,
                    description: 'ID',
                    example: 1234,
                },
                {
                    name: 'sure',
                    type: Type.Boolean,
                    required: true,
                    description: 'Are you sure?',
                    example: true,
                },
            ],
            response: { type: Type.HttpModified, description: 'An acknowledgment' },
        });

        this.route('parentPathParameter', {
            tag: {
                summary: "Service 1's with path parameter before operation",
            },
            method: Method.PUT,
            action: this.putWithParentPathParameter,
            params: [
                {
                    name: 'id',
                    type: Type.Number,
                    parentPath: true,
                    description: 'ID',
                    example: 6789,
                },
                {
                    name: 'what',
                    type: Type.String,
                    required: true,
                    description: 'Are do you with to append?',
                    example: 'Hello World',
                },
            ],
            response: { type: Type.HttpCreated },
        });

        this.route('willReturnNull', {
            method: Method.GET,
            action: this.willReturnNull,
            response: { type: Type.String },
        });
        this.route('willReturnUndefined', {
            method: Method.GET,
            action: this.willReturnUndefined,
            response: { type: Type.String },
        });
        this.route('willReturnEmptyArray', {
            method: Method.GET,
            action: this.willReturnEmptyArray,
            response: { type: Type.StringArray },
        });
        this.route('willReturnEmptyObject', {
            method: Method.GET,
            action: this.willReturnEmptyObject,
            response: { type: Type.Object },
        });

        this.route('willThrowError1', {
            method: Method.GET,
            action: this.willThrowError1,
            response: { type: Type.HttpAccepted },
        });
        this.route('willThrowError2', {
            method: Method.GET,
            action: this.willThrowError2,
            response: { type: Type.HttpAccepted },
        });
        this.route('willThrowError3', {
            method: Method.GET,
            action: this.willThrowError3,
            params: [{ name: 'id', type: Type.Number, description: 'ID', example: 1 }],
            response: { type: Type.HttpAccepted },
        });
        this.route('willThrowError4', {
            method: Method.GET,
            action: this.willThrowError4,
            params: [{ name: 'id', type: Type.Number, description: 'ID', example: 1 }],
            response: { type: Type.HttpAccepted },
        });
        this.route('willThrowError5', {
            method: Method.GET,
            action: this.willThrowError5,
            params: [{ name: 'id', type: Type.Number, description: 'ID', example: 1 }],
            response: { type: Type.HttpAccepted },
        });
    }

    public operation1 = (
        a?: boolean,
        b?: Date,
        c?: Date,
        d?: number,
        e?: Array<number>,
        f?: SampleObject,
        g?: Array<SampleObject>,
        h?: string,
        i?: string,
        j?: Array<string>,
    ): Promise<Array<unknown>> => Promise.resolve([a, b, c, d, e, f, g, h, i, j]);

    public noParameter = (): Promise<void> => Promise.resolve();

    public deleteWithPathParameter = (_id: number, _sure: boolean): Promise<void> => Promise.resolve();

    public putWithParentPathParameter = (_id: number, _what: string): Promise<void> => Promise.resolve();

    // eslint-disable-next-line no-null/no-null
    public willReturnNull = async (): Promise<string> => Promise.resolve(null);
    public willReturnUndefined = async (): Promise<string> => Promise.resolve(undefined);
    public willReturnEmptyArray = async (): Promise<Array<string>> => Promise.resolve([]);
    public willReturnEmptyObject = async (): Promise<unknown> => Promise.resolve({});

    public willThrowError1 = async (): Promise<void> => {
        throw new Error('Something wrong. Throwing.');
    };
    public willThrowError2 = (): Promise<void> => Promise.reject(new ServerError('Something wrong. Rejecting.'));
    public willThrowError3 = async (_id: number): Promise<void> => {
        throw new Error('Something wrong. Throwing.');
    };
    public willThrowError4 = (_id: number): Promise<void> =>
        Promise.reject(new BadGatewayError('Something wrong. Rejecting.'));
    public willThrowError5 = (_id: number): Promise<void> =>
        Promise.reject(new ServerError(new Error('Something wrong. Rejecting.')));
}

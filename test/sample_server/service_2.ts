// cSpell: ignore Kaladin Dalinar Adolin Renarin Sylphrena Glys Wyndle Stormfather
import { Controller, Method, NameValue, Type, Vault } from '../../src/index';

import { SampleObject } from '../template';

export class Service2 extends Controller {
    public constructor(apiPath?: string) {
        super(apiPath, { description: 'Test Service 2' });

        this.route('bodyParameters', {
            tag: {
                summary: "Service 2's body parameters operation",
                description: 'Accepts all data types in the body and returns an object with the results',
            },
            method: Method.POST,
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
                    example: new Date(Date.UTC(1980, 5, 9, 16, 0)),
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
                        { name: 'Dalinar', age: 53 },
                        { name: 'Adolin', age: 25 },
                        { name: 'Renarin', age: 21 },
                    ],
                },
                {
                    name: 'h',
                    type: Type.Password,
                    description: 'Password parameter',
                    example: 'abc123',
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
            response: { type: Type.ObjectArray, description: 'An object containing all present parameters' },
        });

        this.route('primeVault', {
            tag: { summary: 'stuff some values into the vault' },
            method: Method.GET,
            action: this.primeVault,
            response: { type: Type.HttpCreated },
        });
        this.route('retrieveVaultValues', {
            tag: { summary: 'retrieve those values from the vault' },
            method: Method.GET,
            action: this.retrieveVaultValues,
            response: { type: Type.Object },
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
    ): Promise<unknown> => Promise.resolve({ a: a, b: b, c: c, d: d, e: e, f: f, g: g, h: h, i: i, j: j });

    public primeVault = async (): Promise<void> => {
        const vault: Vault = Vault.getInstance();
        vault.set('v1', 'abc');
        vault.setString('v2', 'def');
        vault.setNumber('v3', 123.456);
        vault.setBoolean('v4', true);

        return Promise.resolve();
    };

    public retrieveVaultValues = async (): Promise<NameValue> => {
        const vault: Vault = Vault.getInstance();
        vault.set('v1', 'abc');
        vault.setString('v2', 'def');
        vault.setNumber('v3', 123.456);
        vault.setBoolean('v4', true);

        return Promise.resolve({
            v1: vault.get('v1') as string,
            v2: vault.getString('v2'),
            v3: vault.getNumber('v3'),
            v4: vault.getBoolean('v4'),
        });
    };
}

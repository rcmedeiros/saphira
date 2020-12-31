import { describe, it } from 'mocha';

import { DTO } from '../src';
import { expect } from 'chai';

class HelloWorldDTO extends DTO {
    private _hello: string;

    private _num: number;

    private _isIt: boolean;

    public assign(_record: unknown): void {
        throw new Error('Method not implemented.');
    }
    public get hello(): string {
        return this._hello;
    }
    public set hello(v: string) {
        this._hello = v;
    }
    public get num(): number {
        return this._num;
    }
    public set num(v: number) {
        this._num = v;
    }
    public get isIt(): boolean {
        return this._isIt;
    }
    public set isIt(v: boolean) {
        this._isIt = v;
    }
}

describe('DTO', () => {
    it('deserialized DTO should contain only getters ', () => {
        const hello: HelloWorldDTO = new HelloWorldDTO();
        hello.hello = 'world';
        hello.num = 2;
        hello.isIt = true;
        expect(JSON.stringify(hello)).to.be.equal(JSON.stringify({ hello: 'world', num: 2, isIt: true }));
    });
});

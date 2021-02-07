import { DTO } from '../../../src';

export interface HelloWorld {
    hello: string;
    world: string;
}

export class HelloWorldDTO extends DTO implements HelloWorld {
    private _hello: string;
    private _world: string;

    public get world(): string {
        return this._world;
    }
    public set world(v: string) {
        this._world = v;
    }

    public get hello(): string {
        return this._hello;
    }
    public set hello(v: string) {
        this._hello = v;
    }

    public assign(record: HelloWorld): void {
        this.hello = record.hello;
        this.world = record.world;
    }
}

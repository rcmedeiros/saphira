import { NameValue } from './types';

export class Vault {
    private static instance: Vault;
    private properties: NameValue = {};

    /* istanbul ignore next */
    private constructor() {}

    public static getInstance(): Vault {
        if (!this.instance) {
            this.instance = new Vault();
        }
        return Vault.instance;
    }

    public get(name: string): unknown {
        return this.properties[name];
    }

    public delete(name: string): void {
        delete this.properties[name];
    }

    public set(name: string, value: unknown): Vault {
        this.properties[name] = value;
        return this;
    }

    public assign(values: NameValue): Vault {
        this.properties = { ...this.properties, ...values };
        return this;
    }

    public values(): NameValue {
        return { ...this.properties };
    }

    public has(name: string): boolean {
        return !!this.properties[name];
    }

    public getString(name: string): string {
        return this.properties[name] as string;
    }

    public setString(name: string, value: string): void {
        this.properties[name] = value;
    }

    public getNumber(name: string): number {
        return this.properties[name] as number;
    }

    public setNumber(name: string, value: number): void {
        this.properties[name] = value;
    }

    public getBoolean(name: string): boolean {
        return this.properties[name] as boolean;
    }

    public setBoolean(name: string, value: boolean): void {
        this.properties[name] = value;
    }
}

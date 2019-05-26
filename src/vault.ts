export interface NameValue { [name: string]: string | number | boolean | NameValue; }

export class Vault {
    private static readonly instance: Vault = new Vault();

    public static getInstance(): Vault {
        return Vault.instance;
    }
    private readonly parameters: NameValue = {};

    private constructor() { }

    public get(name: string): string | number | boolean | NameValue {
        return this.parameters[name];
    }

    public set(name: string, value: string | number | boolean | NameValue): void {
        this.parameters[name] = value;
    }

    public getString(name: string): string {
        return this.parameters[name] as string;
    }

    public setString(name: string, value: string): void {
        this.parameters[name] = value;
    }

    public getNumber(name: string): number {
        return this.parameters[name] as number;
    }

    public setNumber(name: string, value: number): void {
        this.parameters[name] = value;
    }

    public getBoolean(name: string): boolean {
        return this.parameters[name] as boolean;
    }

    public setBoolean(name: string, value: boolean): void {
        this.parameters[name] = value;
    }

}

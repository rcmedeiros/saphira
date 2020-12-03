// import { MongoClient } from 'mongodb';
// import semaphore, { Semaphore } from 'semaphore';
import { NameValue } from './types';

interface EnVar { name: string; value: unknown; }

export class Vault {
    private static instance: Vault;
    private properties: NameValue = {};
    private _loaded: boolean;
    // private readonly semaphore: Semaphore;

    private constructor() {
        this._loaded = false;
        // this.semaphore = semaphore(1);
    }

    public static getInstance(): Vault {
        if (!this.instance) {
            this.instance = new Vault();
        }
        return Vault.instance;
    }

    private async load(): Promise<void> {
        // const mName: string = __moduleInfo.name.toUpperCase().replaceAll('-', '_');
        // const cfg: string = process.env[`${mName}_MONGODB`];
        // if (cfg) {
        //     const ignore: Array<string> = !process.env[`${mName}_IGNORE`] ? [] : process.env[`${mName}_IGNORE`].split(',');

        //     const client: MongoClient = await MongoClient.connect(cfg, { useNewUrlParser: true, useUnifiedTopology: true });
        //     const list: Array<EnVar> = await client.db(__moduleInfo.name).collection('Environment').find().toArray();

        //     list.filter((item: EnVar) =>
        //         item.name &&
        //         !process.env[item.name.toUpperCase()] &&
        //         !ignore.includes(item.name),
        //     ).forEach((variable: EnVar) => {
        //         process.env[variable.name.toUpperCase()] =
        //             typeof variable.value === 'object' ? JSON.stringify(variable.value) : variable.value.toString();
        //         this.set(variable.name, variable.value);
        //     });

        //     client.close(true).catch((e: Error) => { console.error(e); });
        // } else {
        //     console.warn(`Missing environment variable: ${mName}_MONGODB`);
        // }
    }

    public async connect(): Promise<void> {
        // return new Promise(async (resolve: Function, reject: Function): Promise<void> => {
        //     this.semaphore.take(async () => {
        //         if (this._loaded) {
        //             resolve();
        //             this.semaphore.leave();
        //         } else {
        //             try {
        //                 await this.load();
        this._loaded = true;
        //                 resolve();
        //                 this.semaphore.leave();
        //             } catch (e) {
        //                 reject(e);
        //                 this.semaphore.leave();
        //             }
        //         }
        //     });
        // });
    }

    public get(name: string): unknown {
        return this.properties[name];
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

    public get loaded(): boolean {
        return this._loaded;
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

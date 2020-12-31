import { WebClient } from './web-client';
import { WebResponse } from './web-response';
import fs from 'fs';
import path from 'path';

export class Resource {
    private readonly _resource: string;

    constructor(res: string) {
        this._resource = res;
    }

    private getReturn(r: unknown): string {
        return Buffer.isBuffer(r) ? r.toString() : (r as string);
    }

    public async get(): Promise<string> {
        try {
            if (!this._resource) {
                return undefined;
            } else if (path.basename(this._resource) && fs.existsSync(this._resource)) {
                return fs.readFileSync(this._resource).toString();
            } else if (this._resource.startsWith('http')) {
                const c: WebClient = new WebClient(Resource.name, {
                    host: this._resource,
                    healthCheckEndpoint: undefined,
                    envVar: undefined,
                });
                const r: WebResponse = await c.get();
                r.okOnly();
                return this.getReturn(r.body);
            } else {
                return this._resource;
            }
        } catch {
            return this._resource;
        }
    }
}

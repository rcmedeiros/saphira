// cSpell: ignore Kaladin Dalinar Adolin Renarin Sylphrena Glys Wyndle Stormfather
import { Adapters, Controller, Method, Type, WebClient, WebResponse } from '../../../src';

const SERVICE_CALLER: string = '/api/ServiceCaller';
export const SECURE_SERVER_POST: string = `${SERVICE_CALLER}/aPostCall`;

export class ServiceCaller extends Controller {
    public constructor(apiPath?: string) {
        super(apiPath, { description: 'Service Caller' });

        this.route('aPostCall', {
            tag: {
                summary: 'Make the call to custom service',
            },
            method: Method.POST,
            action: this.returnPostTheResponse,
            params: [
                {
                    name: 'service',
                    type: Type.String,
                    required: true,
                },
                {
                    name: 'endpoint',
                    type: Type.String,
                    required: true,
                },
                {
                    name: 'payload',
                    type: Type.Object,
                    required: true,
                },
            ],
            response: { type: Type.Object },
        });
    }

    public returnPostTheResponse = async (service: string, endpoint: string, payload: unknown): Promise<unknown> => {
        const client: WebClient = Adapters.getWebService(service);
        try {
            const wr: WebResponse = await client.post(endpoint, payload);
            return Promise.resolve(wr);
        } catch (e) {
            return Promise.reject(e);
        }
    };
}

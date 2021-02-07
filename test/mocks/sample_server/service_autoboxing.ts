// cSpell: ignore Kaladin Dalinar Adolin Renarin Sylphrena Glys Wyndle Stormfather
import { Controller, Method, Type } from '../../../src/index';

import { HelloWorldDTO } from './hello_world-dto';

const SERVICE_AUTOBOXING: string = '/api/serviceAutoboxing';
export const SERVICE_AUTOBOXING_OBJECT: string = `${SERVICE_AUTOBOXING}/anObject`;
export const SERVICE_AUTOBOXING_OBJECT_ARRAY: string = `${SERVICE_AUTOBOXING}/anArray`;

export class ServiceAutoboxing extends Controller {
    public constructor(apiPath?: string) {
        super(apiPath, { description: 'Test Service 4' });

        this.route('AnObject', {
            tag: {
                summary: 'Post an object',
            },
            method: Method.POST,
            action: this.anObject,
            payload: {
                type: Type.Object,
                dto: HelloWorldDTO,
                description: 'Return the incoming object',
            },
            response: { type: Type.Object },
        });

        this.route('AnObject', {
            tag: {
                summary: 'Get an object',
            },
            method: Method.GET,
            action: this.anObject,
            params: [
                {
                    name: 'greeting',
                    type: Type.Object,
                    dto: HelloWorldDTO,
                    description: 'Return the incoming object',
                },
            ],
            response: { type: Type.Object },
        });

        this.route('AnArray', {
            tag: {
                summary: 'Post an array of objects',
            },
            method: Method.POST,
            action: this.anObjectArray,
            payload: {
                type: Type.ObjectArray,
                dto: HelloWorldDTO,
                description: 'Return the incoming array',
            },
            response: { type: Type.ObjectArray },
        });

        this.route('AnArray', {
            tag: {
                summary: 'Get an array of objects',
            },
            method: Method.GET,
            action: this.anObjectArray,
            params: [
                {
                    name: 'greetings',
                    type: Type.ObjectArray,
                    dto: HelloWorldDTO,
                    description: 'Return the incoming array',
                },
            ],
            response: { type: Type.ObjectArray },
        });
    }

    public anObject(payload: HelloWorldDTO): Promise<HelloWorldDTO> {
        if (!payload.constructor.name.endsWith('DTO')) {
            return Promise.reject(new Error('not a DTO'));
        } else {
            return Promise.resolve(payload);
        }
    }

    public anObjectArray(payload: Array<HelloWorldDTO>): Promise<Array<HelloWorldDTO>> {
        payload.forEach((element: HelloWorldDTO) => {
            if (!element.constructor.name.endsWith('DTO')) {
                return Promise.reject(new Error('not a DTO'));
            }
        });
        return Promise.resolve(payload);
    }
}

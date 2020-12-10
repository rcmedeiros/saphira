// cSpell: ignore Kaladin Dalinar Adolin Renarin Sylphrena Glys Wyndle Stormfather
import { Controller, Method, Type } from '../../src/index';

export class Service4 extends Controller {

    public constructor(apiPath?: string) {
        super(apiPath, { description: 'Test Service 4' });

        this.route('AnObject', {
            tag: {
                summary: 'Put an object',
            },
            method: Method.POST,
            action: this.returnWhateverIsSent,
            payload: {
                type: Type.Object,
                description: 'Return the incoming object',
            },
            response: { type: Type.Object },
        });

        this.route('AnArray', {
            tag: {
                summary: 'Put an object',
            },
            method: Method.POST,
            action: this.returnWhateverIsSent,
            payload: {
                type: Type.ObjectArray,
                description: 'Return the incoming object',
            },
            response: { type: Type.Object },
        });

    }

    public returnWhateverIsSent = (payload: object): Promise<object> => Promise.resolve(payload)


}

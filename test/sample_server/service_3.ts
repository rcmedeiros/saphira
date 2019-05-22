// cSpell: ignore Kaladin Dalinar Adolin Renarin Sylphrena Glys Wyndle Stormfather
import { Controller, Method, Type } from '../../src/index';
import { SampleObject } from '../template';

export class Service3 extends Controller {

    public constructor(apiPath?: string) {
        super(apiPath, { description: 'Test Service 2' });

        this.route('', {
            tag: {
                summary: `Get an instance`,
            },
            method: Method.GET,
            action: this.getInstance,
            params:
                [{
                    name: 'id',
                    type: Type.Number,
                    parentPath: true,
                    description: 'Instance ID',
                    example: 1234,
                    ignore: ['subInstances']
                }],
            response: { type: Type.Object },
        });

        this.route('subInstances', {
            tag: {
                summary: `List sub-instances`,
            },
            method: Method.GET,
            action: this.listSubInstances,
            params:
                [{
                    name: 'id',
                    type: Type.Number,
                    description: 'Instance ID',
                    example: 1234,
                }],
            response: { type: Type.ObjectArray },
        });
    }

    public getInstance = (id: number): Promise<object> =>
        Promise.resolve({ id: 1, name: 'Alpha' });

    public listSubInstances = (_id: number): Promise<Array<object>> =>
        Promise.resolve([{ id: 2, name: 'Beta' }, { id: 3, name: 'Gamma' }, { id: 4, name: 'Delta' }]);

}

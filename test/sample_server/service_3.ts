// cSpell: ignore Kaladin Dalinar Adolin Renarin Sylphrena Glys Wyndle Stormfather
import { Controller, Method, PagedResult, Resolution, Type } from '../../src/index';

export class Service3 extends Controller {
    public constructor(apiPath?: string) {
        super(apiPath, { description: 'Test Service 3' });

        this.route('', {
            tag: {
                summary: 'Get an instance',
            },
            method: Method.GET,
            action: this.getInstance,
            params: [
                {
                    name: 'id',
                    type: Type.Number,
                    ignore: ['subInstances', 'pagedList'],
                    parentPath: true,
                    description: 'Instance ID',
                    example: 1234,
                },
            ],
            response: { type: Type.Object },
        });

        this.route('subInstances', {
            tag: {
                summary: 'List sub-instances',
            },
            method: Method.GET,
            action: this.listSubInstances,
            params: [
                {
                    name: 'id',
                    type: Type.Number,
                    description: 'Instance ID',
                    example: 1234,
                },
            ],
            response: { type: Type.ObjectArray },
        });

        this.route('pagedList', {
            tag: { summary: 'Alphabet in pages of 5' },
            method: Method.GET,
            action: this.pagedList,
            response: { type: Type.StringArray },
        });
        this.route('pagedList', {
            tag: { summary: 'Alphabet in pages of 5' },
            method: Method.POST,
            action: this.pagedList,
            response: { type: Type.StringArray },
        });
    }

    public getInstance = (_id: number): Promise<unknown> => Promise.resolve({ id: 1, name: 'Alpha' });

    public listSubInstances = (_id: number): Promise<Array<unknown>> =>
        Promise.resolve([
            { id: 2, name: 'Beta' },
            { id: 3, name: 'Gamma' },
            { id: 4, name: 'Delta' },
        ]);

    public pagedList = async (): Promise<PagedResult<string>> =>
        new Promise((resolve: Resolution<PagedResult<string>>): void => {
            resolve({
                entries: ['f', 'g', 'h', 'i', 'j'],
                pageSize: 5,
                entriesCount: 26,
                pageNumber: 2,
                pagesCount: 6,
            });
        });
}

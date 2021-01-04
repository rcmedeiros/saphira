import { Adapters, Controller, Method, Type } from '../../../src';

export const SECURE_SERVER: string = '/api/SecureService';
export const SECURE_SERVER_JUST_RESTRICTED: string = `${SECURE_SERVER}/justRestricted`;
export const SECURE_SERVER_RESTRICTED_TO_SYSTEM: string = `${SECURE_SERVER}/restrictedToSystem`;
export const SECURE_SERVER_RESTRICTED_TO_SYSTEM_2: string = `${SECURE_SERVER}/restrictedToSystem2`;
export const SECURE_SERVER_SELF_REQUEST: string = `${SECURE_SERVER}/selfRequest`;
export const SELF_REQUEST: string = 'SELF_REQUEST';

// const here: boolean = false;
export class SecureService extends Controller {
    public constructor(apiPath?: string) {
        super(apiPath, { description: 'Test Web Server' });

        this.route('justRestricted', {
            method: Method.GET,
            action: this.operation,
            response: { type: Type.Number },
            restricted: true,
        });
        this.route('restrictedToSystem', {
            method: Method.GET,
            action: this.operation,
            response: { type: Type.Number },
            restricted: { systems: ['the_system'] },
        });
        this.route('restrictedToSystem2', {
            method: Method.GET,
            action: this.operation,
            response: { type: Type.Number },
            restricted: { systems: 'the_system' }, // just to cover with or without arrays
        });
        this.route('selfRequest', {
            method: Method.GET,
            action: this.selfRequest,
            response: { type: Type.Number },
        });
    }

    public operation = async (): Promise<number> => {
        return 1;
    };

    public selfRequest = async (): Promise<number> => {
        // Calling twice to cover both okOnly (200) and successOnly (200~206)

        const n1: number = (await Adapters.getWebService(SELF_REQUEST).get(SECURE_SERVER_RESTRICTED_TO_SYSTEM)).okOnly()
            .body as number;
        const n2: number = (
            await Adapters.getWebService(SELF_REQUEST).get(SECURE_SERVER_RESTRICTED_TO_SYSTEM)
        ).successOnly().body as number;

        return Promise.resolve(n1 || n2);
    };
}

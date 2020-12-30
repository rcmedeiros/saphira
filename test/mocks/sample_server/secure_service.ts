import { Controller, Method, Type } from '../../../src';

export const SECURE_SERVER: string = '/api/SecureService';
export const SECURE_SERVER_JUST_RESTRICTED: string = `${SECURE_SERVER}/justRestricted`;
export const SECURE_SERVER_RESTRICTED_TO_SYSTEM: string = `${SECURE_SERVER}/restrictedToSystem`;
export const SECURE_SERVER_RESTRICTED_TO_SYSTEM_2: string = `${SECURE_SERVER}/restrictedToSystem2`;

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
    }

    public operation = async (): Promise<number> => {
        return 1;
    };
}

import { Saphira } from '../';

export abstract class DTO {
    constructor(object?: unknown) {
        if (object) {
            this.assign(object);
        }
    }
    public toJSON(): unknown {
        const serialized: unknown = {};

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let current: DTO = this;
        do {
            Object.getOwnPropertyNames(current).forEach((name: string) => {
                if (typeof Object.getOwnPropertyDescriptor(current, name).get === 'function') {
                    /* istanbul ignore else */
                    if (!Saphira.TEST || (Saphira.TEST && name !== 'should')) {
                        (serialized as { [idx: string]: unknown })[name] = (
                            this as unknown as {
                                [idx: string]: unknown;
                            }
                        )[name];
                    }
                }
            });
            current = Object.getPrototypeOf(current);
        } while (current);

        return serialized;
    }

    public abstract assign(record: unknown): void;
}

export type ConcreteDTO = new (object?: unknown) => DTO;

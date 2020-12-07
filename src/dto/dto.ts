import { Saphira } from '../';

export abstract class DTO {

    public abstract assign(record: unknown): void;

    public toJSON(): unknown {
        const serialized: unknown = {};

        let current: DTO = this;
        do {
            Object.getOwnPropertyNames(current).forEach((name: string) => {
                if (typeof Object.getOwnPropertyDescriptor(current, name).get === 'function') {
                    if (!Saphira.TEST || (Saphira.TEST && name !== 'should')) {
                        (serialized as { [idx: string]: unknown })[name] = (this as unknown as { [idx: string]: unknown })[name];
                    }
                }
            });
            current = Object.getPrototypeOf(current);
        } while (current);

        return serialized;
    }
}

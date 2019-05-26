/* istanbul ignore file */
// tslint:disable no-any no-unsafe-any no-this-assignment

export abstract class DTO {

    [key: string]: any;

    public abstract assign(record: any): void;

    public toJSON(): any {
        const serialized: any = {};

        let current: DTO = this;
        do {
            Object.getOwnPropertyNames(current).forEach((name: string) => {
                if (typeof Object.getOwnPropertyDescriptor(current, name).get === 'function') {
                    serialized[name] = this[name];
                }
            });
            current = Object.getPrototypeOf(current);
        } while (current);

        return serialized;
    }
}

// tslint:disable:no-any no-unsafe-any

export class SaphiraError extends Error {

    [key: string]: any;

    public toJSON(): string {
        const serialized: any = {
            message: this.message,
        };
        return serialized;
    }
}

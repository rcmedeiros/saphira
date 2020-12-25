// tslint:disable:no-any no-unsafe-any

export class SaphiraError extends Error {
    public toJSON(): string {
        return JSON.stringify({
            message: this.message,
        });
    }
}

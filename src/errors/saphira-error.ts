export class SaphiraError extends Error {
    public toJSON(): string {
        return this.message;
    }
}

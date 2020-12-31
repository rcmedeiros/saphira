type callback = (error: Error | null | undefined) => void;

export class LogCapture {
    private readonly sourceOutput: NodeJS.WriteStream;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly sourceWrite: any;
    private output = '';
    public constructor(logOutput: NodeJS.WriteStream) {
        this.sourceOutput = logOutput;
        this.sourceWrite = logOutput.write;
        logOutput.write = (chunk: unknown, encoding: string | callback, cb?: callback): boolean => {
            this.output += chunk.toString(); // chunk is a String or Buffer
            return this.sourceWrite.apply(logOutput, cb ? [chunk, encoding, cb] : [chunk, encoding, cb]);
        };
    }

    public getCaptured(): string {
        this.sourceOutput.write = this.sourceWrite;
        return this.output;
    }
}

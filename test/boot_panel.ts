import '@rcmedeiros/prototypes';

interface BootPanelRecord {
    message: string;
    status: string;
}

export class BootPanel {
    private records: { [name: string]: BootPanelRecord } = {};

    constructor(panel: string) {
        panel
            .substringFrom('┤\n')
            .substringUpTo('┘')
            .split('\n')
            .forEach((line: string) => {
                line = line.substring(1, line.length - 1);
                this.records[line.substringUpTo('│').trim()] = {
                    message: line
                        .substringFrom('│')
                        .substringUpTo('│')
                        .replace(/\u001b\[3\dm/g, '')
                        .trim(),
                    status: line
                        .substringFromLast('│')
                        .replace(/\u001b\[3\dm/g, '')
                        .trim(),
                };
            });
    }

    public getMessage(record: string): string {
        return this.records[record].message;
    }

    public getStatus(record: string): string {
        return this.records[record].status;
    }
}

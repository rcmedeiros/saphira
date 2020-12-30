import { v4 } from 'uuid';

export const parseJson: (s: string, silent?: boolean) => unknown = (s: string, silent?: boolean): unknown => {
    try {
        return JSON.parse(s);
    } catch (e) {
        if (!silent) {
            console.error(`Tried to parse invalid JSON string: ${s}`);
        }

        return undefined;
    }
};

export const uuid: () => string = (): string => {
    return v4();
};

export const envVarAsString: (name: string) => string = (name: string): string => {
    return process.env[`${__moduleInfo.name.toUpperCase()}_${name}`];
};

export const envVarAsBoolean: (name: string) => boolean = (name: string): boolean => {
    return ['true', 'TRUE', '1'].includes(envVarAsString(name));
};

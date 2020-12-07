import { v4 } from 'uuid';

export const parseJson: Function = (s: string): object => {
    try {
        return JSON.parse(s);
    } catch (e) {
        console.error('Tried to parse invalid JSON string: ' + s);
        return undefined;
    }
};

export const uuid: Function = (): string => {
    return v4();
}

export const envVarAsString: Function = (name: string): string => {
    return process.env[`${__moduleInfo.name.toUpperCase()}_${name}`];
}

export const envVarAsBoolean: Function = (name: string): boolean => {
    return ['true', 'TRUE', '1'].includes(envVarAsString(name));
}

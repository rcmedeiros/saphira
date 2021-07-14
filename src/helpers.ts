import { NameValue } from './types';
import { decode } from 'jsonwebtoken';
import stringify from 'fast-safe-stringify';
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

export const safeStringify: (
    value: unknown,
    replacer?: (key: string, value: unknown) => unknown,
    space?: string | number,
) => string = (
    value: unknown,
    replacer?: (key: string, value: unknown) => unknown,
    space?: string | number,
): string => {
    try {
        return JSON.stringify(value, replacer, space);
    } catch (e) {
        return stringify(value, replacer, space);
    }
};

export const uuid: () => string = (): string => {
    return v4();
};

export const envVarAsString: (name: string) => string = (name: string): string => {
    return process.env[`${__moduleInfo.name.toUpperCase()}_${name}`] || process.env[name];
};

export const envVarAsBoolean: (name: string) => boolean = (name: string): boolean => {
    return ['true', 'TRUE', '1'].includes(envVarAsString(name));
};

export const decodeJWT: (jwt: string) => NameValue = (jwt: string): NameValue => {
    return decode(jwt) as NameValue;
};

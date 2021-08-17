import '@rcmedeiros/prototypes';

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

function inferType(value: string): unknown {
    if (value) {
        if (value.isNumeric()) {
            return parseFloat(value);
        } else {
            if (value.firstChar() === value.lastChar() && ["'", '"'].includes(value.firstChar())) {
                value = value.substring(1, value.length - 1);
            }
            return value;
        }
    } else {
        return undefined;
    }
}

function valuesToJson(values: string): NameValue {
    let json: NameValue = parseJson(values, true) as NameValue;
    if (typeof json !== 'object') {
        json = undefined;
        const properties: Array<string> = values?.split(';');
        properties?.forEach((value: string) => {
            const pair: Array<string> = value?.split('=');
            if (pair.length === 2) {
                if (!json) {
                    json = {};
                }
                json[pair[0]] = inferType(pair[1]);
            }
        });
    }
    return json;
}

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

export const envVarAsString: (name: string, prefix?: string) => string = (name: string, prefix?: string): string => {
    return (
        process.env[`${__moduleInfo.name.toUpperCase()}_${prefix?.toUpperCase()}_${name}`] ||
        process.env[`${__moduleInfo.name.toUpperCase()}_${name}`] ||
        process.env[name]
    );
};

export const envVarAsBoolean: (name: string, prefix?: string) => boolean = (name: string, prefix?: string): boolean => {
    return ['true', 'TRUE', '1'].includes(envVarAsString(name, prefix));
};

export const envVarAsNumber: (name: string, prefix?: string) => number = (name: string, prefix?: string): number => {
    const n: number = parseFloat(envVarAsString(name, prefix));
    return isNaN(n) ? undefined : n;
};

export const envVarAsObject: (name: string, prefix?: string) => unknown = (name: string, prefix?: string): unknown => {
    return valuesToJson(envVarAsString(name, prefix));
};

export const decodeJWT: (jwt: string) => NameValue = (jwt: string): NameValue => {
    return decode(jwt) as NameValue;
};

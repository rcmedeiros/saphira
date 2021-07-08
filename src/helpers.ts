import { NameValue } from './types';
import { decode } from 'jsonwebtoken';
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

export const decodeJWT: (jwt: string) => NameValue = (jwt: string): NameValue => {
    return decode(jwt) as NameValue;
};

export const unloadModule: (moduleName: string) => void = (moduleName: string) => {
    const solvedName: string = require.resolve(moduleName),
        nodeModule: NodeModule = require.cache[solvedName];
    if (nodeModule) {
        for (const child of nodeModule.children) {
            unloadModule(child.filename);
        }
        delete require.cache[solvedName];
    }
};

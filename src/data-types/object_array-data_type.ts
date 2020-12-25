import { InvalidDataTypeError } from '../errors/invalid_data_type-error';
import { DataType } from './data_type';

export class ObjectArrayDataType extends DataType {
    public digest(v: unknown): Array<unknown> {
        let invalid: boolean = false;
        let result: Array<unknown> = [];
        if (typeof v === 'object' && v.constructor === Array) {
            invalid = !(v as Array<unknown>).every((e: unknown) => {
                if (typeof e === 'string') {
                    try {
                        result.push(JSON.parse(e) as unknown);
                    } catch {
                        return false;
                    }
                    return true;
                } else if (typeof e === 'object' && e.constructor === Object) {
                    result.push(e);
                    return true;
                } else {
                    return false;
                }
            });
        } else if (typeof v === 'string') {
            try {
                const x: string = v.trim();
                if (x.firstChar() !== '[' && x.lastChar() !== ']' && x.firstChar() === '{') {
                    result = JSON.parse(`[${x}]`) as Array<unknown>;
                } else if (x.firstChar() === '[') {
                    result = JSON.parse(x) as Array<unknown>;
                    invalid = !result.every((f: unknown) => typeof f === 'object');
                } else {
                    invalid = true;
                }
            } catch {
                invalid = true;
            }
        } else {
            invalid = true;
        }
        if (!invalid) {
            return result;
        }
        throw new InvalidDataTypeError();
    }
}

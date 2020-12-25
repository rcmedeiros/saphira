import { InvalidDataTypeError } from '../errors/invalid_data_type-error';
import { DataType } from './data_type';

export class NumberArrayDataType extends DataType {
    public digest(v: unknown): Array<number> {
        let invalid: boolean = false;
        const result: Array<number> = [];
        if (typeof v === 'object' && v.constructor === Array) {
            invalid = !(v as Array<number>).every((e: unknown) => {
                if (typeof e === 'number') {
                    result.push(e);
                    return true;
                } else if (typeof e === 'string' && e.isNumeric()) {
                    result.push(parseFloat(e));
                    return true;
                } else {
                    return false;
                }
            });
        } else if (typeof v === 'string') {
            const w: Array<string> = v.strip('[', ']').split(',');
            invalid = !w.every((e: string) => {
                if (e.isNumeric()) {
                    result.push(parseFloat(e));
                    return true;
                } else {
                    return false;
                }
            });
        } else {
            invalid = true;
        }

        if (!invalid) {
            return result;
        }
        throw new InvalidDataTypeError();
    }
}

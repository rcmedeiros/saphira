import { InvalidDataTypeError } from '../errors/invalid_data_type-error';
import { DataType } from './data_type';

export class ObjectDataType extends DataType {

    public digest(v: unknown): object {

        if (typeof v === 'object' && v.constructor === Object) {
            return v;
        } else if (typeof v === 'string' && v.trim().firstChar() === '{') {
            try {
                return JSON.parse(v) as object;
            } catch {
                throw new InvalidDataTypeError();
            }
        }
        throw new InvalidDataTypeError();
    }
}

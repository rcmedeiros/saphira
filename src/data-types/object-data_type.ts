import { DataType } from './data_type';
import { InvalidDataTypeError } from '../errors/invalid_data_type-error';
export class ObjectDataType extends DataType {
    public digest(v: unknown): unknown {
        if (typeof v === 'object' && v.constructor === Object) {
            return v;
        } else if (typeof v === 'string' && v.trim().firstChar() === '{') {
            try {
                return JSON.parse(v);
            } catch {
                throw new InvalidDataTypeError();
            }
        }
        throw new InvalidDataTypeError();
    }
}

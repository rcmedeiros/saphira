import { DataType } from './data_type';
import { InvalidDataTypeError } from '../errors/invalid_data_type-error';
export class NumberDataType extends DataType {
    public digest(v: unknown): number {
        if (typeof v === 'string' && v.isNumeric()) {
            return parseFloat(v);
        } else if (typeof v === 'number') {
            return v;
        }
        throw new InvalidDataTypeError();
    }
}

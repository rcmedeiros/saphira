import { DataType } from './data_type';
import { InvalidDataTypeError } from '../errors/invalid_data_type-error';
export class StringDataType extends DataType {
    public digest(v: unknown): string {
        if (typeof v === 'string') {
            return v;
        }

        throw new InvalidDataTypeError();
    }
}

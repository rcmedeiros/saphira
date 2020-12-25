import { InvalidDataTypeError } from '../errors/invalid_data_type-error';
import { DataType } from './data_type';

export class StringDataType extends DataType {
    public digest(v: unknown): string {
        if (typeof v === 'string') {
            return v;
        }

        throw new InvalidDataTypeError();
    }
}

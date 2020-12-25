import { InvalidDataTypeError } from '../errors/invalid_data_type-error';
import { DataType } from './data_type';

export class StringArrayDataType extends DataType {
    public digest(v: unknown): Array<string> {
        if (typeof v === 'string') {
            return v.split(',');
        } else if (
            typeof v === 'object' &&
            v.constructor === Array &&
            (v as Array<unknown>).every((e: unknown) => typeof e === 'string')
        ) {
            return v as Array<string>;
        }

        throw new InvalidDataTypeError();
    }
}

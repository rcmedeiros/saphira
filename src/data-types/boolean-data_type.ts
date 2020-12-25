import { InvalidDataTypeError } from '../errors/invalid_data_type-error';
import { DataType } from './data_type';

export class BooleanDataType extends DataType {
    public digest(v: unknown): boolean {
        if (typeof v === 'boolean') {
            return v;
        } else if (typeof v === 'string') {
            switch (v.toLowerCase()) {
                case 't':
                case 'true':
                case 'y':
                case 'yes':
                case '1':
                    return true;
                case 'f':
                case 'false':
                case 'n':
                case 'no':
                case '0':
                    return false;
                default:
            }
        }
        throw new InvalidDataTypeError();
    }
}

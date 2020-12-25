import { InvalidDataTypeError } from '../errors/invalid_data_type-error';
import { DataType } from './data_type';

export class DateTimeDataType extends DataType {
    public digest(v: unknown): Date {
        let invalid: boolean = false;
        let result: Date;
        if (typeof v === 'string') {
            if (v.isNumeric() && Number.isInteger(parseFloat(v))) {
                result = new Date(parseInt(v));
            } else if (v.stripIgnoreCase('-', ':', '.', '+', 'T', 'Z').isNumeric()) {
                result = new Date(Date.parse(v));
            }
        } else if (typeof v === 'number' && Number.isInteger(v)) {
            result = new Date(v);
        }

        invalid = !result || isNaN(result.getTime());
        if (!invalid) {
            return result;
        }
        throw new InvalidDataTypeError();
    }
}

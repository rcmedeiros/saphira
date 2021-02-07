import { ConcreteDTO } from '../dto/dto';
import { DataType } from './data_type';
import { InvalidDataTypeError } from '../errors/invalid_data_type-error';
export class ObjectDataType extends DataType {
    public digest(v: unknown, dto?: ConcreteDTO): unknown {
        if (typeof v === 'object' && v.constructor === Object) {
            return dto ? new dto(v) : v;
        } else if (typeof v === 'string' && v.trim().firstChar() === '{') {
            try {
                return dto ? new dto(JSON.parse(v)) : JSON.parse(v);
            } catch {
                throw new InvalidDataTypeError();
            }
        }
        throw new InvalidDataTypeError();
    }
}

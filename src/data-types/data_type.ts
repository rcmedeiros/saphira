import { DTO } from '../';

export abstract class DataType {
    public abstract digest(v: unknown, dto?: typeof DTO): unknown;
}

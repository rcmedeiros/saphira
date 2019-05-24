import { BooleanDataType } from './boolean-data_type';
import { DataType } from './data_type';
import { DateTimeDataType } from './date_time-data_type';
import { NumberDataType } from './number-data_type';
import { NumberArrayDataType } from './number_array-data_type';
import { ObjectDataType } from './object-data_type';
import { ObjectArrayDataType } from './object_array-data_type';
import { StringDataType } from './string-data_type';
import { StringArrayDataType } from './string_array-data_type';

export const enum Type {
    // Base64 = 'Base64',
    // Binary = 'Binary',
    Boolean = 'Boolean',
    Date = 'Date',
    DateTime = 'DateTime',
    HttpAccepted = 'Http202',
    HttpCreated = 'Http201',
    HttpModified = 'Http204',
    Number = 'Number',
    NumberArray = 'NumberArray',
    Object = 'Object',
    ObjectArray = 'ObjectArray',
    Password = 'Password',
    String = 'String',
    StringArray = 'StringArray',
}

export abstract class DataTypes {

    private static instances: { [type: string]: DataType };

    public static get(type: Type): DataType {

        if (!this.instances) {
            this.instances = {};
            this.instances[Type.String] = new StringDataType();
            this.instances[Type.Number] = new NumberDataType();
            this.instances[Type.Date] = new DateTimeDataType();
            this.instances[Type.DateTime] = new DateTimeDataType();
            this.instances[Type.Boolean] = new BooleanDataType();
            this.instances[Type.Object] = new ObjectDataType();
            this.instances[Type.ObjectArray] = new ObjectArrayDataType();
            this.instances[Type.StringArray] = new StringArrayDataType();
            this.instances[Type.NumberArray] = new NumberArrayDataType();
            this.instances[Type.Password] = new StringDataType();
            // this.instances[Type.Base64] = new StringDataType();
            // this.instances[Type.Binary] = new StringDataType();
        }

        return this.instances[type];
    }
}

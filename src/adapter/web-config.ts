import { Config } from './config';
import { NameValue } from '../types';
import { WebOptions } from './web-options';

export interface WebConfig extends Config {
    healthCheckEndpoint: string;
    host?: string;
    parameters?: NameValue;
    webOptions?: WebOptions;
    systemAuth?: string;
}

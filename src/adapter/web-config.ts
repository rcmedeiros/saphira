import { NameValue } from '../types';
import { Config } from './config';
import { WebOptions } from './web-options';

export interface WebConfig extends Config {
    healthCheckEndpoint: string;
    host?: string;
    parameters?: NameValue;
    webOptions?: WebOptions;
    systemAuth?: string;
}

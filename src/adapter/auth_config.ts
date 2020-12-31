import { Config } from './config';

export interface AuthConfig extends Config {
    clientId: string;
    clientSecret?: string;
    serverURI?: string;
    publicKey?: string;
}

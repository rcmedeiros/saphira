import { Config } from './config';

export interface AuthConfig extends Config {
    clientId: string;
    clientSecret?: string;
    serverURI?: string;
    tokenEndpoint?: string;
    publicKey?: string;
    clientIdProp?: string;
    clientSecretProp?: string;
    subjectProp?: string;
    fixedExpiration?: number;
    tokenProp?: string;
}

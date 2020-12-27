import { Done, after, before } from 'mocha';

import { Saphira } from '../src';
import { Service1 } from './mocks/sample_server/service_1';
import { Service2 } from './mocks/sample_server/service_2';
import { Service3 } from './mocks/sample_server/service_3';
import { Service4 } from './mocks/sample_server/service_4';

const PORT: number = 8080;
export const URI: string = `http://localhost:${PORT}`;
export const SERVICE_1: string = '/api/service1';
const SERVICE_2: string = '/api/service2';
export const SERVICE_3: string = '/api/service3';
export const SERVICE_1_QUERY_PARAMETERS: string = `${SERVICE_1}/queryParameters`;
export const SERVICE_1_NO_PARAMETER: string = `${SERVICE_1}/noParameter`;
export const SERVICE_1_PATH_PARAMETER: string = `${SERVICE_1}/pathParameter`;
export const SERVICE_1_THROW_ERROR: string = `${SERVICE_1}/willThrowError`;
export const SERVICE_1_WILL_RETURN: string = `${SERVICE_1}/willReturn`;
export const SERVICE_2_BODY_PARAMETERS: string = `${SERVICE_2}/bodyParameters`;
export const SERVICE_2_PRIME_VAULT: string = `${SERVICE_2}/primeVault`;
export const SERVICE_2_RETRIEVE_VAULT_VALUES: string = `${SERVICE_2}/retrieveVaultValues`;
export const SERVICE_3_PAGED_LIST: string = `${SERVICE_3}/pagedList`;
const SERVICE_4: string = '/api/service4';
export const SERVICE_4_AN_OBJECT: string = `${SERVICE_4}/anObject`;
export const SERVICE_4_AN_ARRAY: string = `${SERVICE_4}/anArray`;

const s: Saphira = new Saphira([Service1, Service2, Service3, Service4], { port: PORT });
before((done: Done) => {
    s.listen()
        .then(() => {
            done();
        })
        .catch(console.error);
});

after((done: Done) => {
    s.close()
        .then(() => {
            done();
        })
        .catch((err: Error) => {
            done(err);
        });
});

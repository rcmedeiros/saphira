import { after, before, Done } from 'mocha';
import { Saphira } from '../src';
import { Service1 } from './sample_server/service_1';
import { Service2 } from './sample_server/service_2';
import { Service3 } from './sample_server/service_3';

const PORT: number = 8080;
export const URI: string = `http://localhost:${PORT}`;
export const SERVICE_1: string = '/api/Service1';
const SERVICE_2: string = '/api/Service2';
export const SERVICE_3: string = '/api/Service3';
export const SERVICE_1_QUERY_PARAMETERS: string = `${SERVICE_1}/queryParameters`;
export const SERVICE_1_NO_PARAMETER: string = `${SERVICE_1}/noParameter`;
export const SERVICE_1_PATH_PARAMETER: string = `${SERVICE_1}/pathParameter`;
export const SERVICE_1_THROW_ERROR: string = `${SERVICE_1}/willThrowError`;
export const SERVICE_2_BODY_PARAMETERS: string = `${SERVICE_2}/bodyParameters`;

const s: Saphira = new Saphira([Service1, Service2, Service3], { port: PORT });
before((done: Done) => {
    s.listen().then(() => {
        done();
    }).catch(console.error);
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

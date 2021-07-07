import { Saphira } from '../../../src/index';
import { Service1 } from './service_1';
import { Service2 } from './service_2';
import { Service3 } from './service_3';
import { Service4 } from './service_4';

const s: Saphira = new Saphira([Service1, Service2, Service3, Service4]);

s.listen()
    .then(() => {
        console.info('server started');
    })
    .catch((e: Error) => {
        console.error(e.message)
    });

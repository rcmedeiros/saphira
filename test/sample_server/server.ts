import { Saphira } from '../../src/index';
import { Service1 } from './service_1';

const s: Saphira = new Saphira([Service1]);

s.listen().then(() => {
    console.info('server started');
});

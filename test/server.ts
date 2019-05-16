import { Saphira } from '../src/index';
import { Probe } from './probe';

const s: Saphira = new Saphira([Probe]);

s.listen().then(() => {
    console.info('server started');
});

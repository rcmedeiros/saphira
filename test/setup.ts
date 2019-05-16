import { before, after } from "mocha"
import { Saphira } from '../src/index';
import { Probe } from './probe';

let s: Saphira = new Saphira([Probe]);
before((done) => {
    s.listen().then(() => {
        done();
    })
});

after((done) => {
    s.close()
        .then(() => {
            done();
        })
        .catch((err: Error) => {
            done(err);
        });
});

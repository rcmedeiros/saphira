import { before, after } from "mocha"
import { Saphira } from '../src';
import { Probe } from './sample_server/probe';

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

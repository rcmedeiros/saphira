import { before, after } from "mocha"
import { Saphira } from '../src';
import { Service1 } from './sample_server/service_1';

const PORT = 8080;
export const URI = `http://localhost:${PORT}`;

let s: Saphira = new Saphira([Service1], { port: PORT });
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

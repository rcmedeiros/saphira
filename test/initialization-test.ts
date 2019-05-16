import { it, describe } from "mocha"
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { Probe } from './sample_server/probe';
import { Saphira, SaphiraOptions } from '../src';

chai.should();
chai.use(chaiHttp)

const startStop = (opts?: SaphiraOptions) => new Promise<void>((resolve: Function, reject: Function): void => {
    const s: Saphira = new Saphira([Probe], opts);
    s.listen().then(() => {
        console.debug('started');

        s.close()
            .then(() => {
                resolve();
                console.debug('resolve');
            })
            .catch((err: Error) => {
                console.debug('reject');
                reject(err);
            });

    }).catch((err) => {
        reject(err);
    })
});

describe('Initialization', () => {

    it('Should work without any configuration', (done) => {
        startStop().then(() => { done() }).catch((err) => { done(err) });
    });

    it('With custom port', (done) => {
        const opts: SaphiraOptions = {
            port: 81
        }
        startStop(opts).then(() => { done() }).catch((err) => { done(err) });
    });

});
import fs from 'fs';
import path from 'path';
import { it, describe, beforeEach, afterEach } from "mocha"
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { Probe } from './sample_server/probe';
import { Saphira, SaphiraOptions, Controller } from '../src';
import { ENDPOINT_HEALTH_CHECK, DEFAULT_HTTPS_PORT, DEFAULT_HTTP_PORT, UTF8, HEADER_X_HRTIME } from "../src/constants/settings";
import { HttpStatusCode } from "../src/errors/http_status_codes";
import selfSigned, { SelfSignedPEMs } from 'selfsigned';
import { BadController } from './sample_server/BadController';
import { WriteStream } from 'tty';

chai.should();
chai.use(chaiHttp)

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const healthyStart = (done: Function, opts?: SaphiraOptions) => {
    const s: Saphira = new Saphira([Probe], opts);
    s.listen().then(() => {

        if (!opts) {
            opts = {};
        }
        chai.request(`http${opts.https ? 's' : ''}://localhost:${
            opts.port || (opts.https ? DEFAULT_HTTPS_PORT : DEFAULT_HTTP_PORT)}`
        ).get(ENDPOINT_HEALTH_CHECK)
            .end((err, res) => {
                if (!err) {
                    try {
                        expect(res.status).to.be.equal(HttpStatusCode.OK);
                    } catch (e) {
                        done(e);
                        return;
                    }
                    s.close().then(() => done()).catch((err) => done(err));
                } else {
                    done(err);
                }
            });
    }).catch((err) => done(err))
};

describe('Healthy Initialization', () => {

    it('Should work without any configuration', (done) => healthyStart(done));
    it('Should work in a custom port', (done) => healthyStart(done, { port: 8181 }));
    it('Should accept cors options without exposedHeaders', (done) => healthyStart(done, { corsOptions: { maxAge: 86400 } }));
    it('Should accept cors options with exposedHeader as string', (done) =>
        healthyStart(done, { corsOptions: { exposedHeaders: 'location' } }));
    it('Should accept cors options with exposedHeader as array', (done) =>
        healthyStart(done, { corsOptions: { exposedHeaders: ['location', HEADER_X_HRTIME] } }));

    it('Should allow api docs concealment', (done) => {
        healthyStart(done, { concealApiDocs: true })
    });

    it('Should allow configuration of servers endpoints', (done) => {
        healthyStart(done, { servers: [{ url: new URL('http://localhost'), description: 'Test Description' }] })
    });



    it('Should work with SSL', (done) => {
        selfSigned.generate([{ name: 'commonName', value: 'localhost' }], { days: 365 }, (err: Error, pems: SelfSignedPEMs) => {
            healthyStart(done, { https: { cert: pems.cert, key: pems.private } });
        });
    });
    const keyRelPath: string = 'test/sample_server/localhost.key';
    const certRelPath: string = 'test/sample_server/localhost.crt';
    it('Should load SSL from relative files', (done) => {

        const pems = selfSigned.generate([{ name: 'commonName', value: 'localhost' }], { days: 365 }, (err: Error, pems: SelfSignedPEMs) => {
            fs.writeFileSync(keyRelPath, pems.private, UTF8);
            fs.writeFileSync(certRelPath, pems.cert, UTF8);

            healthyStart(done, { https: { certPath: certRelPath, keyPath: keyRelPath } });
        });
    });

    it('Should load SSL from files', (done) => {
        const keyAbsPath: string = path.join(process.cwd(), keyRelPath);
        const certAbsPath: string = path.join(process.cwd(), certRelPath);

        const pems = selfSigned.generate([{ name: 'commonName', value: 'localhost' }], { days: 365 }, (err: Error, pems: SelfSignedPEMs) => {
            healthyStart(done, { https: { certPath: certAbsPath, keyPath: keyAbsPath } });
        });
    });
});


describe('Problems', () => {

    it('Should fail with a wrong controller', () => {
        expect(() => new Saphira([BadController])).to.throw('The route for GET /api/BadController/doSomething is already handled.')
    });


})
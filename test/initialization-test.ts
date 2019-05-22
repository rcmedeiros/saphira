import fs from 'fs';
import path from 'path';
import { it, describe } from "mocha"
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { Service1 } from './sample_server/service_1';
import { Saphira, SaphiraOptions } from '../src';
import { ENDPOINT_HEALTH_CHECK, DEFAULT_HTTPS_PORT, DEFAULT_HTTP_PORT, UTF8, HEADER_X_HRTIME } from "../src/constants/settings";
import { HttpStatusCode } from "../src/errors/http_status_codes";
import selfSigned, { SelfSignedPEMs } from 'selfsigned';
import { BadControllerOverhandling } from './sample_server/bad_controller_overhandling';
import { BadControllerInvalidParameterType } from './sample_server/bad_controller_invalid_parameter_type';
import { BadControllerParametersMismatch } from './sample_server/bad_controller_parameters_mismatch';
import { BadControllerTwoParentPathParameters } from './sample_server/bad_controller_two_parent_path_parameters';

chai.should();
chai.use(chaiHttp)

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const healthyStart = (done: Function, opts?: SaphiraOptions) => {
    const s: Saphira = new Saphira([Service1], opts);
    s.listen().then(() => {

        opts = opts || {};
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

describe('Healthy Initialization under SSL', () => {
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
})

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
});


describe('Problems', () => {

    it('Should fail with when assigning a route twice', () => {
        expect(() => new Saphira([BadControllerOverhandling])).to.throw('The route for GET /api/BadControllerOverhandling/doSomething is already handled')
    });

    it('Should fail when using invalid parameter type', () => {
        expect(() => new Saphira([BadControllerInvalidParameterType])).to.throw('Http202 is not a valid parameter type')
    });
    it('Should fail when using invalid parameter type', () => {
        expect(() => new Saphira([BadControllerParametersMismatch])).to.throw('The operation and its method must declare the same parameters')
    });
    it('Should fail when declaring two parent path parameters', () => {
        expect(() => new Saphira([BadControllerTwoParentPathParameters])).to.throw('Only one path parameter allowed between. a and b are conflicting')
    });

})
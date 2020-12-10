import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { HttpResponse } from 'chai-http-ext';
import fs from 'fs';
import { describe, Done, it } from 'mocha';
import path from 'path';
import selfSigned, { SelfSignedPEMs } from 'selfsigned';
import { Controller, Saphira, SaphiraOptions } from '../src';
import { DEFAULT_HTTP_PORT, DEFAULT_HTTPS_PORT, ENDPOINT_HEALTH_CHECK, HEADER_X_HRTIME, UTF8 } from '../src/constants/settings';
import { HttpStatusCode } from '../src/constants/http_status_codes';
import { BadControllerInvalidParameterType } from './sample_server/bad_controller_invalid_parameter_type';
import { BadControllerOverhandling } from './sample_server/bad_controller_overhandling';
import { BadControllerParametersMismatch } from './sample_server/bad_controller_parameters_mismatch';
import { BadControllerTwoParentPathParameters } from './sample_server/bad_controller_two_parent_path_parameters';
import { Service1 } from './sample_server/service_1';
import { BadControllerPayloadConflict } from './sample_server/bad_controller_payload_conflict';
import { BadControllerNamelessParameter } from './sample_server/bad_controller_nameless_parameter';
import { BadControllerInvalidVerb } from './sample_server/bad_controller_invalid_verb';
import { BadControllerInvalidJsonPayload } from './sample_server/bad_controller_invalid_json_payload';

chai.use(chaiHttp);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const healthyStart: Function = (done: Done, opts?: SaphiraOptions): void => {
    const s: Saphira = new Saphira([Service1], opts);
    s.listen().then(() => {

        opts = opts || {};
        chai.request(`http${s.tls ? 's' : ''}://localhost:${opts.port || (s.tls ? DEFAULT_HTTPS_PORT : DEFAULT_HTTP_PORT)}`,
        ).get(ENDPOINT_HEALTH_CHECK)
            .end((err: Error, res: HttpResponse) => {
                if (!err) {
                    try {
                        expect(res.status).to.be.equal(HttpStatusCode.OK);
                    } catch (e) {
                        done(e);
                        return;
                    }
                    s.close().then(() => done()).catch((e: Error) => done(e));
                } else {
                    done(err);
                }
            });
    }).catch((err: Error) => done(err));
};

describe('Healthy Initialization under SSL', () => {
    const keyRelPath: string = 'test/sample_server/localhost.key';
    const certRelPath: string = 'test/sample_server/localhost.crt';
    it('Should load SSL from relative files', (done: Done) => {

        selfSigned.generate([{ name: 'commonName', value: 'localhost' }], { days: 365 }, (err: Error, pems: SelfSignedPEMs) => {
            fs.writeFileSync(keyRelPath, pems.private, UTF8);
            fs.writeFileSync(certRelPath, pems.cert, UTF8);

            healthyStart(done, { https: { certPath: certRelPath, keyPath: keyRelPath } });
        });
    });

    it('Should load SSL from files', (done: Done) => {
        const keyAbsPath: string = path.join(process.cwd(), keyRelPath);
        const certAbsPath: string = path.join(process.cwd(), certRelPath);

        selfSigned.generate([{ name: 'commonName', value: 'localhost' }], { days: 365 }, (err: Error, pems: SelfSignedPEMs) => {
            healthyStart(done, { https: { certPath: certAbsPath, keyPath: keyAbsPath } });
        });
    });
});

describe('Healthy Initialization', () => {
    it('Should work without any configuration', (done: Done) => { healthyStart(done); });
    it('Should work in a custom port', (done: Done) => { healthyStart(done, { port: 8181 }); });
    it('Should accept cors options without exposedHeaders', (done: Done) => { healthyStart(done, { corsOptions: { maxAge: 86400 } }); });
    it('Should accept cors options with exposedHeader as string', (done: Done) => { healthyStart(done, { corsOptions: { exposedHeaders: 'location' } }); });
    it('Should accept cors options with exposedHeader as array', (done: Done) => {
        healthyStart(done, { corsOptions: { exposedHeaders: ['location', HEADER_X_HRTIME] } });
    });

    it('Should allow api docs concealment', (done: Done) => { healthyStart(done, { concealApiDocs: true }); });

    it('Should allow configuration of servers endpoints', (done: Done) => {
        healthyStart(done, { servers: [{ url: new URL('http://localhost'), description: 'Test Description' }] });
    });

    it('Should work with SSL', (done: Done) => {
        selfSigned.generate([{ name: 'commonName', value: 'localhost' }], { days: 365 }, (err: Error, pems: SelfSignedPEMs) => {
            healthyStart(done, { https: { cert: pems.cert, key: pems.private } });
        });
    });
});


const wrongStart: Function = (done: Done, controllerTypes: Array<typeof Controller>, errorMessage: string): void => {
    const s: Saphira = new Saphira(controllerTypes);
    s.listen().then(() => {
        done(new Error(`Expected error: ${errorMessage}`));
    }).catch((err: Error) => {
        try {
            expect(err.message).to.be.equal(errorMessage);
            done();
        } catch (e) {
            done(new Error(e.message));
        }
    });
};


describe('Problems', () => {

    it('Should fail with when assigning a route twice', (done: Done) => {
        wrongStart(done, [BadControllerOverhandling], 'The route for GET /api/badControllerOverhandling/doSomething is already handled');
    })
    it('Should fail when using invalid parameter type', (done: Done) => {
        wrongStart(done, [BadControllerInvalidParameterType], 'Http202 is not a valid parameter type');
    })
    it('Should fail when using invalid parameter type', (done: Done) => {
        wrongStart(done, [BadControllerParametersMismatch], 'The operation and its method must declare the same parameters');
    })
    it('Should fail when declaring two parent path parameters', (done: Done) => {
        wrongStart(done, [BadControllerTwoParentPathParameters], 'Only one path parameter allowed between. a and b are conflicting');
    })
    it('Should fail when not declaring a parameter name', (done: Done) => {
        wrongStart(done, [BadControllerNamelessParameter], 'Missing parameter name');
    })
    it('Should fail when declaring both parameters and root payload', (done: Done) => {
        wrongStart(done, [BadControllerPayloadConflict], 'Declare either a payload, or it\'s params. Can\'t have both');
    })
    it('Should fail when declaring a payload for an HTTP Verb which doesn\'t have a body', (done: Done) => {
        wrongStart(done, [BadControllerInvalidVerb], 'Cannot GET with a body payload');
    })
    it('Should fail when declaring a payload for an HTTP Verb which doesn\'t have a body', (done: Done) => {
        wrongStart(done, [BadControllerInvalidJsonPayload], 'Payload must be either an object or an array');
    })
});

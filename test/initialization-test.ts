import { Controller, Saphira, SaphiraOptions } from '../src';
import {
    DEFAULT_HTTPS_PORT,
    DEFAULT_HTTP_PORT,
    ENDPOINT_HEALTH_CHECK,
    ENV_TLS,
    FILENAME_TLS_CERTIFICATE,
    FILENAME_TLS_KEY,
    HEADER_X_HRTIME,
    UTF8,
} from '../src/constants/settings';
import { Done, describe, it } from 'mocha';
import chai, { expect } from 'chai';
import { deleteEnvVar, saveEnvVar } from './helper';
import selfSigned, { SelfSignedPEMs } from 'selfsigned';

import { BadControllerInvalidJsonPayload } from './mocks/sample_server/bad_controller_invalid_json_payload';
import { BadControllerInvalidParameterType } from './mocks/sample_server/bad_controller_invalid_parameter_type';
import { BadControllerInvalidVerb } from './mocks/sample_server/bad_controller_invalid_verb';
import { BadControllerNamelessParameter } from './mocks/sample_server/bad_controller_nameless_parameter';
import { BadControllerOverhandling } from './mocks/sample_server/bad_controller_overhandling';
import { BadControllerParametersMismatch } from './mocks/sample_server/bad_controller_parameters_mismatch';
import { BadControllerPayloadConflict } from './mocks/sample_server/bad_controller_payload_conflict';
import { BadControllerTwoParentPathParameters } from './mocks/sample_server/bad_controller_two_parent_path_parameters';
import { HttpResponse } from 'chai-http-ext';
import { HttpStatusCode } from '../src/constants/http_status_codes';
import { Service1 } from './mocks/sample_server/service_1';
import chaiHttp from 'chai-http';
import fs from 'fs';
import path from 'path';

chai.use(chaiHttp);

const healthyStart: (done: Done, opts?: SaphiraOptions, tls?: boolean) => void = (
    done: Done,
    opts?: SaphiraOptions,
    tls?: boolean,
): void => {
    const s: Saphira = new Saphira([Service1], opts);
    s.listen()
        .then(() => {
            opts = opts || {};
            chai.request(
                `http${tls ? 's' : ''}://localhost:${opts.port || (tls ? DEFAULT_HTTPS_PORT : DEFAULT_HTTP_PORT)}`,
            )
                .get(ENDPOINT_HEALTH_CHECK)
                .end((err: Error, res: HttpResponse) => {
                    if (!err) {
                        try {
                            expect(res.status).to.be.equal(HttpStatusCode.OK);
                        } catch (e) {
                            done(e);
                            return;
                        }
                        s.close()
                            .then(() => done())
                            .catch((e: Error) => done(e));
                    } else {
                        done(err);
                    }
                });
        })
        .catch((err: Error) => done(err));
};

describe('Healthy Initialization with TLS', () => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    it('Should work with SSL', (done: Done) => {
        selfSigned.generate(
            [{ name: 'commonName', value: 'localhost' }],
            { days: 365 },
            (err: Error, pems: SelfSignedPEMs) => {
                saveEnvVar(ENV_TLS, JSON.stringify({ cert: pems.cert, key: pems.private }));
                healthyStart(done, undefined, true);
                deleteEnvVar(ENV_TLS);
            },
        );
    });
    const relPath: string = 'test/mocks/sample_server';
    const absPath: string = path.join(process.cwd(), relPath);
    it('Should load SSL from relative files', (done: Done) => {
        const keyFile: string = path.join(relPath, FILENAME_TLS_KEY);
        const certFile: string = path.join(relPath, FILENAME_TLS_CERTIFICATE);
        selfSigned.generate(
            [{ name: 'commonName', value: 'localhost' }],
            { days: 365 },
            (_err: Error, pems: SelfSignedPEMs) => {
                fs.writeFileSync(keyFile, pems.private, UTF8);
                fs.writeFileSync(certFile, pems.cert, UTF8);
                saveEnvVar(ENV_TLS, relPath);
                healthyStart(done, undefined, true);
            },
        );
    });
    it('Should load SSL from absolute files', (done: Done) => {
        const keyFile: string = path.join(absPath, FILENAME_TLS_KEY);
        const certFile: string = path.join(absPath, FILENAME_TLS_CERTIFICATE);
        saveEnvVar(ENV_TLS, absPath);
        healthyStart(done, undefined, true);
        fs.unlinkSync(keyFile);
        fs.unlinkSync(certFile);
        deleteEnvVar(ENV_TLS);
    });
});

describe('Healthy Initialization', () => {
    it('Should work without any configuration', (done: Done) => {
        healthyStart(done);
    });
    it('Should print routes', (done: Done) => {
        process.env.SAPHIRA_DEBUG_ROUTES = 'true';
        healthyStart(() => {
            delete process.env.SAPHIRA_DEBUG_ROUTES;
            done();
        });
    });
    it('Should dismiss security when server path is not TLS protected', (done: Done) => {
        process.env.SAPHIRA_SERVER_PATHS = 'http://localhost:8472';
        healthyStart(() => {
            delete process.env.SAPHIRA_SERVER_PATHS;
            done();
        });
    });
    it('Should work in a custom port', (done: Done) => {
        healthyStart(done, { port: 8181 });
    });
    it('Should accept cors options without exposedHeaders', (done: Done) => {
        healthyStart(done, { corsOptions: { maxAge: 86400 } });
    });
    it('Should accept cors options with exposedHeader as string', (done: Done) => {
        healthyStart(done, { corsOptions: { exposedHeaders: 'location' } });
    });
    it('Should accept cors options with exposedHeader as array', (done: Done) => {
        healthyStart(done, { corsOptions: { exposedHeaders: ['location', HEADER_X_HRTIME] } });
    });
    it('Should allow configuration of servers endpoints', (done: Done) => {
        healthyStart(done, { servers: [{ url: new URL('http://localhost'), description: 'Test Description' }] });
    });
});

const wrongStart: (done: Done, controllerTypes: Array<typeof Controller>, errorMessage: string) => void = (
    done: Done,
    controllerTypes: Array<typeof Controller>,
    errorMessage: string,
): void => {
    const s: Saphira = new Saphira(controllerTypes);
    s.listen()
        .then(() => {
            done(new Error(`Expected error: ${errorMessage}`));
        })
        .catch((err: Error) => {
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
        wrongStart(
            done,
            [BadControllerOverhandling],
            'The route for GET /api/badControllerOverhandling/doSomething is already handled',
        );
    });
    it('Should fail when using invalid parameter type', (done: Done) => {
        wrongStart(done, [BadControllerInvalidParameterType], 'Http202 is not a valid parameter type');
    });
    it('Should fail when using invalid parameter type', (done: Done) => {
        wrongStart(
            done,
            [BadControllerParametersMismatch],
            'The operation and its method must declare the same parameters',
        );
    });
    it('Should fail when declaring two parent path parameters', (done: Done) => {
        wrongStart(
            done,
            [BadControllerTwoParentPathParameters],
            'Only one path parameter allowed between. a and b are conflicting',
        );
    });
    it('Should fail when not declaring a parameter name', (done: Done) => {
        wrongStart(done, [BadControllerNamelessParameter], 'Missing parameter name');
    });
    it('Should fail when declaring both parameters and root payload', (done: Done) => {
        wrongStart(done, [BadControllerPayloadConflict], "Declare either a payload, or it's params. Can't have both");
    });
    it("Should fail when declaring a payload for an HTTP Verb which doesn't have a body", (done: Done) => {
        wrongStart(done, [BadControllerInvalidVerb], 'Cannot GET with a body payload');
    });
    it("Should fail when declaring a payload for an HTTP Verb which doesn't have a body", (done: Done) => {
        wrongStart(done, [BadControllerInvalidJsonPayload], 'Payload must be either an object or an array');
    });
});

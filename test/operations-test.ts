// cSpell: ignore Kaladin Dalinar Adolin Renarin Sylphrena Glys Wyndle Stormfather
import './setup';
import { it, describe } from "mocha"
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { SERVICE_1_NO_PARAMETER, SERVICE_1_PATH_PARAMETER, URI, SERVICE_1, SERVICE_1_THROW_ERROR, SERVICE_3 } from './setup';
import { testSuccessfulGET, testFailedGET } from './template';
import { HttpStatusCode } from '../src/errors/http_status_codes';
chai.should();

chai.use(chaiHttp)

describe('Queries', () => {


    it('should allow parameter-less operations', (done) => {
        testSuccessfulGET(SERVICE_1_NO_PARAMETER, undefined).then(() => done(), done);
    });

    it('should allow path parameters in operations', (done) => {
        chai.request(URI).delete(`${SERVICE_1_PATH_PARAMETER}/4321?sure=yes`).end((err, res) => {
            if (err) { done(err) } else {
                try {
                    expect(JSON.stringify(res.body)).to.be.equal(JSON.stringify({}));
                    expect(res.status).to.be.equal(HttpStatusCode.NO_CONTENT);
                    expect(res.header['x-high-resolution-elapsed-time']).to.not.be.null;
                    done()
                } catch (e) {
                    done(e);
                }
            }
        });
    });

    it('should reject required parameters not sent', (done) => {
        chai.request(URI).delete(`${SERVICE_1_PATH_PARAMETER}/4321`).end((err, res) => {
            if (err) { done(err) } else {
                try {
                    expect(res.body.message).to.be.equal('sure is required');
                    expect(res.status).to.be.equal(HttpStatusCode.BAD_REQUEST);
                    expect(res.header['content-type']).to.be.equal('application/json; charset=utf-8');
                    done()
                } catch (e) {
                    done(e);
                }
            }
        });
    });

    it('should allow parent path parameters in operations', (done) => {
        chai.request(URI).put(`${SERVICE_1}/9876/parentPathParameter`).send({ what: 'whatever' }).end((err, res) => {
            if (err) { done(err) } else {
                try {
                    expect(JSON.stringify(res.body)).to.be.equal(JSON.stringify({}));
                    expect(res.status).to.be.equal(HttpStatusCode.NO_CONTENT);
                    expect(res.header['x-high-resolution-elapsed-time']).to.not.be.null;
                    done()
                } catch (e) {
                    done(e);
                }
            }
        });
    });

    it('should handle exceptions inside operations', (done) => {
        const promises: Array<Promise<void>> = [];
        promises.push(testFailedGET(`${SERVICE_1_THROW_ERROR}1`, 'Something wrong. Throwing.', { expectedStatus: HttpStatusCode.INTERNAL_SERVER_ERROR, description: '1' }));
        promises.push(testFailedGET(`${SERVICE_1_THROW_ERROR}2`, 'Something wrong. Rejecting.', { expectedStatus: HttpStatusCode.INTERNAL_SERVER_ERROR, description: '2' }));
        promises.push(testFailedGET(`${SERVICE_1_THROW_ERROR}3`, 'Something wrong. Throwing.', { expectedStatus: HttpStatusCode.INTERNAL_SERVER_ERROR, description: '3' }));
        promises.push(testFailedGET(`${SERVICE_1_THROW_ERROR}4`, 'Something wrong. Rejecting.', { expectedStatus: HttpStatusCode.BAD_GATEWAY, description: '4' }));
        promises.push(testFailedGET(`${SERVICE_1_THROW_ERROR}5`, 'Something wrong. Rejecting.', { expectedStatus: HttpStatusCode.INTERNAL_SERVER_ERROR, description: '5' }));
        Promise.all(promises).then(() => done(), done);
    });

    it('operation name should not collide with path parameter', (done) => {
        const promises: Array<Promise<void>> = [];

        testSuccessfulGET(`${SERVICE_3}/1234`, { id: 1, name: 'Alpha' }, 'instance')
        testSuccessfulGET(`${SERVICE_3}/subInstances?id=1234`, [{ id: 2, name: 'Beta' }, { id: 3, name: 'Gamma' }, { id: 4, name: 'Delta' }], 'sub-instances')

        Promise.all(promises).then(() => done(), done);
    });
});
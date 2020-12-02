// cSpell: ignore Kaladin Dalinar Adolin Renarin Sylphrena Glys Wyndle Stormfather
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { HttpResponse } from 'chai-http-ext';
import { describe, Done, it } from 'mocha';
import { XPagination } from '../src/controller/x-pagination';
import { HttpStatusCode } from '../src/constants/http_status_codes';
import {
    SERVICE_1, SERVICE_1_NO_PARAMETER, SERVICE_1_PATH_PARAMETER,
    SERVICE_1_THROW_ERROR, SERVICE_3, SERVICE_3_PAGED_LIST, URI,
} from './setup';
import { testFailedGET, testSuccessfulGET, testSuccessfulPOST } from './template';

chai.use(chaiHttp);

describe('Operations', () => {

    it('should allow parameter-less operations', (done: Done) => {
        testSuccessfulGET(SERVICE_1_NO_PARAMETER, {}).then(() => done(), done);
    });

    it('should allow path parameters in operations', (done: Done) => {
        chai.request(URI).delete(`${SERVICE_1_PATH_PARAMETER}/4321?sure=yes`).end((err: Error, res: HttpResponse) => {
            if (err) { done(err); } else {
                try {
                    expect(JSON.stringify(res.body)).to.be.equal(JSON.stringify({}));
                    expect(res.status).to.be.equal(HttpStatusCode.NO_CONTENT);
                    expect(res.header['x-high-resolution-elapsed-time']).to.not.be.null;
                    done();
                } catch (e) {
                    done(e);
                }
            }
        });
    });

    it('should reject required parameters not sent', (done: Done) => {
        chai.request(URI).delete(`${SERVICE_1_PATH_PARAMETER}/4321`).end((err: Error, res: HttpResponse) => {
            if (err) { done(err); } else {
                try {
                    expect((res.body as Error).message).to.be.equal('sure is required');
                    expect(res.status).to.be.equal(HttpStatusCode.BAD_REQUEST);
                    expect(res.header['content-type']).to.be.equal('application/json; charset=utf-8');
                    done();
                } catch (e) {
                    done(e);
                }
            }
        });
    });

    it('should allow parent path parameters in operations', (done: Done) => {
        chai.request(URI).put(`${SERVICE_1}/9876/parentPathParameter`).send({ what: 'whatever' }).end((err: Error, res: HttpResponse) => {
            if (err) { done(err); } else {
                try {
                    expect(JSON.stringify(res.body)).to.be.equal(JSON.stringify({}));
                    expect(res.status).to.be.equal(HttpStatusCode.CREATED);
                    expect(res.header['x-high-resolution-elapsed-time']).to.not.be.null;
                    done();
                } catch (e) {
                    done(e);
                }
            }
        });
    });

    it('should handle exceptions inside operations', (done: Done) => {
        const promises: Array<Promise<HttpResponse>> = [];
        promises.push(testFailedGET(`${SERVICE_1_THROW_ERROR}1`, 'Something wrong. Throwing.',
            { expectedStatus: HttpStatusCode.INTERNAL_SERVER_ERROR, description: '1' }));
        promises.push(testFailedGET(`${SERVICE_1_THROW_ERROR}2`, 'Something wrong. Rejecting.',
            { expectedStatus: HttpStatusCode.INTERNAL_SERVER_ERROR, description: '2' }));
        promises.push(testFailedGET(`${SERVICE_1_THROW_ERROR}3`, 'Something wrong. Throwing.',
            { expectedStatus: HttpStatusCode.INTERNAL_SERVER_ERROR, description: '3' }));
        promises.push(testFailedGET(`${SERVICE_1_THROW_ERROR}4`, 'Something wrong. Rejecting.',
            { expectedStatus: HttpStatusCode.BAD_GATEWAY, description: '4' }));
        promises.push(testFailedGET(`${SERVICE_1_THROW_ERROR}5`, 'Something wrong. Rejecting.',
            { expectedStatus: HttpStatusCode.INTERNAL_SERVER_ERROR, description: '5' }));
        Promise.all(promises).then(() => done(), done);
    });

    it('operation name should not collide with path parameter', (done: Done) => {
        const promises: Array<Promise<HttpResponse>> = [];

        promises.push(testSuccessfulGET(`${SERVICE_3}/1234`, { id: 1, name: 'Alpha' }, 'instance'));
        promises.push(testSuccessfulGET(`${SERVICE_3}/subInstances?id=1234`,
            [{ id: 2, name: 'Beta' }, { id: 3, name: 'Gamma' }, { id: 4, name: 'Delta' }], 'sub-instances'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should display paging', (done: Done) => {

        testSuccessfulGET(SERVICE_3_PAGED_LIST, ['f', 'g', 'h', 'i', 'j']).then((response: HttpResponse) => {

            expect(response.header['x-pagination']).to.not.be.null;

            const pagination: XPagination = JSON.parse(response.header['x-pagination']) as XPagination;
            expect(pagination.count).to.be.equal(26);
            expect(pagination.pages).to.be.equal(6);

            done();
        }, done);

    });

    it('Should allow objects to answer for more then one verb', (done: Done) => {
        // The test bellow are defined with GET as well
        testSuccessfulPOST(SERVICE_3_PAGED_LIST, {}, ['f', 'g', 'h', 'i', 'j']).then((responses: Array<HttpResponse>) => {

            responses.forEach((response: HttpResponse) => {
                expect(response.header['x-pagination']).to.not.be.null;

                const pagination: XPagination = JSON.parse(response.header['x-pagination']) as XPagination;
                expect(pagination.count).to.be.equal(26);
                expect(pagination.pages).to.be.equal(6);
            });
            done();
        }, done);
    });

});

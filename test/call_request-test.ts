import { Done, describe, it } from 'mocha';
import { SERVICE_1_WITHOUT_PARAMETER_RETURN_REQUEST, SERVICE_1_WITH_PARAMETER_RETURN_REQUEST, URI } from './setup';
import chai, { expect } from 'chai';

import { HttpResponse } from 'chai-http-ext';
import chaiHttp from 'chai-http';

chai.use(chaiHttp);

describe('Call Request', () => {
    const token: string = `Bearer WhateverIWant`;

    it('Should be available on parameterized calls', (done: Done) => {
        chai.request(URI)
            .get(`${SERVICE_1_WITH_PARAMETER_RETURN_REQUEST}?id=1`)
            .set('Authorization', token)
            .end((err: Error, res: HttpResponse) => {
                expect(
                    (((res.body as Request).headers as unknown) as { authorization: string }).authorization,
                ).to.be.equal(token);
                done(err);
            });
    });

    it('Should be available on non parameterized calls', (done: Done) => {
        chai.request(URI)
            .get(`${SERVICE_1_WITHOUT_PARAMETER_RETURN_REQUEST}?id=1`)
            .set('Authorization', token)
            .end((err: Error, res: HttpResponse) => {
                expect(
                    (((res.body as Request).headers as unknown) as { authorization: string }).authorization,
                ).to.be.equal(token);
                done(err);
            });
    });
});

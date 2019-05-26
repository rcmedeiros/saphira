// cSpell: ignore Kaladin Dalinar Adolin Renarin Sylphrena Glys Wyndle Stormfather
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { HttpResponse } from 'chai-http-ext';
import { describe, Done, it } from 'mocha';
import { SERVICE_2_PRIME_VAULT, SERVICE_2_RETRIEVE_VAULT_VALUES } from './setup';
import { testSuccessfulGET } from './template';

chai.use(chaiHttp);

describe('The Vault', () => {
    it('should serialize boolean', (done: Done) => {
        const promises: Array<Promise<HttpResponse>> = [];
        testSuccessfulGET(SERVICE_2_PRIME_VAULT, {}, 'prime vault').then(() => {
            testSuccessfulGET(SERVICE_2_RETRIEVE_VAULT_VALUES, {
                v1: 'abc',
                v2: 'def',
                v3: 123.456,
                v4: true,
            }, 'retrieve vault values').then(() => done(), done);
        }, done);
    });
});

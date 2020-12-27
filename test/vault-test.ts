import { Done, describe, it } from 'mocha';
import { SERVICE_2_PRIME_VAULT, SERVICE_2_RETRIEVE_VAULT_VALUES } from './setup';

import { Vault } from '../src';
// cSpell: ignore Kaladin Dalinar Adolin Renarin Sylphrena Glys Wyndle Stormfather
import chai from 'chai';
import chaiHttp from 'chai-http';
import { testSuccessfulGET } from './template';

chai.use(chaiHttp);

describe('The Vault', () => {
    it('should serialize boolean', (done: Done) => {
        testSuccessfulGET(SERVICE_2_PRIME_VAULT, {}, 'prime vault').then(() => {
            testSuccessfulGET(
                SERVICE_2_RETRIEVE_VAULT_VALUES,
                {
                    v1: 'abc',
                    v2: 'def',
                    v3: 123.456,
                    v4: true,
                    all: {
                        jwt_key: !Vault.getInstance().has('jwt_key') ? undefined : Vault.getInstance().get('jwt_key'),
                        v1: 'abc',
                        v2: 'def',
                        v3: 123.456,
                        v4: true,
                        v5: 'ghi',
                    },
                },
                'retrieve vault values',
            ).then(() => done(), done);
        }, done);
    });
});

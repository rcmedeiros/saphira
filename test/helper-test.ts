// cSpell:ignore yxxx xvcj qssw
import { NameValue, decodeJWT, parseJson, uuid } from '../src';
import { describe, it } from 'mocha';

import { expect } from 'chai';

describe('JSON Helper', () => {
    it('Should parse valid objects', () => {
        expect((parseJson('{"hello":"world"}') as NameValue).hello).to.be.equal('world');
    });

    it('Should return undefined for invalid objects', () => {
        expect(parseJson('{"hello":}')).to.be.undefined;
    });
});

describe('UUID/v4 Helper', () => {
    it('Should match xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where x is any hexadecimal digit and y is one of 8, 9, A, or B.', () => {
        const set: Set<string> = new Set();
        for (let i: number = 0; i < 1000; i++) {
            const u: string = uuid();
            expect(u).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
            expect(set.has(u)).to.be.false;
            set.add(u);
        }
    });
});

describe('decodeJWT', () => {
    it('Should return a JWT without validating it', () => {
        const jwt: NameValue = decodeJWT(
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        );
        expect(jwt.name).not.to.be.null;
    });

    it('Should return undefined when JWT is invalid', () => {
        const jwt: NameValue = decodeJWT('invalid jwt');
        expect(jwt).to.be.null;
    });
});

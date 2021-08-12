import { describe, it } from 'mocha';
import { envVarAsNumber, envVarAsObject } from '../src/helpers';

import { NameValue } from '../src';
import { expect } from 'chai';

const EV1: string = 'ENV_VAR_1';
const EV2: string = 'ENV_VAR_2';
const EV3: string = 'ENV_VAR_3';
const EV4: string = 'ENV_VAR_4';
const EV5: string = 'ENV_VAR_5';
const EV6: string = 'ENV_VAR_6';
const EV7: string = 'ENV_VAR_7';

process.env[EV1] = 'whatever';
process.env[EV2] = '{a:1}';
process.env[EV3] = '{"a":1,"b":2,"c":3}';
process.env[EV4] = 'a=1;b=2;c=3';
process.env[EV5] = "a=1;b=2;c='3'";
process.env[EV6] = 'a=alpha;b=\'beta\';c="gamma";d=""delta""';
process.env[EV7] = "a=alpha;b='beta';c=";

describe('Object Environment variable', () => {
    it('absent variables should return undefined', () => {
        expect(envVarAsObject('EV0')).to.be.undefined;
    });
    it('primitive types should return undefined', () => {
        expect(envVarAsObject(EV1)).to.be.undefined;
    });
    it('invalid JSON objects should return undefined', () => {
        expect(envVarAsObject(EV2)).to.be.undefined;
    });
    it('valid JSON objects should be parsed', () => {
        const obj: NameValue = envVarAsObject(EV3) as NameValue;
        expect(obj).to.exist;
        expect(obj.a).to.be.equal(1);
        expect(obj.b).to.be.equal(2);
        expect(obj.c).to.be.equal(3);
    });
    it('valid colon separated pair of names and values should be parsed', () => {
        const obj: NameValue = envVarAsObject(EV4) as NameValue;
        expect(obj).to.exist;
        expect(obj.a).to.be.equal(1);
        expect(obj.b).to.be.equal(2);
        expect(obj.c).to.be.equal(3);
    });
    it('stringed numbers should be interpreted correctly', () => {
        const obj: NameValue = envVarAsObject(EV5) as NameValue;
        expect(obj).to.exist;
        expect(obj.a).to.be.equal(1);
        expect(obj.b).to.be.equal(2);
        expect(obj.c).to.be.equal('3');
    });
    it('stringed strings should be interpreted correctly', () => {
        const obj: NameValue = envVarAsObject(EV6) as NameValue;
        expect(obj).to.exist;
        expect(obj.a).to.be.equal('alpha');
        expect(obj.b).to.be.equal('beta');
        expect(obj.c).to.be.equal('gamma');
        expect(obj.d).to.be.equal('"delta"');
    });
    it('empty values', () => {
        const obj: NameValue = envVarAsObject(EV7) as NameValue;
        expect(obj).to.exist;
        expect(obj.a).to.be.equal('alpha');
        expect(obj.b).to.be.equal('beta');
        expect(obj.c).to.be.undefined;
    });
});

const EV11: string = 'ENV_VAR_10';
const EV12: string = 'ENV_VAR_11';
process.env[EV11] = '2';
process.env[EV12] = 'two';

describe('Number Environment variable', () => {
    it('should return numeric value', () => {
        expect(envVarAsNumber(EV11)).to.be.equal(2);
    });

    it("should return undefined when value isn't a number", () => {
        expect(envVarAsNumber(EV12)).to.be.undefined;
    });
    it("should return undefined when value doesn't exist", () => {
        expect(envVarAsNumber('EV0')).to.be.undefined;
    });
});

// cSpell: ignore Kaladin Dalinar Adolin Renarin Sylphrena Glys Wyndle Stormfather
import './setup';
import { it, describe } from "mocha"
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { SERVICE_1_GET_OPTIONAL, URI } from './setup';
import { testSuccess, testFailure } from './template';
chai.should();

chai.use(chaiHttp)


describe('Argument types for queries', () => {

    it('should deny invalid boolean', (done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?a=2`, '\'a\' should be of type \'Boolean\'', 'dny integers'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?a=someString`, '\'a\' should be of type \'Boolean\'', 'deny string'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?a={"any":"thing"}`, '\'a\' should be of type \'Boolean\'', 'deny objects'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?a=1980-06-09`, '\'a\' should be of type \'Boolean\'', 'deny dates'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should deny invalid Date', (done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?b=19`, '\'b\' should be of type \'Date\'', 'deny integer'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?b=Anything`, '\'b\' should be of type \'Date\'', 'deny string'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?b={"any":"thing"}`, '\'b\' should be of type \'Date\'', 'deny objects'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?b=true`, '\'b\' should be of type \'Date\'', 'deny boolean'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?b=1980/06/09`, '\'b\' should be of type \'Date\'', 'deny slash formatted'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?b=10:20:30Z`, '\'b\' should be of type \'Date\'', 'deny time part'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should deny invalid DateTime', (done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?c=19`, '\'c\' should be of type \'DateTime\'', 'deny integer'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?c=Anything`, '\'c\' should be of type \'DateTime\'', 'deny string'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?c={"any":"thing"}`, '\'c\' should be of type \'DateTime\'', 'deny objects'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?c=true`, '\'c\' should be of type \'DateTime\'', 'deny boolean'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?c=1980/06/09T10:20:30Z`, '\'c\' should be of type \'DateTime\'', 'deny slash formatted'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should deny invalid number', (done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?d=False`, '\'d\' should be of type \'Number\'', 'deny Booleans'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?d=someString`, '\'d\' should be of type \'Number\'', 'deny string'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?d={"any":"thing"}`, '\'d\' should be of type \'Number\'', 'deny objects'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?d=1980-06-09`, '\'d\' should be of type \'Number\'', 'deny dates'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should deny invalid array of numbers', (done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?e=someString`, '\'e\' should be of type \'NumberArray\'', 'deny string'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?e={"any":"thing"}`, '\'e\' should be of type \'NumberArray\'', 'deny objects'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?e=1980-06-09`, '\'e\' should be of type \'NumberArray\'', 'deny dates'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should deny invalid objects', (done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?f=3`, '\'f\' should be of type \'Object\'', 'deny numbers'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?f=False`, '\'f\' should be of type \'Object\'', 'deny Booleans'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?f=someString`, '\'f\' should be of type \'Object\'', 'deny string'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?f=1980-06-09`, '\'f\' should be of type \'Object\'', 'deny dates'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?f=a,b,c`, '\'f\' should be of type \'Object\'', 'deny arrays'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should deny invalid array of objects', (done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?g=3`, '\'g\' should be of type \'ObjectArray\'', 'deny numbers'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?g=False`, '\'g\' should be of type \'ObjectArray\'', 'deny Booleans'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?g=someString`, '\'g\' should be of type \'ObjectArray\'', 'deny string'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?g=1980-06-09`, '\'g\' should be of type \'ObjectArray\'', 'deny dates'));
        promises.push(testFailure(`${SERVICE_1_GET_OPTIONAL}?g=a,b,c`, '\'g\' should be of type \'ObjectArray\'', 'deny simple arrays'));

        Promise.all(promises).then(() => done(), done);
    });

});
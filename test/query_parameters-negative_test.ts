// cSpell: ignore Kaladin Dalinar Adolin Renarin Sylphrena Glys Wyndle Stormfather
import './setup';
import { it, describe } from "mocha"
import chai from 'chai';
import chaiHttp from 'chai-http';
import { SERVICE_1_QUERY_PARAMETERS } from './setup';
import { testFailedGET } from './template';
chai.should();

chai.use(chaiHttp)

describe('Invalid parameters for queries', () => {

    it('should deny invalid boolean', (done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?a=2.1`, 'a should be of type Boolean', 'deny floats'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?a=someString`, 'a should be of type Boolean', 'deny string'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?a={"any":"thing"}`, 'a should be of type Boolean', 'deny objects'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?a=1980-06-09`, 'a should be of type Boolean', 'deny dates'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should deny invalid Date', (done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?b=19.0001`, 'b should be of type Date', 'deny float'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?b=Anything`, 'b should be of type Date', 'deny string'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?b={"any":"thing"}`, 'b should be of type Date', 'deny objects'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?b=true`, 'b should be of type Date', 'deny boolean'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?b=1980/06/09`, 'b should be of type Date', 'deny slash formatted'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?b=10:20:30Z`, 'b should be of type Date', 'deny time part'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should deny invalid DateTime', (done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?c=19.0001`, 'c should be of type DateTime', 'deny float'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?c=Anything`, 'c should be of type DateTime', 'deny string'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?c={"any":"thing"}`, 'c should be of type DateTime', 'deny objects'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?c=true`, 'c should be of type DateTime', 'deny boolean'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?c=1980/06/09T10:20:30Z`, 'c should be of type DateTime', 'deny slash formatted'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should deny invalid number', (done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?d=False`, 'd should be of type Number', 'deny Booleans'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?d=someString`, 'd should be of type Number', 'deny string'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?d={"any":"thing"}`, 'd should be of type Number', 'deny objects'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?d=1980-06-09`, 'd should be of type Number', 'deny dates'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should deny invalid array of numbers', (done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?e=someString`, 'e should be of type NumberArray', 'deny string'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?e={"any":"thing"}`, 'e should be of type NumberArray', 'deny objects'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?e=1980-06-09`, 'e should be of type NumberArray', 'deny dates'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should deny invalid objects', (done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?f=3`, 'f should be of type Object', 'deny numbers'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?f=False`, 'f should be of type Object', 'deny Booleans'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?f=someString`, 'f should be of type Object', 'deny string'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?f=1980-06-09`, 'f should be of type Object', 'deny dates'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?f=a,b,c`, 'f should be of type Object', 'deny arrays'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should deny invalid array of objects', (done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?g=3`, 'g should be of type ObjectArray', 'deny numbers'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?g=False`, 'g should be of type ObjectArray', 'deny Booleans'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?g=someString`, 'g should be of type ObjectArray', 'deny string'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?g=1980-06-09`, 'g should be of type ObjectArray', 'deny dates'));
        promises.push(testFailedGET(`${SERVICE_1_QUERY_PARAMETERS}?g=a,b,c`, 'g should be of type ObjectArray', 'deny simple arrays'));

        Promise.all(promises).then(() => done(), done);
    });
});
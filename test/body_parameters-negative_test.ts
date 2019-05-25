// cSpell: ignore Kaladin Dalinar Adolin Renarin Sylphrena Glys Wyndle Stormfather
import chai from 'chai';
import chaiHttp from 'chai-http';
import { describe, Done, it } from 'mocha';
import { SERVICE_2_BODY_PARAMETERS } from './setup';
import { testFailedPOST } from './template';

chai.use(chaiHttp);

describe('Invalid parameters for body', () => {

    it('should deny invalid boolean', (done: Done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { a: 'invalid' }, 'a should be of type Boolean', 'deny invalid string'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { a: 2 }, 'a should be of type Boolean', 'deny numbers'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { a: { a: true } }, 'a should be of type Boolean', 'deny objects'));
        Promise.all(promises).then(() => done(), done);
    });

    it('should deny invalid Date', (done: Done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { b: 123.45 }, 'b should be of type Date', 'deny float'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { b: 'invalid' }, 'b should be of type Date', 'deny string'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { b: { b: new Date() } }, 'b should be of type Date', 'deny objects'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { b: true }, 'b should be of type Date', 'deny boolean'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { b: '1980/06/09' }, 'b should be of type Date', 'deny slash formatted'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { b: '19:00:00' }, 'b should be of type Date', 'deny time part'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should deny invalid DateTime', (done: Done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { c: 123.45 }, 'c should be of type DateTime', 'deny float'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { c: 'invalid' }, 'c should be of type DateTime', 'deny string'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { c: { b: new Date() } }, 'c should be of type DateTime', 'deny objects'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { c: true }, '\c should be of type DateTime', 'deny boolean'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { c: '1980/06/09' }, 'c should be of type DateTime', 'deny slash formatted'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { c: '19:00:00' }, 'c should be of type DateTime', 'deny time part'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should deny invalid number', (done: Done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { d: true }, 'd should be of type Number', 'deny Booleans'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { d: 'invalid' }, 'd should be of type Number', 'deny string'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { d: { d: 2 } }, 'd should be of type Number', 'deny objects'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { d: new Date() }, 'd should be of type Number', 'deny dates'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should deny invalid array of numbers', (done: Done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { e: 'invalid' }, 'e should be of type NumberArray', 'deny string'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { e: { e: [1, 2, 3] } }, 'e should be of type NumberArray', 'deny object'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { e: new Date() }, 'e should be of type NumberArray', 'deny date'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { e: ['a', 'b'] }, 'e should be of type NumberArray', 'deny array of non-numbers'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should deny invalid objects', (done: Done) => {
        const promises: Array<Promise<void>> = [];
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { f: 3 }, 'f should be of type Object', 'deny numbers'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { f: false }, 'f should be of type Object', 'deny Booleans'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { f: 'invalid' }, 'f should be of type Object', 'deny string'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { f: new Date() }, 'f should be of type Object', 'deny dates'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { f: [{ a: '2' }] }, 'f should be of type Object', 'deny arrays'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { f: '{e.g.: invalid)' }, 'f should be of type Object', 'deny false object'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should deny invalid array of objects', (done: Done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { g: 3 }, 'g should be of type ObjectArray', 'deny numbers'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { g: true }, 'g should be of type ObjectArray', 'deny Booleans'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { g: 'invalid' }, 'g should be of type ObjectArray', 'deny string'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { g: new Date() }, 'g should be of type ObjectArray', 'deny dates'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { g: [3] }, 'g should be of type ObjectArray', 'deny array of non-objects'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { g: [new Date()] },
            'g should be of type ObjectArray', 'deny arrays of dates (which is another kind of object)'));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { g: '[{e.g.: invalid)]' }, 'g should be of type ObjectArray', 'deny false ObjectArray'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should deny invalid string', (done: Done) => {
        const promises: Array<Promise<void>> = [];
        /* NOTE:
            Everything in a form is URL encoded and primary a string, thus pointless to deny.
            The tests bellow are taking only JSON payloads into consideration
        */
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { i: true }, 'i should be of type String', { description: 'deny booleans', ignoreForm: true }));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { i: 2 }, 'i should be of type String', { description: 'deny numbers', ignoreForm: true }));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { i: { d: 2 } },
            'i should be of type String', { description: 'deny objects', ignoreForm: true }));

        Promise.all(promises).then(() => done(), done);
    });

    it('should deny invalid array of strings', (done: Done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { j: 3 },
            'j should be of type StringArray', { description: 'deny numbers', ignoreForm: true }));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { j: true },
            'j should be of type StringArray', { description: 'deny booleans', ignoreForm: true }));
        promises.push(testFailedPOST(SERVICE_2_BODY_PARAMETERS, { j: [3] },
            'j should be of type StringArray', { description: 'deny array of non-strings', ignoreForm: true }));

        Promise.all(promises).then(() => done(), done);
    });
});

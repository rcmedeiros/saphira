// cSpell: ignore Kaladin Dalinar Adolin Renarin Sylphrena Glys Wyndle Stormfather
import './setup';
import { it, describe } from "mocha"
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { SERVICE_1_GET_OPTIONAL, URI } from './setup';
import { testSuccess } from './template';
chai.should();

chai.use(chaiHttp)


describe('Argument types for queries', () => {

    it('should serialize boolean', (done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?a=0`, [false, null, null, null, null, null, null, null, null, null], 'accept 0'));
        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?a=f`, [false, null, null, null, null, null, null, null, null, null], 'accept f'));
        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?a=false`, [false, null, null, null, null, null, null, null, null, null], 'accept false'));
        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?a=No`, [false, null, null, null, null, null, null, null, null, null], 'accept No'));
        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?a=n`, [false, null, null, null, null, null, null, null, null, null], 'accept n'));
        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?a=T`, [true, null, null, null, null, null, null, null, null, null], 'accept T'));
        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?a=true`, [true, null, null, null, null, null, null, null, null, null], 'accept true'));
        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?a=Y`, [true, null, null, null, null, null, null, null, null, null], 'accept Y'));
        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?a=yes`, [true, null, null, null, null, null, null, null, null, null], 'accept yes'));
        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?a=1`, [true, null, null, null, null, null, null, null, null, null], 'accept 1'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize Date', (done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?b=1980-06-09`,
            [null, '1980-06-09T00:00:00.000Z', null, null, null, null, null, null, null, null],
            'accept ISO 8601 date part'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize DateTime', (done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?c=1980-06-09T16:00Z`,
            [null, null, '1980-06-09T16:00:00.000Z', null, null, null, null, null, null, null],
            'accept ISO 8601'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize number', (done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?d=12.34`,
            [null, null, null, 12.34, null, null, null, null, null, null],
            'float'));
        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?d=13`,
            [null, null, null, 13, null, null, null, null, null, null],
            'integer'));
        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?d=-5`,
            [null, null, null, -5, null, null, null, null, null, null],
            'negative'));
        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?d=0`,
            [null, null, null, 0, null, null, null, null, null, null],
            'zero'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize array of numbers', (done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?e=0,1,2.34,-1`,
            [null, null, null, null, [0, 1, 2.34, -1], null, null, null, null, null],
            'comma separated'));
        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?e=0&e=1&e=2.34&e=-1`,
            [null, null, null, null, [0, 1, 2.34, -1], null, null, null, null, null],
            'OpenAPI default'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize objects', (done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?f[name]=Kaladin&f[age]=20`,
            [null, null, null, null, null, { name: 'Kaladin', age: "20" }, null, null, null, null],
            'OpenAPI default'));
        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?f={"name":"Kaladin","age":20,"inner":{"name":"Kaladin","age":20}}`,
            [null, null, null, null, null, { name: 'Kaladin', age: 20, inner: { name: 'Kaladin', age: 20 } }, null, null, null, null],
            'JSON stringified'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize array of objects', (done) => {

        const objects: Array<object> = [
            { name: 'Dalinar', age: 53, surgeBinding: { order: 'BondSmith', bond: 'Stormfather', surges: ['Tension', 'Adhesion'] } },
            { name: 'Adolin', age: 20, surgeBinding: undefined },
            { name: 'Renarin', age: 21, surgeBinding: { order: 'TruthWatchers', bond: 'Glys', surges: ['Progression', 'Illumination'] } }];
        const expected: unknown = [null, null, null, null, null, null, objects, null, null, null];

        const promises: Array<Promise<void>> = [];

        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?` +
            'g={"name":"Dalinar","age":53,"surgeBinding":{"order":"BondSmith","bond":"Stormfather","surges":["Tension","Adhesion"]}}&' +
            'g={"name":"Adolin","age":20}&' +
            'g={"name":"Renarin","age":21,"surgeBinding":{"order":"TruthWatchers","bond":"Glys","surges":["Progression","Illumination"]}}'
            //.replace('"', '%22').replace('{', '%7B').replace('}', '%7D')
            , expected, 'OpenAPI default'));

        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?g=${JSON.stringify(objects)}`, expected, 'JSON stringified'));
        promises.push(testSuccess(
            `${SERVICE_1_GET_OPTIONAL}?g=${JSON.stringify(objects[0])},${JSON.stringify(objects[1])},${JSON.stringify(objects[2])}`,
            expected, 'JSON stringified without []s'));


        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize strings', (done) => {

        const promises: Array<Promise<void>> = [];

        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?h=~%21%40%23%24%25%5E%26%2A%28%29_%2B%7B%7D%3A%22%3C%3E%3F%7C-%3D%5B%5D%5C%3B%27%2C.%2F&i=Sylphrena`,
            [null, null, null, null, null, null, null, '~!@#$%^&*()_+{}:"<>?|-=[]\\;\',./', 'Sylphrena', null],
            'strings and passwords'));


        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize Array of strings', (done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?j=Sylphrena&j=Pattern&j=Ivory&j=Glys&j=Wyndle&j=Stormfather`,
            [null, null, null, null, null, null, null, null, null,
                ['Sylphrena', 'Pattern', 'Ivory', 'Glys', 'Wyndle', 'Stormfather']],
            'OpenAPI default'));

        promises.push(testSuccess(`${SERVICE_1_GET_OPTIONAL}?j=Sylphrena,Pattern,Ivory,Glys,Wyndle,Stormfather`,
            [null, null, null, null, null, null, null, null, null,
                ['Sylphrena', 'Pattern', 'Ivory', 'Glys', 'Wyndle', 'Stormfather']],
            'OpenAPI default'));


        Promise.all(promises).then(() => done(), done);
    });
});
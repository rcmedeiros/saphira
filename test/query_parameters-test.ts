// cSpell: ignore Kaladin Dalinar Adolin Renarin Sylphrena Glys Wyndle Stormfather
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { HttpResponse } from 'chai-http-ext';
import { describe, Done, it } from 'mocha';
import { XPagination } from '../src/controller/x-pagination';
import { SERVICE_1_QUERY_PARAMETERS, SERVICE_3_PAGED_LIST } from './setup';
import { testSuccessfulGET } from './template';

chai.use(chaiHttp);

describe('Parameter types for queries', () => {

    it('should serialize boolean', (done: Done) => {
        const promises: Array<Promise<HttpResponse>> = [];

        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS}?a=0`, [false, null, null, null, null, null, null, null, null, null], 'accept 0'));
        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS}?a=f`, [false, null, null, null, null, null, null, null, null, null], 'accept f'));
        promises.push(
            testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS}?a=false`, [false, null, null, null, null, null, null, null, null, null], 'accept false'));
        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS}?a=No`, [false, null, null, null, null, null, null, null, null, null], 'accept No'));
        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS}?a=n`, [false, null, null, null, null, null, null, null, null, null], 'accept n'));
        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS}?a=T`, [true, null, null, null, null, null, null, null, null, null], 'accept T'));
        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS}?a=true`, [true, null, null, null, null, null, null, null, null, null], 'accept true'));
        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS}?a=Y`, [true, null, null, null, null, null, null, null, null, null], 'accept Y'));
        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS}?a=yes`, [true, null, null, null, null, null, null, null, null, null], 'accept yes'));
        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS}?a=1`, [true, null, null, null, null, null, null, null, null, null], 'accept 1'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize Date', (done: Done) => {
        const promises: Array<Promise<HttpResponse>> = [];

        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS}?b=1980-06-09`,
            [null, '1980-06-09T00:00:00.000Z', null, null, null, null, null, null, null, null],
            'accept ISO 8601 date part'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize DateTime', (done: Done) => {
        const promises: Array<Promise<HttpResponse>> = [];

        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS}?c=1980-06-09T16:00Z`,
            [null, null, '1980-06-09T16:00:00.000Z', null, null, null, null, null, null, null],
            'accept ISO 8601'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize number', (done: Done) => {
        const promises: Array<Promise<HttpResponse>> = [];

        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS}?d=${Math.PI}`,
            [null, null, null, Math.PI, null, null, null, null, null, null],
            'float'));
        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS}?d=${encodeURIComponent(Number.MAX_VALUE.toString())}`,
            [null, null, null, Number.MAX_VALUE, null, null, null, null, null, null],
            'integer'));
        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS}?d=${encodeURIComponent(Number.MIN_VALUE.toString())}`,
            [null, null, null, Number.MIN_VALUE, null, null, null, null, null, null],
            'negative'));
        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS}?d=0`,
            [null, null, null, 0, null, null, null, null, null, null],
            'zero'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize array of numbers', (done: Done) => {
        const promises: Array<Promise<HttpResponse>> = [];

        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS}?e=0,1,2.34,-1`,
            [null, null, null, null, [0, 1, 2.34, -1], null, null, null, null, null],
            'comma separated'));
        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS}?e=0&e=1&e=2.34&e=-1`,
            [null, null, null, null, [0, 1, 2.34, -1], null, null, null, null, null],
            'OpenAPI default'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize objects', (done: Done) => {
        const promises: Array<Promise<HttpResponse>> = [];

        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS}?f[name]=Kaladin&f[age]=20`,
            [null, null, null, null, null, { name: 'Kaladin', age: '20' }, null, null, null, null],
            'OpenAPI default'));
        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS
            }?f={"name":"Kaladin","age":20,"surgeBinding":{"order":"WindRunner","bond":"Sylphrena", "surges": ["Adhesion", "Gravitation"]}}`,
            [null, null, null, null, null,
                { name: 'Kaladin', age: 20, surgeBinding: { order: 'WindRunner', bond: 'Sylphrena', surges: ['Adhesion', 'Gravitation'] } },
                null, null, null, null], 'JSON stringified'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize array of objects', (done: Done) => {

        const objects: Array<object> = [
            { name: 'Dalinar', age: 53, surgeBinding: { order: 'BondSmith', bond: 'Stormfather', surges: ['Tension', 'Adhesion'] } },
            { name: 'Adolin', age: 20, surgeBinding: undefined },
            { name: 'Renarin', age: 21, surgeBinding: { order: 'TruthWatchers', bond: 'Glys', surges: ['Progression', 'Illumination'] } }];
        const expected: unknown = [null, null, null, null, null, null, objects, null, null, null];

        const promises: Array<Promise<HttpResponse>> = [];

        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS}?` +
            'g={"name":"Dalinar","age":53,"surgeBinding":{"order":"BondSmith","bond":"Stormfather","surges":["Tension","Adhesion"]}}&' +
            'g={"name":"Adolin","age":20}&' +
            'g={"name":"Renarin","age":21,"surgeBinding":{"order":"TruthWatchers","bond":"Glys","surges":["Progression","Illumination"]}}'
            // .safeReplace('"', '%22').safeReplace('{', '%7B').safeReplace('}', '%7D')
            , expected, 'OpenAPI default'));

        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS}?g=${JSON.stringify(objects)}`, expected, 'JSON stringified'));
        promises.push(testSuccessfulGET(
            `${SERVICE_1_QUERY_PARAMETERS}?g=${JSON.stringify(objects[0])},${JSON.stringify(objects[1])},${JSON.stringify(objects[2])}`,
            expected, 'JSON stringified without []s'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize strings', (done: Done) => {

        const promises: Array<Promise<HttpResponse>> = [];

        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS
            }?h=~%21%40%23%24%25%5E%26%2A%28%29_%2B%7B%7D%3A%22%3C%3E%3F%7C-%3D%5B%5D%5C%3B%27%2C.%2F&i=Sylphrena`,
            [null, null, null, null, null, null, null, '~!@#$%^&*()_+{}:"<>?|-=[]\\;\',./', 'Sylphrena', null],
            'strings and passwords'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize Array of strings', (done: Done) => {
        const promises: Array<Promise<HttpResponse>> = [];

        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS}?j=Sylphrena&j=Pattern&j=Ivory&j=Glys&j=Wyndle&j=Stormfather`,
            [null, null, null, null, null, null, null, null, null,
                ['Sylphrena', 'Pattern', 'Ivory', 'Glys', 'Wyndle', 'Stormfather']],
            'OpenAPI default'));

        promises.push(testSuccessfulGET(`${SERVICE_1_QUERY_PARAMETERS}?j=Sylphrena,Pattern,Ivory,Glys,Wyndle,Stormfather`,
            [null, null, null, null, null, null, null, null, null,
                ['Sylphrena', 'Pattern', 'Ivory', 'Glys', 'Wyndle', 'Stormfather']],
            'OpenAPI default'));

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
});

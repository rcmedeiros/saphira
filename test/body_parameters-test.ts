// cSpell: ignore Kaladin Dalinar Adolin Renarin Sylphrena Glys Wyndle Stormfather
import { HttpResponse } from 'chai-http-ext';
import { describe, Done, it } from 'mocha';
import { SERVICE_2_BODY_PARAMETERS } from './setup';
import { SamplePayload, testSuccessfulPOST } from './template';

describe('Parameter types for body', () => {

    it('should serialize boolean', (done: Done) => {
        const promises: Array<Promise<Array<HttpResponse>>> = [];
        const sample1: SamplePayload = { a: true };
        const sample2: SamplePayload = { a: false };
        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, sample1, sample1, 'boolean true'));
        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, sample2, sample2, 'boolean false'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize Date', (done: Done) => {
        const promises: Array<Promise<Array<HttpResponse>>> = [];

        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, { b: new Date(Date.UTC(1980, 5, 9)) },
            { b: '1980-06-09T00:00:00.000Z' }, 'Date as object'));
        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, { b: new Date(Date.UTC(1980, 5, 9)).getTime() },
            { b: '1980-06-09T00:00:00.000Z' }, 'Date as object'));
        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, { b: '1980-06-09T00:00Z' }, { b: '1980-06-09T00:00:00.000Z' }, 'Date as string'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize DateTime', (done: Done) => {
        const promises: Array<Promise<Array<HttpResponse>>> = [];

        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, { c: new Date(Date.UTC(1980, 5, 9, 19)) },
            { c: '1980-06-09T19:00:00.000Z' }, 'Date as object'));
        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, { c: '1980-06-09T19:00Z' }, { c: '1980-06-09T19:00:00.000Z' }, 'Date as string'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize number', (done: Done) => {
        const promises: Array<Promise<Array<HttpResponse>>> = [];

        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, { d: Math.PI }, { d: Math.PI }, 'Float'));
        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, { d: Number.MAX_VALUE }, { d: Number.MAX_VALUE }, 'Integer'));
        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, { d: Number.MIN_VALUE }, { d: Number.MIN_VALUE }, 'Negative'));
        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, { d: 0 }, { d: 0 }, 'Zero'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize array of numbers', (done: Done) => {
        const promises: Array<Promise<Array<HttpResponse>>> = [];
        const sample1: SamplePayload = { e: [-1, 0, 1] };
        const sample2: SamplePayload = { e: [Number.MIN_VALUE, 0, Math.PI, Number.MAX_VALUE] };
        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, sample1, sample1));
        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, sample2, sample2));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize objects', (done: Done) => {
        const promises: Array<Promise<Array<HttpResponse>>> = [];
        const sample: SamplePayload = {
            f:
                { name: 'Kaladin', age: 20, surgeBinding: { order: 'WindRunner', bond: 'Sylphrena', surges: ['Adhesion', 'Gravitation'] } },
        };

        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, sample, sample));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize array of objects', (done: Done) => {

        const sample: SamplePayload = {
            g: [
                {
                    name: 'Dalinar', age: 53, surgeBinding:
                        { order: 'BondSmith', bond: 'Stormfather', surges: ['Tension', 'Adhesion'] },
                },
                { name: 'Adolin', age: 20, surgeBinding: undefined },
                {
                    name: 'Renarin', age: 21, surgeBinding:
                        { order: 'TruthWatchers', bond: 'Glys', surges: ['Progression', 'Illumination'] },
                }],
        };

        const promises: Array<Promise<Array<HttpResponse>>> = [];

        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, sample, sample));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize strings and passwords', (done: Done) => {

        const promises: Array<Promise<Array<HttpResponse>>> = [];

        const sample: SamplePayload = {
            h: '~!@#$%^&*()_+{}:"<>?|-=[]\\;\',./',
            i: 'Sylphrena',
        };

        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, sample, sample));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize Array of strings', (done: Done) => {
        const promises: Array<Promise<Array<HttpResponse>>> = [];

        const sample: SamplePayload = {
            j: ['Sylphrena', 'Pattern', 'Ivory', 'Glys', 'Wyndle', 'Stormfather'],
        };

        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, sample, sample));

        Promise.all(promises).then(() => done(), done);
    });

    it('All parameters at once', (done: Done) => {
        const promises: Array<Promise<Array<HttpResponse>>> = [];

        const sample: SamplePayload = {
            a: true,
            b: '1980-06-09T00:00:00.000Z',
            c: '1980-06-09T19:00:00.000Z',
            d: Math.PI,
            e: [-1, 0, 1],
            f:
                { name: 'Kaladin', age: 20, surgeBinding: { order: 'WindRunner', bond: 'Sylphrena', surges: ['Adhesion', 'Gravitation'] } },
            g: [
                {
                    name: 'Dalinar', age: 53, surgeBinding:
                        { order: 'BondSmith', bond: 'Stormfather', surges: ['Tension', 'Adhesion'] },
                },
                { name: 'Adolin', age: 20, surgeBinding: undefined },
                {
                    name: 'Renarin', age: 21, surgeBinding:
                        { order: 'TruthWatchers', bond: 'Glys', surges: ['Progression', 'Illumination'] },
                }],
            h: '~!@#$%^&*()_+{}:"<>?|-=[]\\;\',./',
            i: 'Sylphrena',
            j: ['Sylphrena', 'Pattern', 'Ivory', 'Glys', 'Wyndle', 'Stormfather'],
        };

        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, sample, sample));

        Promise.all(promises).then(() => done(), done);
    });

});

// cSpell: ignore Kaladin Dalinar Adolin Renarin Sylphrena Glys Wyndle Stormfather
import './setup';
import { it, describe } from "mocha"
import chai from 'chai';
import { SERVICE_2_BODY_PARAMETERS } from './setup';
import { testSuccessfulPOST, SamplePayload, testFailedPOST } from './template';


describe('Parameter types for body', () => {

    it('should serialize boolean', (done) => {
        const promises: Array<Promise<void>> = [];
        const sample1: SamplePayload = { a: true };
        const sample2: SamplePayload = { a: false };
        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, sample1, sample1, 'boolean true'));
        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, sample2, sample2, 'boolean false'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize Date', (done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, { b: new Date(Date.UTC(1980, 5, 9)) }, { b: '1980-06-09T00:00:00.000Z' }, 'Date as object'));
        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, { b: new Date(Date.UTC(1980, 5, 9)).getTime() }, { b: '1980-06-09T00:00:00.000Z' }, 'Date as object'));
        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, { b: '1980-06-09T00:00Z' }, { b: '1980-06-09T00:00:00.000Z' }, 'Date as string'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize DateTime', (done) => {
        const promises: Array<Promise<void>> = [];

        const sample2: SamplePayload = { b: '1980-06-09' };
        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, { c: new Date(Date.UTC(1980, 5, 9, 19)) }, { c: '1980-06-09T19:00:00.000Z' }, 'Date as object'));
        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, { c: '1980-06-09T19:00Z' }, { c: '1980-06-09T19:00:00.000Z' }, 'Date as string'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize number', (done) => {
        const promises: Array<Promise<void>> = [];

        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, { d: Math.PI }, { d: Math.PI }, 'Float'));
        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, { d: Number.MAX_VALUE }, { d: Number.MAX_VALUE }, 'Integer'));
        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, { d: Number.MIN_VALUE }, { d: Number.MIN_VALUE }, 'Negative'));
        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, { d: 0 }, { d: 0 }, 'Zero'));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize array of numbers', (done) => {
        const promises: Array<Promise<void>> = [];
        const sample1: SamplePayload = { e: [-1, 0, 1] };
        const sample2: SamplePayload = { e: [Number.MIN_VALUE, 0, Math.PI, Number.MAX_VALUE] };
        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, sample1, sample1));
        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, sample2, sample2));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize objects', (done) => {
        const promises: Array<Promise<void>> = [];
        const sample: SamplePayload = {
            f:
                { name: 'Kaladin', age: 20, surgeBinding: { order: 'WindRunner', bond: 'Sylphrena', surges: ['Adhesion', 'Gravitation'] } }
        }

        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, sample, sample));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize array of objects', (done) => {

        const sample: SamplePayload = {
            g: [
                {
                    name: 'Dalinar', age: 53, surgeBinding:
                        { order: 'BondSmith', bond: 'Stormfather', surges: ['Tension', 'Adhesion'] }
                },
                { name: 'Adolin', age: 20, surgeBinding: undefined },
                {
                    name: 'Renarin', age: 21, surgeBinding:
                        { order: 'TruthWatchers', bond: 'Glys', surges: ['Progression', 'Illumination'] }
                }]
        };

        const promises: Array<Promise<void>> = [];

        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, sample, sample));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize strings and passwords', (done) => {

        const promises: Array<Promise<void>> = [];

        const sample: SamplePayload = {
            h: '~!@#$%^&*()_+{}:"<>?|-=[]\\;\',./',
            i: 'Sylphrena',
        }

        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, sample, sample));

        Promise.all(promises).then(() => done(), done);
    });

    it('should serialize Array of strings', (done) => {
        const promises: Array<Promise<void>> = [];

        const sample: SamplePayload = {
            j: ["Sylphrena", "Pattern", "Ivory", "Glys", "Wyndle", "Stormfather"]
        }

        promises.push(testSuccessfulPOST(SERVICE_2_BODY_PARAMETERS, sample, sample));


        Promise.all(promises).then(() => done(), done);
    });
});
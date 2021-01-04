import '@rcmedeiros/prototypes';

import { Done, describe, it } from 'mocha';
import { LOCALHOST, RESOURCE_FILE, mockServers } from './mocks/http_servers';

import { Resource } from '../src/adapter/resource';
import { expect } from 'chai';
import fs from 'fs';

describe('Resource', () => {
    const text: string = fs.readFileSync(RESOURCE_FILE).toString();

    it('Should load from file', (done: Done) => {
        new Resource(RESOURCE_FILE).get().then((s: string) => {
            expect(s).to.be.equal(text);
            done();
        });
    });
    it('Should load from URL', (done: Done) => {
        new Resource(`${LOCALHOST}:${mockServers.resourceText.port}/text`).get().then((s: string) => {
            expect(s).to.be.equal(text);
            done();
        });
    });
    it('undefined resource should return undefined', (done: Done) => {
        new Resource(undefined).get().then((s: string) => {
            expect(s).to.be.undefined;
            done();
        });
    });
});

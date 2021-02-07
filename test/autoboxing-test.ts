// cSpell:ignore soapenv tecnologia seguranca detran usuario senha
import { Done, after, before, describe, it } from 'mocha';
import { HttpStatusCode, Saphira } from '../src';
import {
    SERVICE_AUTOBOXING_OBJECT,
    SERVICE_AUTOBOXING_OBJECT_ARRAY,
    ServiceAutoboxing,
} from './mocks/sample_server/service_autoboxing';
import chai, { expect } from 'chai';

import { HelloWorld } from './mocks/sample_server/hello_world-dto';
import chaiHttp from 'chai-http';
import request from 'superagent';

chai.use(chaiHttp);

describe('Autoboxing test', () => {
    const SERVER_PORT: number = 3546;
    const server: Saphira = new Saphira([ServiceAutoboxing], { port: SERVER_PORT });

    before((done: Done) => {
        server.listen().then(() => {
            done();
        }, done);
    });

    after((done: Done) => {
        server.close().then(() => {
            done();
        }, done);
    });

    const worlds: Array<HelloWorld> = [
        { hello: 'Heill', world: 'jörð' },
        { hello: 'Halló', world: 'Heimur' },
        { hello: 'Hej', world: 'Världen' },
    ];

    it('Should autobox when posting objet', (done: Done) => {
        chai.request(`http://127.0.0.1:${SERVER_PORT}`)
            .post(SERVICE_AUTOBOXING_OBJECT)
            .send(worlds[0])
            .end(async (err: Error, res: request.Response) => {
                expect(res.status).to.be.equal(HttpStatusCode.OK);
                expect((res.body as HelloWorld).hello).to.be.equal(worlds[0].hello);
                expect((res.body as HelloWorld).world).to.be.equal(worlds[0].world);
                done(err);
            });
    });

    it('Should autobox when getting objet', (done: Done) => {
        chai.request(`http://127.0.0.1:${SERVER_PORT}`)
            .get(`${SERVICE_AUTOBOXING_OBJECT}?greeting=${JSON.stringify(worlds[0])}`)
            .end(async (err: Error, res: request.Response) => {
                expect(res.status).to.be.equal(HttpStatusCode.OK);
                expect((res.body as HelloWorld).hello).to.be.equal(worlds[0].hello);
                expect((res.body as HelloWorld).world).to.be.equal(worlds[0].world);
                done(err);
            });
    });

    it('Should autobox when posting an array of objects', (done: Done) => {
        chai.request(`http://127.0.0.1:${SERVER_PORT}`)
            .post(SERVICE_AUTOBOXING_OBJECT_ARRAY)
            .send(worlds)
            .end(async (err: Error, res: request.Response) => {
                expect(res.status).to.be.equal(HttpStatusCode.OK);
                res.body.forEach((hw: HelloWorld, i: number) => {
                    expect(hw.hello).to.be.equal(worlds[i].hello);
                    expect(hw.world).to.be.equal(worlds[i].world);
                });
                done(err);
            });
    });

    it('Should autobox when posting an array of objects', (done: Done) => {
        chai.request(`http://127.0.0.1:${SERVER_PORT}`)
            .get(`${SERVICE_AUTOBOXING_OBJECT_ARRAY}?greetings=${JSON.stringify(worlds)}`)
            .end(async (err: Error, res: request.Response) => {
                expect(res.status).to.be.equal(HttpStatusCode.OK);
                res.body.forEach((hw: HelloWorld, i: number) => {
                    expect(hw.hello).to.be.equal(worlds[i].hello);
                    expect(hw.world).to.be.equal(worlds[i].world);
                });
                done(err);
            });
    });
});

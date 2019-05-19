// cSpell: ignore Kaladin Dalinar Adolin Renarin Sylphrena Glys Wyndle Stormfather
import './setup';
import { it, describe } from "mocha"
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { URI } from './setup';
chai.should();

chai.use(chaiHttp)


describe('Argument Types for queries', () => {

    it('should serialize boolean', (done) => {
        chai.request(URI).get('/api/Service1/getOptional?a=true').end((err, res) => {
            if (!err) {
                expect(res.body.toString()).to.be.equal([
                    [true, null, null, null, null, null, null, null, null, null]
                ].toString());
            };
            chai.request(URI).get('/api/Service1/getOptional?a=1').end((err, res) => {
                if (!err) {
                    expect(res.body.toString()).to.be.equal([
                        [true, null, null, null, null, null, null, null, null, null]
                    ].toString());
                };
                chai.request(URI).get('/api/Service1/getOptional?a=false').end((err, res) => {
                    if (!err) {
                        expect(res.body.toString()).to.be.equal([
                            [false, null, null, null, null, null, null, null, null, null]
                        ].toString());
                    };
                    chai.request(URI).get('/api/Service1/getOptional?a=0').end((err, res) => {
                        if (!err) {
                            expect(res.body.toString()).to.be.equal([
                                [false, null, null, null, null, null, null, null, null, null]
                            ].toString());
                        };
                        done(err);
                    });
                });
            });
        });
    });
    it('should serialize Date', (done) => {
        chai.request(URI).get('/api/Service1/getOptional?b=1980-06-09').end((err, res) => {
            if (!err) {
                expect(res.body.toString()).to.be.equal([
                    [null, '1980-06-09T00:00:00.000Z', null, null, null, null, null, null, null, null]
                ].toString());
            };
            done(err);
        });
    });
    it('should serialize DateTime', (done) => {
        chai.request(URI).get('/api/Service1/getOptional?c=1980-06-09T16:00Z').end((err, res) => {
            if (!err) {
                expect(res.body.toString()).to.be.equal([
                    [null, null, '1980-06-09T16:00:00.000Z', null, null, null, null, null, null, null]
                ].toString());
            };
            done(err);
        });
    });
    it('should serialize number', (done) => {
        chai.request(URI).get('/api/Service1/getOptional?d=12.34').end((err, res) => {
            if (!err) {
                expect(res.body.toString()).to.be.equal([
                    [null, null, null, 12.34, null, null, null, null, null, null]
                ].toString());
            };
            done(err);
        });
    });
    it('should serialize array of numbers', (done) => {
        chai.request(URI).get('/api/Service1/getOptional?e=0,1,2.34,-1').end((err, res) => {
            if (!err) {
                expect(res.body.toString()).to.be.equal([
                    [null, null, null, null, [0, 1, 2.34, -1], null, null, null, null, null]
                ].toString());
            };
            chai.request(URI).get('/api/Service1/getOptional?e=0&e=1&e=2.34&e=-1').end((err, res) => {
                if (!err) {
                    expect(res.body.toString()).to.be.equal([
                        [null, null, null, null, [0, 1, 2.34, -1], null, null, null, null, null]
                    ].toString());
                };
                done(err);
            });
        });
    });
    it('should serialize objects', (done) => {
        chai.request(URI).get('/api/Service1/getOptional?f[name]=Kaladin&f[age]=20').end((err, res) => {
            if (!err) {
                expect(res.body.toString()).to.be.equal([
                    [null, null, null, null, null, { name: 'Kaladin', age: 20 }, null, null, null, null]
                ].toString());
            };
            chai.request(URI).get('/api/Service1/getOptional?f={"name":"Kaladin","age":20,"inner":{"name":"Kaladin","age":20}}').end((err, res) => {
                if (!err) {
                    expect(res.body.toString()).to.be.equal([
                        [null, null, null, null, null, { name: 'Kaladin', age: 20, inner: { name: 'Kaladin', age: 20 } }, null, null, null, null]
                    ].toString());
                };
                done(err);
            });
        });
    });
    it('should serialize array of objects', (done) => {

        const objects: Array<object> = [{ name: 'Dalinar', age: 53, inner: { name: 'Dalinar', age: 53 } },
        { name: 'Adolin', age: 25, inner: { name: 'Adolin', age: 25 } },
        { name: 'Renarin', age: 21, inner: { name: 'Renarin', age: 21 } }];
        const stringResult: string = JSON.stringify(
            [null, null, null, null, null, null, objects, null, null, null]);

        chai.request(URI).get('/api/Service1/getOptional?' +
            'g=%7B%20%22name%22:%20%22Dalinar%22,%20%22age%22:%2053,%20%22inner%22:%7B%20%22name%22:%20%22Dalinar%22,%20%22age%22:%2053%20%7D%20%7D&' +
            'g=%7B%20%22name%22:%20%22Adolin%22,%20%22age%22:%2025,%20%22inner%22:%7B%20%22name%22:%20%22Adolin%22,%20%22age%22:%2025%20%7D%20%7D&' +
            'g=%7B%20%22name%22:%20%22Renarin%22,%20%22age%22:%2021,%20%22inner%22:%7B%20%22name%22:%20%22Renarin%22,%20%22age%22:%2021%20%7D%20%7D'
        ).end((err, res) => {
            if (!err) {
                expect(JSON.stringify(res.body)).to.be.equal(stringResult);
            };
            const easyQuery: string = '/api/Service1/getOptional?g=' + JSON.stringify(objects);
            chai.request(URI).get(easyQuery).end((err, res) => {
                if (!err) {
                    expect(JSON.stringify(res.body)).to.be.equal(stringResult);
                };
                chai.request(URI).get(easyQuery.safeReplace('[', '').safeReplace(']', '')).end((err, res) => {
                    if (!err) {
                        expect(JSON.stringify(res.body)).to.be.equal(stringResult);
                    };
                    done(err);
                });
            });
        });
    });
    it('should serialize strings', (done) => {
        chai.request(URI).get('/api/Service1/getOptional?h=abc123&i=Sylphrena').end((err, res) => {
            if (!err) {
                expect(res.body.toString()).to.be.equal([
                    [null, null, null, null, null, null, null, 'abc123', 'Sylphrena', null]
                ].toString());
                done(err);
            };
        });
    });
    it('should serialize Array of strings', (done) => {
        chai.request(URI).get('/api/Service1/getOptional?j=Sylphrena,Pattern,Ivory,Glys,Wyndle,Stormfather').end((err, res) => {
            if (!err) {
                expect(res.body.toString()).to.be.equal([
                    [null, null, null, null, null, null, null, null, null,
                        ['Sylphrena', 'Pattern', 'Ivory', 'Glys', 'Wyndle', 'Stormfather']]
                ].toString());
                done(err);
            };
        });
    });

});
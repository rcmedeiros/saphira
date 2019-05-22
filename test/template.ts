
import chai, { expect } from 'chai';
import { URI } from './setup';



export function testSuccess(endpoint: string, expected: unknown, description?: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        chai.request(URI).get(endpoint).end((err, res) => {
            if (err) { reject(err) } else {
                try {
                    expect(res.status).to.be.equal(200);
                    expect(JSON.stringify(res.body), description).to.be.equal(JSON.stringify(expected));
                    resolve()
                } catch (e) {
                    reject(e);
                }
            }
        })
    })
}
export function testFailure(endpoint: string, errorMessage: string, description?: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        chai.request(URI).get(endpoint).end((err, res) => {
            if (err) { reject(err) } else {
                try {
                    expect(res.status, description).to.be.equal(400);
                    expect(res.body.message, description).to.be.equal(errorMessage);
                    resolve()
                } catch (e) {
                    reject(e);
                }
            }
        })
    })
}
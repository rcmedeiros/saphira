import '@rcmedeiros/prototypes';

import { Commitment, Resolution } from '../src/commitment';
import { Done, describe, it } from 'mocha';

import { Rejection } from '../src';
import { expect } from 'chai';

describe('Commitment', () => {
    it('Should present its correct tag', () => {
        const c: Commitment<void> = new Commitment(1, (resolve: Resolution<void>): void => resolve());
        expect(c.toString()).to.be.equal('[object Commitment]');
    });

    it('Should behave as a regular promise in case of negative retry setting', (done: Done) => {
        new Commitment(-1, (resolve: Resolution<void>): void => {
            resolve();
        })
            .then(() => {
                expect(true).to.be.true;
                done();
            })
            .catch(() => {
                expect(false, 'should never fail').to.be.true;
            });
    });

    it('Should behave as a regular promise in case of success', (done: Done) => {
        new Commitment(0, (resolve: Resolution<void>): void => {
            resolve();
        })
            .then(() => {
                expect(true).to.be.true;
                done();
            })
            .catch(() => {
                expect(false, 'should never fail').to.be.true;
            });
    });

    it('Should behave as a regular promise in case of success after retries', (done: Done) => {
        const failUntil: number = Number().pseudoRandom(3, 13);
        let touches: number = 0;

        new Commitment(100, (resolve: Resolution<void>, reject: Rejection): void => {
            touches++;
            if (touches === failUntil) {
                resolve();
            } else {
                reject(new Error());
            }
        })
            .then(() => {
                expect(touches).to.be.equal(failUntil);
                done();
            })
            .catch(() => {
                expect(false, 'should never fail').to.be.true;
            });
    });

    it('Should give up retrying after known unsolvable errors', (done: Done) => {
        let r: number;
        let s: number;
        new Commitment(
            {
                times: 100000,
                waitTime: 0,
                exceptWhen: ['Ace of Spades'],
            },
            (_resolve: Resolution<void>, reject: Rejection): void => {
                r = Number().pseudoRandom(11, 14);
                let rank: string;
                s = Number().pseudoRandom(0, 3);
                let suit: string;
                const color: string = Math.round(Math.random()) === 0 ? 'Black' : 'Red';
                switch (s) {
                    case 0:
                        suit = 'Hearts';
                        break;
                    case 1:
                        suit = 'Spades';
                        break;
                    case 2:
                        suit = 'Clubs';
                        break;
                    default:
                        suit = 'Diamonds';
                }
                switch (r) {
                    case 11:
                        rank = 'Jack';
                        break;
                    case 12:
                        rank = 'Queen';
                        break;
                    case 13:
                        rank = 'King';
                        break;
                    default:
                        rank = 'Ace';
                }

                reject(new Error(`Card is ${color} ${rank} of ${suit}`));
            },
        )
            .finally(() => {
                expect(r).to.be.equal(14);
                expect(s).to.be.equal(1);
            })
            .catch((err: Error) => {
                expect(err.message.endsWith('Ace of Spades')).to.be.true;
                done();
            });
    });

    it('Should give up retrying after the predetermined number of times', (done: Done) => {
        const failUntil: number = Number().pseudoRandom(15, 20);
        let touches: number = 0;
        let failed: boolean = false;
        new Commitment({ times: 10, waitTime: 0 }, (resolve: Resolution<void>, reject: Rejection): void => {
            touches++;
            if (touches === failUntil) {
                resolve();
            } else {
                reject(new Error());
            }
        }).catch(() => {
            failed = true;
            expect(touches).to.be.lessThan(failUntil);
            expect(failed).to.be.true;
            done();
        });
    });

    it('Should always prepare before retrying', (done: Done) => {
        const failUntil: number = Number().pseudoRandom(30, 50);
        let touches: number = 0;
        let failures: number = 0;

        new Commitment(
            100,
            (resolve: Resolution<void>, reject: Rejection): void => {
                touches++;
                if (touches === failUntil) {
                    resolve();
                } else {
                    reject(new Error(`Reason ${touches}`));
                }
            },
            (reason: Error, attempt: number): Promise<void> => {
                expect(reason.message).to.be.equal(`Reason ${touches}`);
                expect(attempt).to.be.equal(touches);
                failures++;
                return Promise.resolve();
            },
        )
            .then(() => {
                expect(touches).to.be.equal(failUntil);
                expect(failures).to.be.equal(touches - 1);
                done();
            })
            .catch(() => {
                expect(false, 'should never fail').to.be.true;
            });
    });

    it('Should give up if preparation fails, without reason', (done: Done) => {
        const failUntil: number = Number().pseudoRandom(30, 50);
        let touches: number = 0;
        let failures: number = 0;

        new Commitment(
            100,
            (resolve: Resolution<void>, reject: Rejection): void => {
                touches++;
                if (touches === failUntil) {
                    resolve();
                } else {
                    reject(new Error(`Reason ${touches}`));
                }
            },
            (reason: Error, attempt: number): Promise<void> => {
                expect(reason.message).to.be.equal(`Reason ${touches}`);
                expect(attempt).to.be.equal(touches);
                failures++;
                if (touches <= failUntil / 2) {
                    return Promise.resolve();
                } else {
                    // eslint-disable-next-line prefer-promise-reject-errors
                    return Promise.reject();
                }
            },
        )
            .then(() => {
                expect(true, 'should never succeed').to.be.false;
            })
            .catch((err: Error) => {
                expect(err.message).to.satisfy((msg: string) =>
                    msg.startsWith('Unable to meet preconditions to retry'),
                );
                expect(touches).to.be.equal(Math.floor(failUntil / 2) + 1);
                expect(failures).to.be.equal(touches);
                done();
            });
    });

    it('Should give up if preparation fails, wrapping the reason', (done: Done) => {
        const failUntil: number = Number().pseudoRandom(30, 50);
        let touches: number = 0;
        let failures: number = 0;
        const original: Error = new Error('Unable to rollback');

        new Commitment(
            100,
            (resolve: Resolution<void>, reject: Rejection): void => {
                touches++;
                if (touches === failUntil) {
                    resolve();
                } else {
                    reject(new Error(`Reason ${touches}`));
                }
            },
            (reason: Error, attempt: number): Promise<void> => {
                expect(reason.message).to.be.equal(`Reason ${touches}`);
                expect(attempt).to.be.equal(touches);
                failures++;
                if (touches <= failUntil / 2) {
                    return Promise.resolve();
                } else {
                    return Promise.reject(original);
                }
            },
        )
            .then(() => {
                expect(true, 'should never succeed').to.be.false;
            })
            .catch((err: Error) => {
                expect(err.message).to.be.equal(`Unable to meet preconditions to retry: ${original.message}`);
                expect(err.stack.indexOf(original.stack)).to.be.at.greaterThan(0);
                expect(touches).to.be.equal(Math.floor(failUntil / 2) + 1);
                expect(failures).to.be.equal(touches);
                done();
            });
    });

    it('Should be chainable', (done: Done) => {
        const secondFailUntil: number = 3;
        let secondTouches: number = 0;
        let secondFailures: number = 0;
        let fourthTouches: number = 0;
        const sixthFailUntil: number = 6;
        let sixthTouches: number = 0;
        let sixthFailures: number = 0;
        let finallyRun: boolean = false;

        // 1) ---------------------------------------------------------- //
        new Promise((resolve: Resolution<string>): void => {
            resolve('First');
        })
            .then((r: string) => {
                // 2) ---------------------------------------------------------- //
                expect(r).to.be.equal('First');
                return new Commitment(
                    100,
                    (resolve: Resolution<string>, reject: Rejection): void => {
                        secondTouches++;
                        if (secondTouches === secondFailUntil) {
                            resolve('Second');
                        } else {
                            reject(new Error(`Reason ${secondTouches}`));
                        }
                    },
                    (reason: Error, attempt: number): Promise<void> => {
                        expect(reason.message).to.be.equal(`Reason ${secondTouches}`);
                        expect(attempt).to.be.equal(secondTouches);
                        secondFailures++;
                        return Promise.resolve();
                    },
                );
                // 3) ---------------------------------------------------------- //
            })
            .then((r: string) => {
                expect(r).to.be.equal('Second');
                return new Promise((resolve: Resolution<string>): void => {
                    resolve('Third');
                });
                // 4) ---------------------------------------------------------- //
            })
            .then((r: string) => {
                expect(r).to.be.equal('Third');
                return new Commitment(100, (resolve: Resolution<string>, reject: Rejection): void => {
                    if (fourthTouches++ > 3) {
                        resolve('Fourth');
                    } else {
                        reject(new Error());
                    }
                });
                // 5) ---------------------------------------------------------- //
            })
            .then((r: string) => {
                expect(r).to.be.equal('Fourth');
                return new Promise((resolve: Resolution<string>): void => {
                    resolve('Firth');
                });
                // 6) ---------------------------------------------------------- //
            })
            .then((r: string) => {
                expect(r).to.be.equal('Firth');
                return new Commitment(
                    100,
                    (resolve: Resolution<string>, reject: Rejection): void => {
                        sixthTouches++;
                        if (sixthTouches === sixthFailUntil) {
                            resolve('Sixth');
                        } else {
                            reject(new Error(`Reason ${sixthTouches}`));
                        }
                    },
                    (reason: Error, attempt: number): Promise<void> => {
                        expect(reason.message).to.be.equal(`Reason ${sixthTouches}`);
                        expect(attempt).to.be.equal(sixthTouches);
                        sixthFailures++;
                        if (sixthTouches <= sixthFailUntil / 2) {
                            return Promise.resolve();
                        } else {
                            // eslint-disable-next-line prefer-promise-reject-errors
                            return Promise.reject();
                        }
                    },
                );
                // 7) ---------------------------------------------------------- //
            })
            .then(
                () =>
                    new Promise((resolve: Resolution<void>): void => {
                        resolve();
                    }),
            )
            .finally(() => {
                finallyRun = true;
            })
            .catch((err: Error) => {
                expect(finallyRun).to.be.true;

                expect(secondTouches).to.be.equal(secondFailUntil);
                expect(secondFailures).to.be.equal(secondTouches - 1);

                expect(fourthTouches).to.be.equal(5);

                expect(err.message).to.be.equal('Unable to meet preconditions to retry');
                expect(sixthTouches).to.be.equal(Math.floor(sixthFailUntil / 2) + 1);
                expect(sixthFailures).to.be.equal(sixthTouches);

                done();
            });
    });
});

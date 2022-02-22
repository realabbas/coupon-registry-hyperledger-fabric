/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/
/* eslint-disable */
'use strict';
const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;

const { Context } = require('fabric-contract-api');
const { ChaincodeStub } = require('fabric-shim');

const CouponTransfer = require('../lib/couponTransfer.js');

let assert = sinon.assert;
chai.use(sinonChai);

describe('Basic Tests', () => {
    let transactionContext, chaincodeStub, coupon;
    beforeEach(() => {
        transactionContext = new Context();

        chaincodeStub = sinon.createStubInstance(ChaincodeStub);
        transactionContext.setChaincodeStub(chaincodeStub);

        chaincodeStub.putState.callsFake((key, value) => {
            if (!chaincodeStub.states) {
                chaincodeStub.states = {};
            }
            chaincodeStub.states[key] = value;
        });

        chaincodeStub.getState.callsFake(async (key) => {
            let ret;
            if (chaincodeStub.states) {
                ret = chaincodeStub.states[key];
            }
            return Promise.resolve(ret);
        });

        chaincodeStub.deleteState.callsFake(async (key) => {
            if (chaincodeStub.states) {
                delete chaincodeStub.states[key];
            }
            return Promise.resolve(key);
        });

        chaincodeStub.getStateByRange.callsFake(async () => {
            function* internalGetStateByRange() {
                if (chaincodeStub.states) {
                    // Shallow copy
                    const copied = Object.assign({}, chaincodeStub.states);

                    for (let key in copied) {
                        yield { value: copied[key] };
                    }
                }
            }

            return Promise.resolve(internalGetStateByRange());
        });

        coupon = {
            active: true,
            merchant: 'Bluehost',
            id: '1',
            discount: '10%',
            type: 'discount'
        }
    });

    describe('Test InitLedger', () => {
        it('should return error on InitLedger', async () => {
            chaincodeStub.putState.rejects('failed inserting key');
            let couponTransfer = new CouponTransfer();
            try {
                await couponTransfer.InitLedger(transactionContext);
                assert.fail('InitLedger should have failed');
            } catch (err) {
                expect(err.name).to.equal('failed inserting key');
            }
        });

        it('should return success on InitLedger', async () => {
            let couponTransfer = new CouponTransfer();
            await couponTransfer.InitLedger(transactionContext);
            let ret = JSON.parse((await chaincodeStub.getState('1')).toString());
            expect(ret).to.eql(Object.assign({ type: 'discount' }, coupon));
        });
    });

    describe('Test CreateCoupon', () => {
        it('should return error on CreateCoupon', async () => {
            chaincodeStub.putState.rejects('failed inserting key');

            let couponTransfer = new CouponTransfer();
            try {
                const { merchant, id, discount, active } = coupon;
                await couponTransfer.createCoupon(transactionContext, merchant, id, discount, active);
                assert.fail('CreateCoupon should have failed')
            }
            catch (error) {
                expect(error.name).to.equal('failed inserting key')
            }
        })

        it('should return success on CreateCoupon', async () => {

            let couponTransfer = new CouponTransfer();

            const { merchant, id, discount, active } = coupon;
            let result = await couponTransfer.createCoupon(transactionContext, merchant, id, discount, active);
            expect(result).to.eql(JSON.stringify(coupon))
        })
    })
});

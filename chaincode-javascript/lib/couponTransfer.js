/* eslint-disable */
const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class CouponTransfer extends Contract {

    async InitLedger(ctx) {
        const coupons = [{
            active: true,
            merchant: 'Bluehost',
            id: '1',
            discount: '10%'
        }, {
            active: true,
            merchant: 'Makemytrip',
            id: '2',
            discount: '5%'
        }, {
            active: true,
            merchant: 'Slice',
            id: '3',
            discount: '30%'
        }]

        for (const coupon of coupons) {
            coupon.type = 'discount'
            await ctx.stub.putState(coupon.id, Buffer.from(stringify(sortKeysRecursive(coupon))))
        }

    }

    async couponExists(ctx, id) {
        const readDataFromWS = await ctx.stub.getState(id)
        return readDataFromWS && readDataFromWS.length > 0
    }

    async getCoupon(ctx, id) {
        const exists = await this.couponExists(ctx, id)
        if (!exists) {
            throw new Error(`The coupon with the following ${id} doesnt exist`)
        }
        const readDataFromWS = await ctx.stub.getState(id)
        return readDataFromWS
    }

    async createCoupon(ctx, merchant, id, discount, active) {
        const exists = await this.couponExists(ctx, id)
        if (exists) {
            throw new Error(`The coupon with the following ${id} already exist`)
        }
        const coupon = {
            active,
            merchant,
            id,
            discount,
            type: 'discount',
        }

        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(coupon))))
        return JSON.stringify(coupon)
    }

    async deleteCoupon(ctx, id) {
        const exists = await this.couponExists(ctx, id)
        if (!exists) {
            throw new Error(`The coupon with the following ${id} doesnt exist`)
        }
        await ctx.stub.deleteState(id)
        const response = {
            id,
            deleted: true,
        }
        return response
    }

    async updateCoupon(ctx, id, merchant, discount, active) {
        const exists = await this.couponExists(ctx, id)
        if (!exists) {
            throw new Error(`The coupon with the following ${id} doesnt exist`)
        }

        const updatedCoupon = {
            active,
            id,
            merchant,
            discount,
            type: 'discount'
        }
        return await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedCoupon))))
    }

    async switchCouponActivity(ctx, id) {
        const exists = await this.couponExists(ctx, id)
        if (!exists) {
            throw new Error(`The coupon with the following ${id} doesnt exist`)
        }
        const coupon = await this.getCoupon(ctx, id)
        coupon.active = !coupon.active

        return await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(coupon))));
    }

    async GetAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = CouponTransfer;
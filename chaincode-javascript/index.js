/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// const assetTransfer = require('./lib/assetTransfer');
const couponTransfer = require('./lib/couponTransfer');

// module.exports.AssetTransfer = assetTransfer;
module.exports.CouponTransfer = couponTransfer;
module.exports.contracts = [couponTransfer];

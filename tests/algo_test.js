let BN = require('bn.js');


function hash_valid(hash, target) {
    let bn = new BN(hash, 'hex');
    let numbers = [];

    for (let i = 0; i < 32; i++) {
        numbers.unshift(bn.shrn(i * 1 * 8).and(new BN(0xff)).toNumber());
    }

    let exp_val = 0;
    for (let i in numbers) {
        exp_val += numbers[i];
    }

    exp_val /= numbers.length;

    let dispersion = 0;
    for (let i in numbers) {
        dispersion += Math.pow(numbers[i] - exp_val, 2);
    }

    dispersion /= numbers.length;

    let = standard_deviation = Math.sqrt(dispersion);
    let sigma1 = exp_val + standard_deviation;
    let sigma1lz = exp_val - standard_deviation;

    let sigma2 = exp_val + standard_deviation * 2;
    let sigma2lz = exp_val - standard_deviation * 2;

    let sigma3 = exp_val + standard_deviation * 3;
    let sigma3lz = exp_val - standard_deviation * 3;

    let sigma4 = exp_val + standard_deviation * 3;
    let sigma4lz = exp_val - standard_deviation * 4;

    //console.log("M = " + exp_val + ", D = " + dispersion + ", sqrt(D) = " + standard_deviation + " S1 = [ " + sigma1lz + ", " + sigma1 + " ], S2 = [ " + sigma2lz + ", " + sigma2 + " ] S3 = [ " + sigma3lz + ", " + sigma3 + " ], S4 = [ " + sigma4lz + ", " + sigma4 + " ]")

    let offset = target & 0xff;
    let count = (target >> 8) & 0xff;
    if (count < 1)
        count = 1;

    let slice = numbers.slice(0, count);


    let slice_avg = 0;
    for (let i in slice) {
        slice_avg += slice[i];
    }

    slice_avg /= slice.length;

    let res = 0;
    if (slice_avg > sigma1 + offset || slice_avg < sigma1lz - offset) {
        res = 1;
    }

    console.log(hash + ", " + exp_val + ", " + dispersion + ", " + standard_deviation + ", " + sigma1 + ", " + sigma1lz + ", " + sigma2 + ", " + sigma2lz + ", " + sigma3 + ", " + sigma3lz + ", " + sigma4 + ", " + sigma4lz + ", " + count + ", " + offset + ", " + slice_avg + ", " + res);

    return res;
}

const crypto = require('crypto');
//hash_valid("bd19840186d17a3ac904eca54400d7e95a06ff62f4682181a2a893702abd4377");
console.log("hash, M, D, sqrt(D), S1, -S1, S2, -S2, S3, -S3, S4, -S4, count, offset, slice_avg, RES");
for (let i = 0; i < 1000; i++) {
    hash_valid(crypto.createHash('sha256').update("" + i).digest('hex'));
}

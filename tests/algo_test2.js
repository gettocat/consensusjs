let BN = require('bn.js');
const { SHA3 } = require('sha3');

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

    let offset = target & 0xff;
    let count = (target >> 8) & 0xff;
    let sigmaNum = (target >> 2 * 8) & 0xff;
    if (count < 1)
        count = 1;

    if (sigmaNum < 1 || sigmaNum > 4)
        sigmaNum = 2;

    let range = [];
    if (sigmaNum == 1)
        range = [sigma1lz, sigma1];
    if (sigmaNum == 2)
        range = [sigma2lz, sigma2];
    if (sigmaNum == 3)
        range = [sigma3lz, sigma3];
    if (sigmaNum == 4)
        range = [sigma4lz, sigma4];

    let slice = numbers.slice(0, count);


    /*
    not average!
    let slice_avg = 0;
    for (let i in slice) {
        slice_avg += slice[i];
    }

    slice_avg /= slice.length;
*/

    /*
        let res = 0;
        if (slice_avg > sigma2 + offset || slice_avg < sigma2lz - offset) {
            res = 1;
        }*/

    let res = 0;
    for (let k in slice) {
        if (slice[k] > range[1] + offset || slice[k] < range[0] - offset) {
            res++;
        }
    }

    return [
        res == slice.length,
        sigmaNum,
        count,
        offset
    ];
}

function hash(text) {
    const hash = new SHA3(256);

    hash.update(text);
    return hash.digest('hex');
}

function num16(num) {
    if (num < 16)
        return "0" + Number(num).toString(16);
    return Number(num).toString(16);
}


let startCount = 1;
let startOffset = 1;

startOffset = process.argv[2]||1;
startCount = process.argv[3]||1;

for (let count = startCount; count <= 32; count++) {
    for (let offset = startOffset; offset < 256; offset++) {
        let sum = 0;
        let avg = 0;
        let start = Date.now();
        let time = 0;
        let cnt = 1;
        let hash_finded = false;

        while (!hash_finded || time > 300) {
            let res = hash_valid(hash((Math.random() * 1000000) + count + "" + offset), parseInt(num16(1) + num16(count) + num16(offset), 16));
            sum += res[0];
            if (res[0])
                hash_finded = true;

            try {
                if (res[1] != 1)
                    throw new Error("Sigma is invalid must be: " + 1 + ", actual: " + res[1]);
                if (res[2] != count)
                    throw new Error("Count is invalid must be: " + count + ", actual: " + res[2]);
                if (res[3] != offset)
                    throw new Error("Offset is invalid must be: " + offset + ", actual: " + res[3]);
            } catch (e) {
                console.log(num16(1) + num16(count) + num16(offset), 1, count, offset);
                throw e;
            }

            cnt++;
            time = (Date.now() - start) / 1000;
        }

        if (time > 00 & !hash_finded) {
            avg = -999;
        } else
            avg = (sum / cnt) * 100;

        console.log(avg.toString().replace(".", ",") + ";" + cnt + ";" + parseInt((Date.now() - start) / 1000) + ";1;" + count + ";" + offset + ";" + num16(1) + num16(count) + num16(offset));
    }
}
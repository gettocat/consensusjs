let BN = require('bn.js');
const { SHA3 } = require('sha3');

function normalize() {

}

function hash_valid(hash, target) {
    let uint128 = new BN(hash, 16);
    let m = uint128.mul(new BN(target));
    let maxTarget = new BN(2).pow(new BN(250)).sub(new BN(1));
    return m.lt(maxTarget) ? 1 : 0;
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

let N = 12;
let target_sec = N * 60;
let count = 1;
let offset = 1;
let diffs = [];
let timestamps = [];

startOffset = offset = process.argv[2] || 1;
startCount = process.argv[3] || 1;

let m = true;
for (; m;) {
    let sum = 0;
    let avg = 0;
    let start = Date.now();
    let time = 0;
    let cnt = 1;
    let hash_finded = false;

    while (!hash_finded || time > 300) {
        let res = hash_valid(hash((Math.random() * 1000000) + "" + count + ""), count);
        sum += res;
        if (res)
            hash_finded = true;

        cnt++;
        time = (Date.now() - start) / 1000;
    }


    let last = diffs[0];
    if (!last)
        last = 0;

    diffs.unshift(last + count);
    timestamps.unshift(new Date().getTime() / 1000);

    if (diffs.length > N)
        diffs = diffs.slice(0, N);

    if (timestamps.length > N)
        timestamps = timestamps.slice(0, N);

    timestamps.sort((a, b) => {
        return a - b;
    });

    let c = diffs.length >= N ? N : diffs.length;

    let total_work = (parseInt(diffs[0] - diffs[c-1]));

    /*let twavg = 0;
    for (let i in diffs) {
        twavg += diffs[i];
    }

    total_work = twavg / diffs.length;*/

    let time_span = parseInt(timestamps[c - 1] - timestamps[0]);

    if (time_span < 1) {
        time_span = 1;
    }

    let newTarget = parseInt((total_work * target_sec + time_span - 1) / time_span);

    if (diffs.length < N)
        newTarget = 1;

    if (newTarget < 0)
        newTarget = 1;

    if (time > 00 & !hash_finded) {
        avg = -999;
    } else
        avg = (sum / cnt) * 100;

    console.log(diffs);
    //console.log(diffs.length, total_work, target_sec, time_span, newTarget);
    console.log("avg: " + avg.toString().replace(".", ",") + ";cnt: " + cnt + ";time: " + parseInt((Date.now() - start) / 1000) + ";hashes: " + count + ";total_work: " + total_work + ";timespan: " + time_span + ";target: " + newTarget);
    count = newTarget;
}
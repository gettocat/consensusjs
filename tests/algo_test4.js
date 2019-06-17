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

let N = 15;
let target_sec = N * 20;
let count = 1;
let diffs = [];
let timestamps = [];

let m = true;
for (; m;) {
    let sum = 0;
    let cnt = 0;
    let avg = 0;
    let start = Date.now();
    let time = 0;
    let hash_finded = false;

    while (!hash_finded || time > 300) {
        let res = hash_valid(hash((Math.random() * 1000000) + "" + count + ""), count);
        sum += res;
        if (res)
            hash_finded = true;

        cnt++;
        time = (Date.now() - start) / 1000;
    }


    diffs.unshift(count);
    timestamps.unshift(new Date().getTime() / 1000);

    if (diffs.length > N)
        diffs = diffs.slice(0, N);

    if (timestamps.length > N)
        timestamps = timestamps.slice(0, N);

    let c = diffs.length >= N ? N : diffs.length;
    /*let timestamps_ = timestamps.slice(0, N);
    
    timestamps_.splice(timestamps_.indexOf(Math.max.apply(Math, timestamps_)), 1);
    timestamps_.splice(timestamps_.indexOf(Math.min.apply(Math, timestamps_)), 1);

    let time_span = parseInt(Math.max.apply(Math, timestamps_) - Math.min.apply(Math, timestamps_));*/
    let time_span = parseInt(Math.max.apply(Math, timestamps) - Math.min.apply(Math, timestamps));
    if (time_span < 1 || isNaN(time_span))
        time_span = 1;

    let diffsum = 0;
    for (let _dfa in diffs) {
        diffsum += diffs[_dfa];
    }

    diffsum -= Math.max.apply(Math, diffs) - Math.min.apply(Math, diffs);
    diffavg = diffsum / (diffs.length - 2);

    let newTarget = (target_sec * diffavg) / time_span

    //console.log(timestamps);
    //console.log(diffs);
    //console.log("cnt: " + cnt + ";time: " + parseInt((Date.now() - start) / 1000) + ";oldtarget: " + count + ";diffavg: " + diffavg + ";timespan: " + time_span + ";newtarget: " + newTarget);
    console.log(cnt + ";" + parseInt((Date.now() - start) / 1000) + ";" + count + ";" + diffavg + ";" + time_span + ";" + newTarget);

    if (c < 5)
        count = 1;
    else
        count = newTarget;
}
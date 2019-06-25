const AppClass = require("../index");
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let app = new AppClass({
    "examplepow": {
        "extends": "pow",
        "shareStake": 0.3,
        "premine": 6,
        "blocktime": 60,
        "changeBranchDelay": 1,
    },
    "genesis": {
        "id": 'genesis',
        "prev": -1,
        "bits": 1,
        "time": 0,
        "nonce": 0,
    }
});

app.on("debug", (data) => {
    //if (data.module == 'DataMapper' && data.text.indexOf("change main chain") == -1)
    //    return;
    console.log("[" + new Date().toLocaleTimeString() + "]", "< " + data.level + " >", data.module, data.text);
});

app.defineDataClass(((app) => {

    class PosData extends app.DATA {
        static getPrevIdFieldName() {
            return 'prev';
        }
    }

    return PosData;
})(app));

app.defineConsensusClass(((app) => {
    class PoWConsensus extends app.CONSENSUS.ProofOfWorkConsensus {
        constructor() {
            super("Example PoW orphan-side-chains test consensus", "examplepow")
        }
        isDataMatch() {
            return true;
        }
    }

    return PoWConsensus;
})(app));

app.start('default');//use default app.CONSENSUS (redefined)

app.on("chain.changed", (res) => {
    console.log("change slice of side chain to main chain, count: " + res.items + ", change from dataId: ", res.data.getId(), " old height: " + res.oldheight + ", new height: " + res.newheight, "now in main: ", res.nowInMain);
})

let peer1 = new app.PEER({ id: 1 });
app.peerManager.addPeer(peer1);

let prevprev = 'genesis';
let prevId = 'genesis';
let N = 100;

//let sides = [50, 25, 15, 78];//test1
let sides = [50, 51, 52, 53, 54, 55];//test2
let orphan = [25];
let delay = [];
let prevs = [];
for (let i = 1; i < N; i++) {

    let prev = prevId;
    if (sides.indexOf(i) !== -1) {
        prev = prevprev;
    }


    let data = new app.DATA({
        id: i,
        prev: prev,
        time: Date.now() / 1000,
        bits: 1
    });

    if (orphan.indexOf(i) !== -1) {
        delay.push(data);
        prevId = i;
        continue
    }

    app.consensus.applyData(peer1, data);
    prevprev = prev;
    prevId = i;

}
console.log(app.dataManager.chain);

rl.question('Add orphan parents? (y/n)', (answer) => {
    if (answer.trim() == 'yes' || answer.trim() == 'y') {
        for (let i in delay) {
            app.consensus.applyData(peer1, delay[i]);
        }

        console.log(app.dataManager.chain);
    }
    rl.close();
});


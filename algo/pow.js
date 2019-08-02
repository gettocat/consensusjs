const BN = require('bn.js');

module.exports = function (app) {

    class ProofOfWorkConsensus extends app.CONSENSUS {

        constructor(title, name) {
            if (!name)
                super('Proof of Work', 'pow');
            else
                super(title, name);
            this.debug("debug", "inited " + name);

        }
        isPeerCanSendData(peer) {
            return true;
        }
        isDataMatch(data, peer) {
            return this.checkHash(data.getId(), data.getBits()) && data.getBits() == this.next_network_target(app.dataManager.getHeight());
        }
        getWindowRange(from) {
            if (from == -1)
                return [0, 0];

            if (!from)
                from = app.dataManager.getTopInfo().height;
            let to = from - (this.getConfig('diffWindow') + 2 * this.getConfig('diffCut'));
            if (to < 0)
                to = 0;

            if (from == 0)
                to = 0;

            return [from, to];
        }
        next_network_target(height) {
            let last = app.dataManager.getTopInfo();

            if (last.height < this.getConfig('premine') || !isFinite(last.height))
                return this.getConfig('maxtarget');

            let range = this.getWindowRange(height);
            let list = app.dataManager.getDataSlice(range[0], range[1]);//top block on top in list[0]

            if (!list.length || last.height == 0)//genesis check
                return this.getConfig('maxtarget')

            let difficulties = [], timestamps = [];

            for (let i in list) {
                difficulties.push(list[i].getBits());
                timestamps.push(list[i].getTime());
            }

            let L = this.getConfig('blockcount');
            let N = difficulties.length;

            if (N < L)
                return this.getConfig('maxtarget')

            let diffCut = this.getConfig('excludeFirst');
            let diffWindow = L;

            let cut_end;
            let cut_start;

            cut_end = timestamps.length - 1 - diffCut;//dont use 1st block values.
            if (cut_end < 1)
                cut_end = 0;

            cut_start = cut_end - diffWindow;
            if (cut_start < 0)
                cut_start = 0;

            let target_sec = L * this.getConfig('blocktime');
            let times = timestamps.slice(cut_start, cut_end);

            let time_span = parseInt(Math.max.apply(Math, times) - Math.min.apply(Math, times));
            if (time_span < 1 || isNaN(time_span))
                time_span = 1;

            let diffs = difficulties.slice(cut_start, cut_end);
            let diffsum = 0;
            for (let _dfa in diffs) {
                diffsum += diffs[_dfa];
            }

            diffsum -= Math.max.apply(Math, diffs);
            diffsum -= Math.min.apply(Math, diffs);
            let diffavg = diffsum / (diffs.length - 2);

            let newTarget = (target_sec * diffavg) / time_span
            return newTarget;
        }

        checkHash(hash, target) {
            let uint128 = new BN(hash, 16);
            let m = uint128.mul(new BN(target));
            let maxTarget = new BN(2).pow(new BN(250)).sub(new BN(1));
            return m.lt(maxTarget);
        }
    }

    ProofOfWorkConsensus.BN = BN;
    return ProofOfWorkConsensus;

}
module.exports = function (app) {

    class RoundMapper extends app.MODULE {

        constructor() {
            super();
            this.list = {};
            this.debug("debug", "inited");
            this.cursor = null;
            this.cursorId = 0;
            this.validators = [];
            this.lastBlockTime = 0;
        }
        getValidatorsList() {
            //sort
            let a = Object.values(this.list);
            a.sort((a, b) => {
                if (a.getPriority() > b.getPriority()) {
                    return -1;
                } else if (a.getPriority() < b.getPriority()) {
                    return 1;
                } else {
                    if (a.getVolume() > b.getVolume())
                        return -1;
                    return 1;
                }
            });

            let l = a.slice(0, app.consensus.config.validatorCount);

            let m = [];
            for (let k in l) {
                m.push(l[k].getId());
            }

            return m;
        }

        getAllValidatorsList() {
            return Object.keys(this.list);
        }

        check(peer, data) {
            if (!this.merkle) {
                //new message
                this.update();
            }

            this.debug('debug', 'check message for consensus', this.merkle, this.validators, 'cursor', this.cursor, 'data cursor', data.getKey(), 'time delta: ', data.getTime() - this.lastBlockTime);
            if (data.getKey() == this.cursor && this.merkle == data.getValidatorsMerkle()) {
                this.checkBlockTime(peer, data);
                let val = this.getValidator(this.cursor);
                if (val.getPriority() < 0) {
                    this.incrementPriority();
                }
                return true;
            }

            return false;
        }

        checkBlockTime(peer, data) {
            if (this.lastBlockTime > 0) {

                if (peer) {//if peer is null - its just sync, dont check time in this case
                    if (data.getTime() - this.lastBlockTime > app.consensus.config.timeout) {
                        //check cursor
                        //send to all
                        this.debug('info', 'validator ', this.cursor, 'is timedout - change cursor to next');
                        this.decrementPriority();
                        app.emit("consensus.timeout", this.cursor);
                        this.update();
                        throw new Error('Block timedout, cursor changed to next validator');
                    }
                }

                if (data.getTime() < this.lastBlockTime + app.consensus.config.pause)
                    throw new Error('Invalid block time, pause not observed');

            }
            return true;
        }

        update() {
            let prevData = app.dataManager.getDataFromHeight(app.dataManager.getTopInfo().height);
            if (!this.merkle) {
                this.cursorId = 0;
                this.validators = this.getValidatorsList();
                this.merkle = app.merkle(this.validators);

                if (prevData) {
                    let m = prevData.getValidatorsMerkle();
                    if (m == this.merkle) {
                        this.debug('debug', 'init consensus with validator ', this.cursorId, this.cursor, ', get next');
                        this.cursorId = (prevData.getBits() + 1) % this.validators.length - 1;
                        this.debug('debug', 'inited consensus with validator ', this.cursorId, this.cursor);
                    } else {
                        this.debug('debug', 'init consensus with validator ', this.cursorId, this.cursor, ',consensus changed from lastblock');
                    }
                }

                this.cursor = this.validators[this.cursorId];
                return;
            }

            if (this.cursorId + 1 > this.validators.length - 1) {
                this.cursorId = 0;
                if (prevData)
                    this.lastBlockTime = prevData.getTime();

                let delta = Date.now() / 1000 - prevData.getTime();
                if (delta > app.consensus.config.timeout)
                    this.lastBlockTime = 0;

                this.validators = this.getValidatorsList();
                this.merkle = app.merkle(this.validators);
                this.cursor = this.validators[this.cursorId];
                this.debug('debug', 'create new round ' + this.merkle + ', active cursor: ' + this.cursorId + " ");
            } else {
                this.cursorId++;
                let old = this.cursor;
                if (prevData)
                    this.lastBlockTime = prevData.getTime();

                let delta = Date.now() / 1000 - prevData.getTime();
                if (delta > app.consensus.config.timeout)
                    this.lastBlockTime = 0;

                this.cursor = this.validators[this.cursorId];
                this.debug('debug', 'update cursor ' + this.cursor + ', old cursor: ' + old + ', active cursor: ' + this.cursorId + " ");
            }
        }

        decrementPriority() {
            this.debug('debug', 'decrement priority for validator', this.cursor);
            //send to all validators
            //active cursor MUST send this to blockchain!
        }

        incrementPriority() {
            this.debug('debug', 'increment priority for validator', this.cursor);
            //send to all validators
            //active cursor MUST send this to blockchain!
        }

        getRoundValidators() {
            return this.validators;
        }

        addValidator(publickey, priority, volume) {
            let d = new app.VALIDATOR({ id: publickey, priority: priority, volume: volume })
            this.list[d.getId()] = d;
            this.merkle = '';
        }

        removeValidator(publickey) {
            delete this.list[publickey];
            this.merkle = '';
        }

        validatorCount() {
            return Object.keys(this.list).length;
        }

        getValidator(key) {
            return this.list[key];
        }

        getCursorId() {
            return this.cursorId;
        }

        isValidator(key) {
            return this.getValidator(key) instanceof app.VALIDATOR
        }

        isActiveValidator(key) {
            return this.getValidator(key) instanceof app.VALIDATOR && this.validators.indexOf(key) != -1
        }

    }

    return RoundMapper;

}
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
        getLastCursorId() {
            let prevData = app.dataManager.getDataFromHeight(app.dataManager.getTopInfo().height);
            let validators = this.getValidatorsList();
            let merkle = app.merkle(validators);

            if (prevData) {
                let m = prevData.getValidatorsMerkle();
                if (m == merkle) {
                    return prevData.getBits();
                }
            }

            return -1;
        }
        getNextCursorId() {
            let validators = this.getValidatorsList();
            let val = this.getLastCursorId();
            return (val + 1) % validators.length
        }
        getLastState() {
            let prevData = app.dataManager.getDataFromHeight(app.dataManager.getTopInfo().height);
            let cursor = prevData.getNonce();
            let list = prevData.getValidators();
            let merkle = app.merkle(list);

            return {
                lastBlockTime: prevData.getTime(),
                validators: list,
                cursor: cursor,
                merkle
            };
        }
        getNextState() {
            let state = this.getLastState();

            let delta = Date.now() / 1000 - state.lastBlockTime;
            if (delta > app.consensus.config.timeout)
                state.lastBlockTime = 0;

            if (state.cursor + 1 > state.validators.length - 1) {//update states
                let validators = this.getValidatorsList();
                let merkle = app.merkle(validators);

                this.debug('debug', 'create new round ' + merkle + ', active cursor: ' + state.cursor + " ");
                return {
                    old: state.cursor,
                    merkle,
                    lastBlockTime: state.lastBlockTime,
                    validators: validators,
                    cursor: 0
                }
            } else {
                this.debug('debug', 'update cursor ' + state.cursor + '->' + (state.cursor + 1) + ', old cursor: ' + state.validators[state.cursor] + ', active cursor: ' + state.validators[state.cursor + 1] + " ");

                return {
                    old: state.cursor,
                    merkle: state.merkle,
                    lastBlockTime: state.lastBlockTime,
                    validators: state.validators,
                    cursor: state.cursor + 1
                }
            }

        }
        initCursor() {

            //get cursor and validators from last block in blockchain
            let d = this.getLastState();
            this.prevValidators = d.validators;
            this.prevMerkle = app.merkle(this.prevValidators);
            this.prevCursorId = d.cursor;
            this.prevCursor = this.prevValidators[this.prevCursorId];

            //it can be changed if added new validator, so, you can not trust 100% this data
            let d2 = this.getNextState();
            this.validators = d2.validators;
            this.merkle = app.merkle(this.validators);
            this.cursorId = d2.cursor;
            this.cursor = this.validators[this.cursorId];
            this.lastBlockTime = d2.lastBlockTime;

            this.debug('debug', 'inited consensus with validator ', this.cursorId, this.cursor);
        }
        update() {
            //received new block
            if (!this.merkle) {
                this.initCursor();
                return;
            }

            let d = this.getNextState();
            this.validators = d.validators;
            this.merkle = app.merkle(this.validators);
            this.cursorId = d.cursor;
            this.cursor = this.validators[this.cursorId];
            this.lastBlockTime = d.lastBlockTime;
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
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

            app.on("consensus.round.new", () => {
                for (let i in this.list) {
                    //update validator priority data to blockchain
                    this.list[i].setPriorityConfirm(true);
                }
            })

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
            //it can be old block to side chain too. 
            //!!!!!

            let genesis = app.dataManager.getGenesis();
            if (data.getId() == genesis.getId()) {
                return true;
            }

            //get prev block
            let prevData = app.dataManager.getData(data.getPrevId());
            let validators = prevData.getValidators();
            let validatorsUpdatedRound = this.getValidatorsList();
            //prev validator cursor is not last in list

            //check: key in validator list
            let prevIndex = validators.indexOf(prevData.getKey());
            let dataIndex = validators.indexOf(data.getKey());
            let prevIndexUpdatedRound = validatorsUpdatedRound.indexOf(prevData.getKey());
            let dataIndexUpdatedRound = validatorsUpdatedRound.indexOf(data.getKey());

            if (dataIndex == -1 && prevIndexUpdatedRound != -1) {
                this.debug('debug', 'Data keys is not part of validators');
                return false;
            } else if (dataIndex == -1 && prevIndexUpdatedRound == -1) {//consensus was changed
                if (dataIndexUpdatedRound != 0) {
                    this.debug('debug', 'Round changed but new validator key is not first in list');
                    return false;
                } else
                    return true;
            }

            //check prev is last - check now is first.
            //if cursorId == 0 - check prev is last
            if (prevIndex == validators.length - 1) {
                if (dataIndex != 0 && dataIndexUpdatedRound != 0) {
                    //round changed (only in amounts or priority). Just check that our key in validators and its first.

                    let vallist = data.getValidators();
                    let key = data.getKey();
                    if (vallist.indexOf(key) != 0) {
                        this.debug('debug', 'Data key not in bounds of new reordered round');
                        return false;
                    }

                    return true;
                }
            } else if (prevIndex == 0) {
                if (validatorsUpdatedRound[prevIndex + 1] != data.getKey() && validators[prevIndex + 1] != data.getKey()) {
                    this.debug('debug', 'Data key not in bounds');
                    return false;
                }
            } else {
                //check: prev cursor + 1 = this cursor
                if (validators[prevIndex + 1] != data.getKey()) {
                    this.debug('debug', 'Data key not in bounds');
                    return false;
                }
            }

            this.checkBlockTime(peer, data);
            //TODO: increment priority

            /*if (data.getKey() == this.cursor && this.merkle == data.getValidatorsMerkle()) {
                
                let val = this.getValidator(this.cursor);
                if (val.getPriority() < 0 && val.isPriorityConfirmed()) {
                    this.incrementPriority();
                }
                return true;
            }*/

            return true;
        }

        //when new block received
        checkBlockTime(peer, data) {
            if (this.lastBlockTime > 0) {

                if (peer) {//if peer is null - its just sync, dont check time in this case
                    if (data.getTime() - this.lastBlockTime > app.consensus.config.timeout) {
                        //check cursor
                        //send to all
                        this.debug('info', 'validator ', this.cursor, 'is timedout - change cursor to next');
                        this.decrementPriority();
                        let old = this.cursor;
                        this.update(true);
                        app.emit("consensus.timeout", {
                            old: old,
                            new: this.cursor
                        });
                        throw new Error('Block timedout, cursor changed to next validator');
                    }
                }

                if (data.getTime() < this.lastBlockTime + app.consensus.config.pause)
                    throw new Error('Invalid block time, pause not observed');

            }
            return true;
        }

        //must be used in timer, its action if new block will not received
        checkTimeout() {
            if (this.lastBlockTime > 0) {
                if (Date.now() / 1000 - this.lastBlockTime > app.consensus.config.timeout) {
                    //check cursor
                    //send to all
                    this.debug('info', 'validator ', this.cursor, 'is timedout - change cursor to next');
                    this.decrementPriority();
                    let old = this.cursor;
                    this.update(true);
                    app.emit("consensus.timeout", {
                        old: old,
                        new: this.cursor
                    });
                    throw new Error('Block timedout, cursor changed to next validator');
                }

                if (Date.now() / 1000 < this.lastBlockTime + app.consensus.config.pause)
                    throw new Error('Invalid block time, pause not observed');
            }
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
        getNextState(force, events) {
            let state = this.getLastState();

            let delta = Date.now() / 1000 - state.lastBlockTime;
            if (delta > app.consensus.config.timeout)
                state.lastBlockTime = 0;

            let cnt = 1;
            if (force === true)
                cnt = 2;

            if (state.cursor + cnt > state.validators.length - 1) {//update states
                let validators = this.getValidatorsList();
                let merkle = app.merkle(validators);

                this.debug('debug', 'create new round ' + merkle + ', old active cursor: ' + state.cursor + ", new: " + ((state.cursor + cnt) % state.validators.length));

                let o = {
                    old: state.cursor,
                    merkle,
                    lastBlockTime: state.lastBlockTime,
                    validators: validators,
                    cursor: cnt - 1//(state.cursor + cnt) % state.validators.length//-1+cnt
                };

                if (events) {
                    app.emit("consensus.round.cursor", o);
                    app.emit("consensus.round.new", o);
                }

                return o
            } else {
                this.debug('debug', 'update cursor ' + state.cursor + '->' + (state.cursor + cnt) + ', old cursor: ' + state.validators[state.cursor] + ', active cursor: ' + state.validators[state.cursor + cnt] + " ");

                let o = {
                    old: state.cursor,
                    merkle: state.merkle,
                    lastBlockTime: state.lastBlockTime,
                    validators: state.validators,
                    cursor: state.cursor + cnt
                }

                if (events) {
                    app.emit("consensus.round.cursor", o);
                }


                return o
            }

        }
        getCurrentState() {
            return {
                merkle: this.merkle,
                lastBlockTime: this.lastBlockTime,
                validators: this.validators,
                cursor: this.cursorId
            }
        }
        initCursor(force) {
            //get cursor and validators from last block in blockchain
            let d = this.getLastState();
            this.prevValidators = d.validators;
            this.prevMerkle = app.merkle(this.prevValidators);
            this.prevCursorId = d.cursor;
            this.prevCursor = this.prevValidators[this.prevCursorId];

            if (this.current) {
                let curr = this.getValidator(this.current);
                if (!curr.isPriorityConfirmed() && curr.getPriority() != 0) {
                    //if priority of current node is not in blockchain (was changed locally or received from network) 
                    //and new priority is not null (not increment) - change node with force
                    force = true;
                }
            }

            //it can be changed if added new validator, so, you can not trust 100% this data
            let d2 = this.getNextState(force);
            this.validators = d2.validators;
            this.merkle = app.merkle(this.validators);
            this.cursorId = d2.cursor;
            this.cursor = this.validators[this.cursorId];
            this.lastBlockTime = d2.lastBlockTime;

            this.debug('debug', 'inited consensus with validator ', this.cursorId, this.cursor);
            try {
                this.checkTimeout();
            } catch (e) {
                this.debug('debug', 'validator timedout, changed', this.cursorId, this.cursor);
            }
        }
        update(force) {

            //received new block
            if (!this.merkle) {
                this.initCursor(force);
                return;
            }

            let d = this.getNextState(force, true);
            this.validators = d.validators;
            this.merkle = app.merkle(this.validators);
            this.cursorId = d.cursor;
            this.cursor = this.validators[this.cursorId];
            this.lastBlockTime = d.lastBlockTime;
        }

        decrementPriority() {
            this.debug('debug', 'decrement priority for validator', this.cursor);
            //send to all validators
            //next active cursor MUST send this to blockchain! Must be checked in validations block rules.
            let curr = this.getValidator(this.cursor);
            curr.updatePriority(curr.getPriority() - 1);
            curr.setPriorityConfirm(false);

        }

        incrementPriority() {
            this.debug('debug', 'increment priority for validator', this.cursor);
            //send to all validators
            //next active cursor MUST send this to blockchain!
            let curr = this.getValidator(this.cursor);
            if (curr.getPriority() < 0) {
                curr.updatePriority(curr.getPriority() + 1);
                curr.setPriorityConfirm(false);
            }

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
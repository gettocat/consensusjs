module.exports = function (app) {

    class Peer extends app.MODULE {

        constructor(data) {
            super();
            this.data = data;
            this.f_onmessage = null;
        }

        getId() {
            return this.id;
        }

        send(peerId, msg) {
            throw new Error('Send method in peer class must implemented');
        }

        relay(msg) {
            let list = app.peerManager.getPeersList();
            for (let i in list){
                this.send(list[i].getId(), msg);
            }
        }   

        newMessage(message) {
            if (app.DATA.IsDataMessage(message)) {
                let d = new app.DATA(message);
                app.consensus.applyData(this, d);
                return true;
            }
            return false;
        }

        close(code) {
            app.peerManager.removePeer(this);
        }

        error(code, message) {
            app.peerManager.removePeer(this);
        }

    }

    return Peer;

}
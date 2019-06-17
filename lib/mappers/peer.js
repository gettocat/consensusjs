module.exports = function (app) {

    class PeerMapper extends app.MODULE {

        constructor() {
            super();
            this.list = {};
            this.debug("debug", "inited");
        }

        getPeersList() {
            return this.list;
        }

        addPeer(peer) {
            this.list[peer.getId()] = peer;
        }

        removePeerById(peerId) {
            delete this.list[peerId];
        }

        removePeer(peer) {
            this.removePeerById(peer.getId());
        }

    }

    return PeerMapper;

}
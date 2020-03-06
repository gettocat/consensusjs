module.exports = function (app) {

    class Validator extends app.MODULE {

        constructor(data) {
            super();
            this.data = data;
        }

        getId() {
            return this.data.id;
        }

        getVolume(){
            return this.data.volume;
        }

        getPriority(){
            return this.data.priority;
        }

        updateVolume(volume){
            this.data.volume = volume;
        }

        updatePriority(priority){
            this.data.priority = priority;
        }

    }

    return Validator;

}
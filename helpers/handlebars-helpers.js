module.exports = {
    formatIndex: function (index) {
        return index + 1;
    },
    checkStatus: function (status) {
        if (status == 'accepted') {
            return true;
        } else if (status == 'rejected') {
            return false;
        } else {
            return null;
        }
    },
    checkIfThereIsMessage: function (status) {
        if (status == 'accepted' || status == 'rejected') {
            return true;
        }
        return false;
    }
}
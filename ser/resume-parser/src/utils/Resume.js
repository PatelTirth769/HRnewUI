var _ = require('underscore');

module.exports = function () {
    return new Resume();
};

function Resume() {
    this.parts = {};
}

Resume.prototype.addKey = function (key, value) {
    value = value || '';
    value = value.trim();
    if (value) {
        if (_.has(this.parts, key)) {
            // Check if the value is already present to avoid duplication
            if (this.parts[key].includes(value)) {
                return;
            }
            // Add a separator (space or newline depending on key)
            const separator = (key === 'objective' || key === 'summary' || key === 'experience' || key === 'education') ? '\n\n' : ' ';
            value = this.parts[key] + separator + value;
        }
        this.parts[key] = value;
    }
};

Resume.prototype.addObject = function (key, options) {
    var self = this;
    if (!_.has(this.parts, key)) {
        this.parts[key] = {};
    }
    _.forEach(options, function (optionVal, optionName) {
        if (optionVal) {
            self.parts[key][optionName] = optionVal;
        }
    });
};

Resume.prototype.jsoned = function () {
    return JSON.stringify(this.parts);
};

var ParseBoy = require('./ParseBoy');
var processing = require('./libs/processing');

var parser = {
    parseToJSON: function (path, type, cbAfterParse) {
        const objParseBoy = new ParseBoy();
        processing.runFile(path, (preppedFile, error) => {
            if (error || !preppedFile) {
                return cbAfterParse(null, error || new Error('Failed to prepare file'));
            }
            objParseBoy.parseFile(preppedFile, (parsedResume) => cbAfterParse(parsedResume, null));
        });
    },
};

module.exports = parser;

var ParseBoy = require('./ParseBoy');
var processing = require('./libs/processing');

var parser = {
    parseToJSON: function (path, type, cbAfterParse) {
        const objParseBoy = new ParseBoy();
        processing.runFile(path, (preppedFile, error) => {
            objParseBoy.parseFile(preppedFile, (parsedResume) => cbAfterParse(parsedResume, error));
        });
    },
};

module.exports = parser;

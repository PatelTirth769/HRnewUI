'use strict';
const parser = require('./libs/parser');
const logger = require('tracer').colorConsole();

function ParseBoy() { }

ParseBoy.prototype.parseFile = function (PreparedFile, cbGetResume) {
    logger.trace('Working with "' + PreparedFile.name + '" now');
    parser.parse(PreparedFile, cbGetResume);
};

module.exports = ParseBoy;

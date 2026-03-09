'use strict';
const path = require('path'),
    _ = require('underscore'),
    pdf = require('pdf-parse'),
    fs = require('fs'),
    logger = require('tracer').colorConsole();

module.exports.runFile = processFile;
module.exports.PreparedFile = PreparedFile;

function processFile(file, cbAfterProcessing) {
    extractTextFile(file, function (preparedFile, error) {
        if (_.isFunction(cbAfterProcessing)) {
            if (error) {
                return cbAfterProcessing(null, error);
            }
            cbAfterProcessing(preparedFile);
        } else {
            logger.error('cbAfterProcessing should be a function');
            cbAfterProcessing(null, 'cbAfterProcessing should be a function');
        }
    });
}

function cleanTextByRows(data) {
    var rows,
        clearRow,
        clearRows = [];

    rows = data.split('\n');
    for (var i = 0; i < rows.length; i++) {
        clearRow = cleanStr(rows[i]);
        if (clearRow) {
            clearRows.push(clearRow);
        }
    }

    return clearRows.join('\n') + '\n{end}';
}

function extractTextFile(file, cbAfterExtract) {
    logger.trace('Extracting text from:', file);

    const dataBuffer = fs.readFileSync(file);
    pdf(dataBuffer).then(function (data) {
        if (_.isFunction(cbAfterExtract)) {
            const cleanData = cleanTextByRows(data.text);
            var File = new PreparedFile(file, cleanData.replace(/^\s/gm, ''));
            cbAfterExtract(File);
        } else {
            logger.error('cbAfterExtract should be a function');
            return cbAfterExtract(null, 'cbAfterExtract should be a function');
        }
    }).catch(function (err) {
        logger.error('PDF parse error:', err);
        if (_.isFunction(cbAfterExtract)) {
            return cbAfterExtract(null, err);
        }
    });
}

function cleanStr(str) {
    return str.replace(/\r?\n|\r|\t|\n/g, '').trim();
}

function PreparedFile(file, raw) {
    this.path = file;
    const ext = path.extname(file).replace('.', '');
    const mimeTypes = {
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        txt: 'text/plain'
    };
    this.mime = mimeTypes[ext] || 'application/octet-stream';
    this.ext = ext;
    this.raw = raw;
    this.name = path.basename(file);
}

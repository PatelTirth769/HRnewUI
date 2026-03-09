var _ = require('underscore'),
    resume = require('../Resume'),
    dictionary = require('../../dictionary.js'),
    logger = require('tracer').colorConsole();

module.exports = {
    parse: parse,
};

function makeRegExpFromDictionary() {
    var regularRules = {
        titles: {},
        profiles: [],
        inline: {},
    };

    _.forEach(dictionary.titles, function (titles, key) {
        regularRules.titles[key] = [];
        _.forEach(titles, function (title) {
            regularRules.titles[key].push(title.toUpperCase());
            regularRules.titles[key].push(title[0].toUpperCase() + title.substr(1, title.length));
        });
    });

    _.forEach(dictionary.profiles, function (profile) {
        var profileExpr;
        if (_.isString(profile)) {
            profileExpr = '((?:https?://)?(?:www\\\\.)?' + profile.replace('.', '\\\\.') + '[/\\\\w \\\\.-]*)';
            regularRules.profiles.push(profileExpr);
        }
    });

    _.forEach(dictionary.inline, function (expr, name) {
        regularRules.inline[name] = expr + ':?[\\\\s]*(.*)';
    });

    return _.extend(dictionary, regularRules);
}

makeRegExpFromDictionary();

function parse(PreparedFile, cbReturnResume) {
    if (PreparedFile && !PreparedFile.raw) {
        cbReturnResume({ parts: {} }, { error: 'Failed to parse' });
        return {};
    }
    var rawFileData = PreparedFile.raw,
        Resume = new resume(),
        rows = rawFileData.split('\n'),
        row;

    // 1 parse regulars (name, email, phone)
    parseDictionaryRegular(rawFileData, Resume);

    for (var i = 0; i < rows.length; i++) {
        row = rows[i];
        // 2 parse profiles
        row = rows[i] = parseDictionaryProfiles(row, Resume);
        // 3 parse titles (sections)
        parseDictionaryTitles(Resume, rows, i);
        parseDictionaryInline(Resume, row);
    }

    if (_.isFunction(cbReturnResume)) {
        cbReturnResume(Resume);
    } else {
        return console.error('cbReturnResume should be a function');
    }
}

function restoreTextByRows(rowNum, allRows) {
    rowNum = rowNum - 1;
    var rows = [];
    do {
        rows.push(allRows[rowNum]);
        rowNum++;
    } while (rowNum < allRows.length);
    return rows.join('\n');
}

function countWords(str) {
    return str.split(' ').length;
}

function parseDictionaryInline(Resume, row) {
    var find;
    _.forEach(dictionary.inline, function (expression, key) {
        find = new RegExp(expression).exec(row);
        if (find) {
            Resume.addKey(key.toLowerCase(), find[1]);
        }
    });
}

function parseDictionaryRegular(data, Resume) {
    var regularDictionary = dictionary.regular,
        find;
    _.forEach(regularDictionary, function (expressions, key) {
        _.forEach(expressions, function (expression) {
            find = new RegExp(expression).exec(data);
            if (find) {
                Resume.addKey(key.toLowerCase(), find[0]);
            }
        });
    });
}

function parseDictionaryTitles(Resume, rows, rowIdx) {
    var allTitles = _.flatten(_.toArray(dictionary.titles)).join('|'),
        searchExpression = '',
        row = rows[rowIdx],
        ruleExpression,
        isRuleFound,
        result;

    _.forEach(dictionary.titles, function (expressions, key) {
        expressions = expressions || [];
        if (countWords(row) <= 5) {
            _.forEach(expressions, function (expression) {
                ruleExpression = new RegExp(expression, 'i');
                isRuleFound = ruleExpression.test(row);

                if (isRuleFound) {
                    allTitles = _.without(allTitles.split('|'), key).join('|');
                    searchExpression = '(?:' + expression + ')((.*\\n)+?)(?:' + allTitles + '|{end})';
                    result = new RegExp(searchExpression, 'gmi').exec(restoreTextByRows(rowIdx, rows));

                    if (result) {
                        Resume.addKey(key, result[1]);
                    }
                }
            });
        }
    });
}

function parseDictionaryProfiles(row, Resume) {
    var regularDictionary = dictionary.profiles,
        find,
        modifiedRow = row;

    _.forEach(regularDictionary, function (expression) {
        if (_.isString(expression)) {
            find = new RegExp(expression).exec(row);
            if (find) {
                Resume.addKey('profiles', find[0] + '\n');
                modifiedRow = row.replace(find[0], '');
            }
        }
    });

    return modifiedRow;
}

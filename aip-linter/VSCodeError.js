const vscode = require('vscode');
const { Error } = require('./Error');

/**
 * Creates an object that is readable by vscode.Diagnostic.
 */
class VSCodeError {
    /**
     * @param {Error} proto
     * @param {vscode.Range} range
     * @param {Boolean} err
     */
    constructor (proto, range, err) {
        this.proto = proto;
        this.range = range;
        this.err = err;
    }
}

module.exports = {VSCodeError}
const vscode = require('vscode');
const { Error } = require('./Error');

/**
 * Creates an object that is readable by vscode.Diagnostic.
 */
class VSCodeError {
    /**
     * @param {Error} proto
     * @param {vscode.Range} range
     */
    constructor (proto, range) {
        this.proto = proto;
        this.range = range;
    }
}

module.exports = {VSCodeError}
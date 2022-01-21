const vscode = require('vscode')

class Error {
    
    /**
     * @param {number} lineNumber
     * @param {string} reason
     */
    constructor (lineNumber, reason, ruleID, ruleDocURI) {
        this.lineNumber = lineNumber;
        this.reason = reason;
        this.ruleID = ruleID;
        this.ruleDocURI = ruleDocURI
    }

    /**
     * @param {Object} err
     */
    static parseError (err) {
        if (!err) {
            return this.getEmptyError();
        }

        const errorLine = err.location.start_position.line_number;
        const errorReason = err.message;
        const errorRuleID = err.rule_id;
        const errorRuleDocURI = err.rule_doc_uri;
        console.log("[ERROR] Line: " + errorLine + "; reason: " + errorReason)
        let protoError = new Error(errorLine, errorReason, errorRuleID, errorRuleDocURI)
        return protoError
    }

    static getEmptyError () {
        return new Error(0, "", "", "")
    }
}

module.exports = {Error};
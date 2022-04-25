const {Error} = require('./Error')
const {VSCodeError} = require('./VSCodeError') 
const vscode = require('vscode');
const util = require('util');
const fs = require('fs');
var path = require('path')

class AIPLinter {
    
    codeDocument;
    
    /**
     * Constructs a new AIPLinter object and initializes this.codeDocument.
     */
    constructor (document = vscode.window.activeTextEditor.document) {
        this.codeDocument = document;
    }

    /**
     * Runs the active linting process. This is a central function where 
     * errors are returned to, parsed, and returned to the driver function 
     * in extension.js.
     * @returns lintingErrors: the list of all lintingErrors
     */
    async lint () {
        // run lint command and get raw errors
        const result = await this.runLintCommand();
        if (!result) {
            return;
        }
        
        // When errors exist, but no linting errors were returned show the error window
        // in VSCode as it is most likely an issue with the binary itself such as not being
        // able to find a configuration or a file to lint.
        let lintingErrors;
        if (result[1] === "out") {
            // JSON output
            lintingErrors = this.parseWarnings(await result[0]);
        } else {
            lintingErrors = [this.parseErrors(await result[0])]
        }
        return lintingErrors;
    }

    /**
     * This runs the actual api-linter command in a child process. 
     * The command is fetched from checkAIPExists(), and is then 
     * run and the outputs are caught in stdout and stderr.
     * @returns stdout output or stderr output 
     */
    async runLintCommand() {
        if (vscode.workspace.workspaceFolders.length === 0) {
            vscode.window.showInformationMessage("no workspace");
            return "";
        }

        const command = this.checkAIPExists()
        const exec = util.promisify(require('child_process').exec);
        const { stdout, stderr } = await exec(command).catch((err) => {
            return err;
        });
        // The output is given as a key-value pair, where 'err' 
        // represents that stderr is present and 'out' represents stdout.
        if (stderr !== "") {
            return [stderr, "err"];
        }
        return [stdout, "out"]
    }

    /**
     * Searches for the .api-linter.json/yaml file in the 
     * root directory of the project. If not found, an error 
     * is thrown. If found, a command is returned to be 
     * executed by cp.exec.
     * @returns command to be executed 
     */
    checkAIPExists () {
        var apiPath = vscode.workspace.workspaceFolders[0].uri.fsPath + "/.api-linter";
        console.log(apiPath)

        // Check for the .api-linter file in project root. If found, 
        // point to the config file, configure the output of the 
        // command and point to the current .proto file that is open.
        
        // Gets the root of alis.exchange directory so it can be used 
        // in the -I flag in the api-linter command. 
        // The google/proto/.. is appended.
        var pwd = vscode.workspace.workspaceFolders[0].uri.fsPath
        var split_pwd = pwd.split('alis.exchange/')[0]
        
        let command;
        if (fs.existsSync(apiPath + ".json")) {
            command = `api-linter --config ${apiPath}.json --output-format "json" -I ${split_pwd}/alis.exchange/google/proto ${this.codeDocument.uri.fsPath}`  
        } else if (fs.existsSync(apiPath + '.yaml')) {
            command = `api-linter --config ${apiPath}.yaml --output-format "json" -I ${split_pwd}/alis.exchange/google/proto ${this.codeDocument.uri.fsPath}`  
        }
        
        // The .api-linter.json/yaml file not found. If not found, 
        // run with default configuration and show an error message.
        if (!command) {
            vscode.window.showErrorMessage("AIP Linter: Ensure you have .api-linter.json or .api-linter.yaml in the root directory of your project.")
            command = `api-linter --output-format "json" ${this.codeDocument.uri.fsPath}` 
            return command;
        }
        return command;
    }

    /**
     * Parses the raw output of the api-linter command. The output 
     * is in json format and is parsed as 'data'. The code then 
     * iterates through each problem and parses it individually. 
     * The parsed problem is then made into a LinterError which 
     * is added to an array of parsed errors.
     * @param {string} errorStr
     */
    parseWarnings (errorStr) {
        let data = JSON.parse(errorStr)
        let problemsSplit = data[0]["problems"]

        // Iterate through the problems and parse each one and then add it to an array.
        var result = problemsSplit.reduce((errors, obj) => {
            const parsedError = Error.parseError(obj)
            if (!parsedError.reason && !parsedError.ruleDocURI && !parsedError.ruleID) {
                return errors;
            }
            const linterError = new VSCodeError(parsedError, this.codeDocument.lineAt(parsedError.lineNumber -1).range, false)
            return errors.concat(linterError)
        }, []);

        return result;
    }

    /**
     * Parses the raw output of the api-linter command.  
     * The splits the output string and parses it individually. 
     * The parsed problem is then made into a VSCodeError 
     * @param {string} errorStr
     */
     parseErrors (errorStr) {
        let splitSpr = errorStr.split(": ")
        console.log(splitSpr)
        // Include proto tin the regex so that the time is not matched.
        var lineColRegEx = /proto:\d*:\d*/;
        let lineCol = splitSpr[0].match(lineColRegEx)
        var lineNumber = lineCol[0].split(":")[1]
        const errParsed = new Error(Number(lineNumber), splitSpr[1] + ": " + splitSpr[2], "", "")
        const err = new VSCodeError(errParsed, this.codeDocument.lineAt(errParsed.lineNumber -1).range, true)
        console.log(err)
        return err;
    }
}

module.exports = {AIPLinter};
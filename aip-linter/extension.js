module.exports = {
	activate,
	deactivate
}

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const cp = require('child_process');
const {AIPLinter} = require('./AIPLinter')
var path = require('path')
const util = require('util')

const diagnosticCollection = vscode.languages.createDiagnosticCollection("api-linter")

/**
 * This method is called when the extension is activated.
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	
	// check that the api-linter is in the user's PATH  variable by running api-linter --version.
	const exec = util.promisify(require('child_process').exec);
	const {stdout, stderr} = await exec("api-linter --version").catch((err) => {
		return err;
	})

	// Verify that api-linter can be successfully executed on the host machine by running the version command.
  	// In the event the binary cannot be executed, tell the user where to download protolint from.
	const cmdResult = cp.spawnSync('api-linter', ['--version']);
	console.log("cmdResult: ", cmdResult);

	if (stderr) {
		vscode.window.showErrorMessage("The api-linter was not detected in your PATH. Download from: https://linter.aip.dev/");
	}

	// Registers a command that can be invoked via a keyboard shortcut, a menu item, an action, or directly.
	vscode.commands.registerCommand('aip-linter.api-linter', runAPILint)
	
	// Executes demand on the saving of the document.
	vscode.workspace.onDidSaveTextDocument(() => {
		vscode.commands.executeCommand('aip-linter.api-linter');
	});

	// Run the linter when the user changes the file that they are currently viewing
	// so that the lint results show up immediately.
	vscode.window.onDidChangeActiveTextEditor((e) => {
		vscode.commands.executeCommand('aip-linter.api-linter');
	});

	// Run the linter when a new text document is opened.
	vscode.workspace.onDidOpenTextDocument((e) => {
		vscode.commands.executeCommand('aip-linter.api-linter');
	});

	// Run the linter on changes of the text document.
	vscode.workspace.onDidChangeTextDocument((e) => {
		vscode.commands.executeCommand('aip-linter.api-linter');
	});
}

/**
 * this method is called when the extension is deactivated.
 * TODO
 */
function deactivate() {}


/**
 * Function that is run when the command is invoked. 
 * It identifies the editor and the language of the
 * code within the document. It then calls doLint() 
 */
function runAPILint () {
	let editor = vscode.window.activeTextEditor;
	// Check if the active text editor is found.
	if (!editor) {
		vscode.window.showInformationMessage("Editor not detected")
		return;
	}

	// Only run linter on .proto files.
	const doc = editor.document;
	if (doc.languageId !== 'proto3' && doc.languageId !== 'proto') {
		return;
	}

	driveLint(doc, diagnosticCollection); 
}

/**
 * This is the driver of the linting process. 
 * A new new linter instance is created and 
 * linting functions are invoked on that 
 * instance. The linting errors are obtained 
 * and mapped to the appropriate place in the 
 * document.
 * @param {vscode.TextDocument} doc
 * @param {vscode.DiagnosticCollection} collection
 */
async function driveLint(doc, collection) {
	const linter = new AIPLinter(doc);
	const errors = await linter.lint();
	// map the errors detected to new vscode diagnostics which can then be mapped to the editor.
	const diagnostics = errors.map(err => {
		return new vscode.Diagnostic(err.range, err.proto.reason + "\n" + err.proto.ruleID + "\n" + err.proto.ruleDocURI, vscode.DiagnosticSeverity.Warning)
	});
	collection.clear()
	collection.set(doc.uri, diagnostics)
}

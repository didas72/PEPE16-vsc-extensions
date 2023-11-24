import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	let logger = vscode.window.createOutputChannel("PEPE-16 Formatter");
	vscode.languages.registerDocumentFormattingEditProvider('pepe16asm',{
		provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
			logger.appendLine("Formatting file...");

			let changes: vscode.TextEdit[] = [];

			for (let i = 0; i < document.lineCount; i++) {
				let line = document.lineAt(i);
				let text = line.text;
				let commentIdx = text.indexOf(';');

				if (line.isEmptyOrWhitespace) {
					if (text.length !== 0) { //Clear whitespace lines
						logger.appendLine(`Emptying whitespace line. Line: ${i + 1}`);
						changes.push(vscode.TextEdit.delete(line.range));
					}
					continue;
				}

				if (text.charAt(line.firstNonWhitespaceCharacterIndex) === ';') { continue; } //Ignore comments
				
				if (text.endsWith(':')) { //Labels
					if (line.firstNonWhitespaceCharacterIndex !== 0) { //If tabbed
						//Remove tabbing
						logger.appendLine(`Removing label tabbing. Line: ${i + 1}`);
						changes.push(vscode.TextEdit.delete(new vscode.Range(i, 0, i, line.firstNonWhitespaceCharacterIndex)));
					}
					continue;
				}

				//==Other cases should be pseudo or code==
				//Replace leading whitespaces with a single tab
				if (line.firstNonWhitespaceCharacterIndex !== 1 || !text.startsWith('\t')) {
					logger.appendLine(`Correctiong instruction tabbing. Line ${i + 1}`);
					changes.push(vscode.TextEdit.replace(new vscode.Range(i, 0, i, line.firstNonWhitespaceCharacterIndex), '\t'));
				}

				//Strip whitespaces to single space (except if before a comma)
				let whitespaceStartIdx = -1;
				for (let j = line.firstNonWhitespaceCharacterIndex; j < (commentIdx > 0 ? commentIdx : text.length); j++) {
					if (text.charAt(j) === ' ' || text.charAt(j) === '\t') {
						if (whitespaceStartIdx === -1)
						{ whitespaceStartIdx = j; }
					} else {
						if (whitespaceStartIdx !== -1) {
							if (text.charAt(j) === ',') {
								logger.appendLine(`Deleting whitespaces before a comma. Line: ${i + 1} Col: ${whitespaceStartIdx}`);
								changes.push(vscode.TextEdit.delete(new vscode.Range(i, whitespaceStartIdx, i, j)));
							} else if (j - whitespaceStartIdx > 2) {
								logger.appendLine(`Replacing multiple whitespaces with a single space. Line: ${i + 1} Col: ${whitespaceStartIdx}`);
								changes.push(vscode.TextEdit.replace(new vscode.Range(i, whitespaceStartIdx, i, j), ' '));
							}
							whitespaceStartIdx = -1;
						}
					}
				}

				//Ensure a space after commas
				for (let j = line.firstNonWhitespaceCharacterIndex; j < (commentIdx > 0 ? commentIdx : text.length); j++) {
					if (text.charAt(j) === ',' && j + 1 < text.length) {
						if (text.charAt(j + 1) !== ' ' && text.charAt(j + 1) !== '\t') {
							logger.appendLine(`Inserting space after comma. Line: ${i + 1} Col: ${j}`);
							changes.push(vscode.TextEdit.insert(new vscode.Position(i, j + 1), ' '));
						}
					}
				}
			}

			return changes;
		},
	});
}

// This method is called when your extension is deactivated
export function deactivate() {}

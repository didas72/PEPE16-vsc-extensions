import { stringify } from 'querystring';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	//Don't suggest 'raw access' registers (eg: R12, which is SP)
	const registers: string[] = [ 'R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'RL', 'SP', 'RE', 'BTE', 'TEMP' ];
	const opcodesRegArgd: string[] = [ 'ADD', 'ADDC', 'SUB', 'SUBB', 'CMP', 'MUL', 'DIV', 'MOD', 'NEG', 'AND', 'OR', 'NOT', 'XOR', 'TEST', 'BIT',
		'SET', 'EI', 'EI0', 'EI1', 'EI2', 'EI3', 'SETC', 'EDMA', 'CLR', 'DI', 'DI0', 'DI1', 'DI2', 'DI3', 'CLRC', 'DDMA', 'CPL', 'CPLC',
		'SHR', 'SHL', 'SHRA', 'SHLA', 'ROR', 'ROL', 'RORC', 'ROLC', 'MOV', 'MOVB', 'MOVP', 'SWAP', 'PUSH', 'POP',
		'JMP', 'CALL', 'CALLF' ];
	const opcodesNRegArgd: string[] = [ 'JZ', 'JNZ', 'JN', 'JNN', 'JP', 'JNP', 'JC', 'JNC', 'JV', 'JNV', 'JA', 'JNA', 'JEQ', 'JNE', 'JLT', 'JLE',
		'JGT', 'JGE', 'JMP', 'CALL', 'CALLF', 'RET', 'RETF', 'SWE', 'RFE', 'NOP' ];
	const pseudoOps: string[] = [ 'EQU', 'PLACE', 'WORD', 'BYTE', 'TABLE', 'STACK', 'PROCESS', 'YIELD', 'WAIT', 'LOCK' ];
	const commitChars: string[] = ['\t', '\n'];

	const genericProvider = vscode.languages.registerCompletionItemProvider('pepe16asm', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.CompletionItem[] {
			//Only do full suggestions if 'empty' line
			let line = document.lineAt(position.line);
			if (line.text.includes(' ', line.firstNonWhitespaceCharacterIndex))
			{
				return [];
			}
			
			let completions: vscode.CompletionItem[] = [];

			for (let i = 0; i < registers.length; i++) {
				let cItem = new vscode.CompletionItem(registers[i]);
				cItem.commitCharacters = commitChars;
				cItem.sortText = 'zzz' + String.fromCharCode('a'.charCodeAt(0) + i);
				completions.push(cItem);
			}

			for (let i = 0; i < opcodesRegArgd.length; i++) {
				let cItem = new vscode.CompletionItem(opcodesRegArgd[i] + ' ');
				cItem.commitCharacters = commitChars;
				cItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
				cItem.keepWhitespace = true;
				completions.push(cItem);
			}

			for (let i = 0; i < opcodesNRegArgd.length; i++) {
				let cItem = new vscode.CompletionItem(opcodesNRegArgd[i]);
				cItem.commitCharacters = commitChars;
				completions.push(cItem);
			}

			for (let i = 0; i < pseudoOps.length; i++) {
				let cItem = new vscode.CompletionItem(pseudoOps[i] + ' ');
				cItem.commitCharacters = commitChars;
				cItem.keepWhitespace = true;
				completions.push(cItem);
			}

			return completions;
		}
	});

	const regArgumentProvider = vscode.languages.registerCompletionItemProvider("pepe16asm", {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.CompletionItem[] {
			let completions: vscode.CompletionItem[] = [];

			for (let i = 0; i < registers.length; i++) {
				let cItem = new vscode.CompletionItem(registers[i]);
				cItem.commitCharacters = commitChars;
				cItem.sortText = 'zzz' + String.fromCharCode('a'.charCodeAt(0) + i);
				completions.push(cItem);
			}

			return completions;
		}
	}, ",");

	const definedLabelProvider = vscode.languages.registerCompletionItemProvider("pepe16asm", {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.CompletionItem[] {
			let completions: vscode.CompletionItem[] = [];

			for (let i = 0; i < document.lineCount; i++) //Searching whole document is probably very slow
			{
				let line = document.lineAt(i);
				let colonIdx = line.text.indexOf(':');
				if (colonIdx === -1) { continue; } //Ignore lines without colons
				let commentIdx = line.text.indexOf(';');
				if (commentIdx === -1 || commentIdx > colonIdx)
				{
					let cItem = new vscode.CompletionItem(line.text.slice(line.firstNonWhitespaceCharacterIndex, colonIdx));
					cItem.commitCharacters = commitChars;
					completions.push(cItem);
				}
			}

			return completions;
		}
	}, ",");

	context.subscriptions.push(genericProvider, regArgumentProvider, definedLabelProvider);
}

export function deactivate() {}

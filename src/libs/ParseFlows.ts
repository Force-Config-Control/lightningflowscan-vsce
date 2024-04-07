import * as vscode from "vscode";
import {XMLParser} from "./XMLParser";
import * as fs from "mz/fs";
import path = require("path");
import {Flow} from "lightning-flow-scanner-core/out/index";


export class ParseFlows {

    public async execute(selectedFlowUris: vscode.Uri[]) {
        const flows: Flow[] = await this.parseFlows(selectedFlowUris);
        return flows;
    }

    private async parseFlows(selectedUris: vscode.Uri[]) {

        let parsedFlows = [];
        for (let uri of selectedUris) {
            try{
                const parsedContent: { Flow: Flow } = await new XMLParser().execute(await fs.readFile(path.normalize(uri.fsPath ? uri.fsPath : uri.path)));
                parsedFlows.push(new Flow(
                    {
                        path: uri.fsPath,
                        xmldata: parsedContent
                    }));
            } catch (e) {
                vscode.window.showInformationMessage(e.name + ' ' + uri);
            }
        }
        return parsedFlows;
    }
}

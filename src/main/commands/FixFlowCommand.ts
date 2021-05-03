import * as vscode from "vscode";
import {SelectAFlow} from "../libs/SelectAFlow";
import {BaseCommand} from "./BaseCommand";
import {BuildNewFlow} from "../libs/BuildNewFlow";
import {SaveFlow} from "../libs/SaveFlow";
import {UnconnectedElements} from "../rules/UnconnectedElements";
import {UnusedVariables} from "../rules/UnusedVariables";
import Flow = require("../models/Flow");
import {FixReport} from "../panels/FixReport";
import {FindFlowMetadata} from "../libs/FindFlowMetadata";

export class FixFlowCommand extends BaseCommand {

    constructor(context: vscode.ExtensionContext
    ) {
        super(context)
    }

    public async execute() {
        const selectedFlow: Flow = await new SelectAFlow(this.rootPath, 'Select a Flow to clean:').execute(this.rootPath);
        selectedFlow.flowMetadata = new FindFlowMetadata().execute(selectedFlow);
        selectedFlow.unusedVariables = new UnusedVariables().execute(selectedFlow);
        selectedFlow.unconnectedElements = new UnconnectedElements().execute(selectedFlow);
        selectedFlow.processedData = new BuildNewFlow().execute(selectedFlow);
        const result = await new SaveFlow().execute(selectedFlow, selectedFlow.uri);
        if (result) {
            FixReport.createOrShow(this.context.extensionUri, selectedFlow);
        }
    }

}
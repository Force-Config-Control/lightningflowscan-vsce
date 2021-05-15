import Flow = require("../models/Flow");
import FlowElement = require("../models/FlowElement");
import FlowElementConnector = require("../models/FlowElementConnector");

export class DuplicateDMLOperationsByNavigation {

    public execute(flow: Flow) {

        const dmlStatementTypes = ['recordLookups', 'recordDeletes', 'recordUpdates', 'recordCreates'];
        const flowElements: FlowElement[] = flow.nodes.filter(node => node instanceof FlowElement) as FlowElement[];
        const screenElements: FlowElement[] = flow.nodes.filter(node => node.subtype === 'screens') as FlowElement[];
        const duplicateDMLOperationsByNavigation: FlowElement[] = [];

        for (const element of screenElements) {
            let startIndex;
            let indexesToProcess: number [];

            const connector: FlowElementConnector = this.findStartReference(element);
            if(connector && connector.reference){
                startIndex = flowElements.findIndex(element => element.name === connector.reference);
                indexesToProcess = [startIndex];
            }

            let processedElementIndexes: number[] = [];
            let unconnectedElementIndexes: number[] = [];
            let dmlBeforeNextScreen: number[] = [];

            if(!indexesToProcess){
                continue;
            }
            do {
                indexesToProcess = indexesToProcess.filter(index => !processedElementIndexes.includes(index));
                if (indexesToProcess.length > 0) {
                    for (const [index, element] of flowElements.entries()) {
                        if (indexesToProcess.includes(index)) {
                            let connectors = [];
                            for (let connector of element.connectors) {
                                if (connector.reference) {
                                    connectors.push(connector);
                                }
                            }
                            if(dmlStatementTypes.includes(element.subtype)) {
                                dmlBeforeNextScreen.push(index);
                            }
                            if (connectors.length > 0) {
                                let elementsByReferences = flowElements.filter(element => connectors.map(c => c.reference).includes(element.name));
                                for (let nextElement of elementsByReferences) {
                                    let nextIndex = flowElements.findIndex(element => nextElement.name === element.name);
                                    if("screens" === nextElement.subtype){
                                    //    todo check if nextelement has previous
                                        // @ts-ignore
                                        const test = nextElement.element.allowBack[0];
                                        // @ts-ignore
                                        if (dmlBeforeNextScreen.length > 0 && nextElement.element.allowBack && nextElement.element.allowBack[0] == "true"){
                                            duplicateDMLOperationsByNavigation.push(nextElement);
                                        }
                                    } else if (!processedElementIndexes.includes(nextIndex)){
                                        indexesToProcess.push(nextIndex);
                                    }
                                }
                            }
                            processedElementIndexes.push(index);
                        }
                    }
                } else {
                    for (const index of flowElements.keys()) {
                        if (!processedElementIndexes.includes(index)) {
                            unconnectedElementIndexes.push(index);
                            unconnectedElementIndexes.push(index);
                        }
                    }
                }
            } while ((processedElementIndexes.length + unconnectedElementIndexes.length) < flowElements.length);
        }
        return duplicateDMLOperationsByNavigation;
    }

    private findStartReference(element: FlowElement) {
        return element.connectors.find(el => el.type === 'connector');
    }

}
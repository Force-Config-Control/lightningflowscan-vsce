import "mocha";
import * as assert from "assert";
import Flow = require("../../main/Models/Flow");
import {CleanFlow} from "../../main/libs/CleanFlow";
import mainwithaddvars = require("./testfiles/main-add-vars-example.json");

describe("When there are any unused variables",async function () {
    let mainFlow;

    before("A",  async function () {

        // ARRANGE
        mainFlow = new Flow({
            label: 'main',
            path: 'anypath',
            xmldata : mainwithaddvars,
            detail: 'anypath'
        });
    });
    it("A new flow is returned excluding these unused variables", async function () {

        // ACT
        let result = new CleanFlow().execute(mainFlow);

        // ASSERT
        assert.strictEqual(result.xmldata.Flow.variables.length,3);
    });
});
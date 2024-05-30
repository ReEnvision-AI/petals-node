var helper = require("node-red-node-test-helper");
var petalsNode = require("../petals-node.js")

describe('petals Node', function() {
    
    afterEach(function() {
        helper.unload();
    });

    it('should be loaded', function(done) {
        var flow = [{id: "n1", type: "petals"}];
        helper.load(petalsNode, flow, function() {
            var n1 = helper.getNode("n1")
            n1.should.have.property('model', 'auto');
            done();
        })
    })
})
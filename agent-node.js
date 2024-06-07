module.exports = function(RED) {
    function Agent(config){
        RED.nodes.createNode(this, config);
        this.goal = config.goal
        this.backstory = config.backstory
        this.name = config.name
        var node = this;
        node.on('input', function(msg, send, done){
            msg.agent = new Object()
            msg.agent.name = node.name
            msg.agent.goal = node.goal
            msg.agent.backstory = node.backstory
            send(msg)
            done()
        });
    }

    RED.nodes.registerType("agent", Agent)
}
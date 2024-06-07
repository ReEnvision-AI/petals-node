module.exports = function(RED) {
    function Task(config){
        RED.nodes.createNode(this, config);
        this.description = config.description
        this.expected_output = config.expected_output
        var node = this;
        node.on('input', function(msg, send, done){
            msg.task = new Object()
            msg.task.description = node.description
            msg.task.expected_output = node.expected_output
            send(msg)
            done()
        });
    }
    RED.nodes.registerType("task", Task)
}
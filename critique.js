module.exports = function(RED) {
    function Critique(config){
        RED.nodes.createNode(this, config);

        this.task = config.prompt
        this.max_revisions = config.max_revisions

        var node = this;
        node.on('start', function() {
            this.status({})
        });

        node.on('stop', function() {
            this.status({})
        })
        node.on('input', async function(msg, send, done){

            // set initial status
            this.status({fill:"blue",shape:"ring",text:"critiquing..."});

            const REFLECTION_PROMPT = "You are a teacher grading an essay submission. \
            Generate critique and recommendations for the user's submission. \
            Provide detailed recommendations, including requests for length, depth, style, etc."

            let state = new Object()
            state.timestamp = Date.now()

            let content = msg.values.draft

            let messages = [
                { 'role': 'system', 'content': REFLECTION_PROMPT},
                { 'role': 'user', 'content': content}
            ];

            var ol = await import('ollama')

            const ollama = new ol.Ollama()

            let response = await ollama.chat({
                model: this.context().flow.get('model'),
                messages: messages,
            });

            let critique = response.message.content
            msg.values.critique = critique
            msg.values.count = msg.values.count + 1

            state.lnode = "critique"
            state.values = JSON.parse(JSON.stringify(msg.values))

            msg.statesnapshots.push(state)

            send(msg)
            this.status({fill:"green",shape:"dot",text:"done"});
            done();
        });
    }
    RED.nodes.registerType("critique", Critique)
}
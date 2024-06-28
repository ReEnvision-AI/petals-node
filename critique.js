module.exports = function(RED) {
    function Critique(config){
        RED.nodes.createNode(this, config);

        this.memory = new Map();

        var node = this;
        node.on('start', function() {
            this.status({})
        });

        node.on('stop', function() {
            this.status({})
        })

        node.on('input', async function(msg, send, done){

            let session_id = ''
            if (msg.payload.session_id) {
                session_id = msg.payload.session_id
            } else {
                const uuid = await import('uuid');
                session_id = uuid.v4();
                msg.payload.session_id = session_id;
            }
            // set initial status
            this.status({fill:"blue",shape:"ring",text:"critiquing..."});

            const REFLECTION_PROMPT = "You are a teacher grading an essay submission. \
            Generate critique and recommendations for the user's submission. \
            Provide detailed recommendations, including requests for length, depth, style, etc. Do not provide a letter grade or numeric score."

            const RE_REFLECTION_PROMPT = "You are a teacher grading the essay that has been resubmitted. Using the previous critique and the new draft of the essay \
            generate critique and recommendations for the user's submission.\
            Provide detailed recommendations, including what has improved and what still needs improving. Provide requests for length, depth, style, etc. \
            Do not provide a letter grade nor a numeric score."

            let draft = msg.payload.draft

            let messages = [];
            
            if (node.memory.get(session_id)) {
                messages = node.memory.get(session_id).messages
                messages.push(
                    { 'role': 'system', 'content': REFLECTION_PROMPT}
                );
            } else {
                messages.push(
                    {'role': 'system', 'content': RE_REFLECTION_PROMPT}
                )
            }

            
            messages.push(
                { 'role': 'user', 'content': draft}
            );

            var ol = await import('ollama')

            const ollama = new ol.Ollama()

            let response = await ollama.chat({
                model: 'llama3',
                messages: messages,
            });
            messages.push(response.message)

            let critique = response.message.content

            msg.payload.critique = critique;
            msg.payload.created = Date.now();

            send(msg)
            this.status({fill:"green",shape:"dot",text:"done"});

            node.memory.set(session_id, {messages: messages, lastUpdated: Date.now()})

            done();
        });
    }
    RED.nodes.registerType("critique", Critique)
}
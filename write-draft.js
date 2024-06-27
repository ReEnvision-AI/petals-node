module.exports = function(RED) {
    function Write(config){
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
            this.status({fill:"blue",shape:"ring",text:"writing..."});

            let state = new Object()
            state.timestamp = Date.now()

            let content = msg.values.content.join("\n\n")


            const WRITER_PROMPT = `You are an essay assistant tasked with writing excellent 5-paragraph essays.\
            Generate the best essay possible for the user's request and the initial plan. \
            If the user provides critique, respond with a revised version of your previous attempts. \
            Utilize all the information below as needed: \n \
            \n \
            ------\n  \
            \n \
            ${content}`

            let user_content = `${msg.values.task}\n\nHere is my plan:\n\n${msg.values.plan}`

            let user_message = {'role': 'user', 'content': user_content}

            let messages = [
                {'role': 'system', 'content': WRITER_PROMPT},
                user_message,
            ]

            var ol = await import('ollama')

            const ollama = new ol.Ollama()

            let response = await ollama.chat({
                model: this.context().flow.get('model'),
                messages: messages,
                temperature: 0.3,
            })

            response = response.message.content

            msg.values.draft = response
            msg.values.revision_number = msg.values.revision_number + 1
            msg.values.count = msg.values.count + 1
            state.lnode = "generate"
            state.values = JSON.parse(JSON.stringify(msg.values))

            msg.statesnapshots.push(state)

            if (msg.values.revision_number > msg.values.max_revisions) {
                send([msg, null])
            }
            else {
                send([null, msg])
            }

            this.status({fill:"green",shape:"dot",text:"done"});
            done();

        });
    }
    RED.nodes.registerType("write-draft", Write)
}
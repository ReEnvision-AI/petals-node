module.exports = function(RED) {
    function Write(config){
        RED.nodes.createNode(this, config);

        this.task = config.prompt
        this.max_revisions = config.max_revisions

        this.memory = new Map();

        var node = this;
        node.on('start', function() {
            node.status({})
        });

        node.on('stop', function() {
            node.memory.clear()
            node.status({})
        })
        node.on('input', async function(msg, send, done){

            // set initial status
            this.status({fill:"blue",shape:"ring",text:"writing..."});

            let content = msg.payload.content.join("\n\n")
            let task = msg.payload.prompt
            let plan = msg.payload.plan
            
            let session_id = ''
            if (msg.payload.session_id) {
                session_id = msg.payload.session_id
            } else {
                const uuid = await import('uuid');
                session_id = uuid.v4();
                msg.payload.session_id = session_id;
            }


            const WRITER_PROMPT = `You are an essay assistant tasked with writing excellent 5-paragraph essays. \
            The essay starts with 1 introductory paragraph. The introductory paragraph should contain a thesis \
            that cleary communicates what the entire essay is about. The introductory paragraph is also a good \
            spot to include any background context for the topic. \ After the introductory paragraph, there are \
            3 body paragraphys. In the body paragraphs, describe details, share evidence, and explain reasoning \
            to advance the thesis. The final paragraph is a concluding paragraph. In the final paragraph, you \
            wont' add any new evidence or support; instead summarize the points from the previous paragraphs and \
            tie them together. Restate the thesis so that the reader is convinced.
            Generate the best essay possible for the user's request and the initial plan. \
            If the user provides critique, respond with a revised version of your previous attempts. \
            Utilize all the information below as needed: \n \
            \n \
            ------\n  \
            \n \
            ${content}`

            let messages = []

            if (node.memory.get(session_id)) {
                messages = node.memory.get(session_id).messages
                messages.push({'role': 'user', 'content': `Re-write the essay and include this additional content. Ensure that the essay still conforms to the 5 paragraph specification originally given.\n\n${content}`})
            } else {
                let user_content = `Here is the essay topic:${task}\n\nHere is the initial plan:\n\n${plan}`

                let user_message = {'role': 'user', 'content': user_content}
    
                
                messages.push({'role': 'system', 'content': WRITER_PROMPT})
                messages.push(user_message)

                msg.payload.max_revisions = 2;
                msg.payload.revision = 0;
            }

            var ol = await import('ollama')

            const ollama = new ol.Ollama()

            let response = await ollama.chat({
                model: 'llama3',
                messages: messages,
                temperature: 0.3,
            })

            messages.push(response.message)
            let draft = response.message.content
            
            msg.payload.draft = draft;
            msg.payload.created = Date.now();
            msg.payload.revision = msg.payload.revision + 1;


            send(msg)

            this.status({fill:"green",shape:"dot",text:"done"});

            node.memory.set(session_id, {messages: messages, lastUpdated: Date.now()})
            done();

        });
    }
    RED.nodes.registerType("write-draft", Write)
}
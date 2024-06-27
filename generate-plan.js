const DEFAULT_TASK = "What is the meaning of life?"

module.exports = function(RED) {
    function Generate(config){
        RED.nodes.createNode(this, config);

        //this.task = config.prompt
        //this.max_revisions = config.max_revisions

        var node = this;
        node.on('input', async function(msg, send, done){
            // set initial status
            this.status({fill:"blue",shape:"ring",text:"generating plan..."});

            const PLAN_PROMPT = "You are an expert writer tasked with writing a high level outline of an essay. \
            Write such an outline for the user provided topic. Give an outline of the essay along with any relevant notes \
            or instructions for the sections."
            if (!msg.values) {
                msg.values = new Object()
                msg.values.max_revisions = 2
                msg.values.task = DEFAULT_TASK
            }
            let state = new Object()
            state.timestamp = Date.now()

            msg.values.revision_number = 0;
            msg.values.count = 0;
            msg.statesnapshots = [];

            let messages = [ {'role': 'system', 'content': PLAN_PROMPT}]
            messages.push(
                    {'role': 'user', 'content': msg.values.task}
            );

            var ol = await import('ollama')

            const ollama = new ol.Ollama()

            if (! this.context().flow.get('model')){
                this.context().flow.set('model', 'llama3')
            }

            const response = await ollama.chat({
                model: this.context().flow.get('model'),
                messages: messages,
                temperature: 0,
            })

            let plan = response.message.content

            state.lnode = "planner" 
            msg.values.plan = plan
            msg.values.count = msg.values.count + 1
            state.values = JSON.parse(JSON.stringify(msg.values))
            msg.statesnapshots.push(state)

            //return msg;
            send(msg);
            this.status({fill:"green",shape:"dot",text:"done"});
            done();

        });
    }
    RED.nodes.registerType("generate-plan", Generate)
};
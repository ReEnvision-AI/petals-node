module.exports = function(RED) {
    function Research(config){
        RED.nodes.createNode(this, config);

        this.task = config.prompt
        this.max_revisions = config.max_revisions

        var node = this;
        node.on('input', async function(msg, send, done){

            // set initial status
            this.status({fill:"blue",shape:"ring",text:"researching..."});

            const RESEARCH_PLAN_PROMPT = "You are a researcher charged with providing information that can \
            be used when writing the following essay. Generate a list of search queries that will gather \
            any relevant information. Only generate exactly 3 queries.  Your responses MUST be valid JSON ONLY with no additional narrative or markup, backquotes or anything and follow the following schema:\n \
            {\n \
                'search_queries': \n \
                    [ \n \
                        <query1>, \n \
                        <query2>, \n \
                        <query3>, \n \
                    ] \n \
            }"
            let state = new Object()
            state.timestamp = Date.now()

            let messages = []
            messages.push(
                {'role': 'system', 'content': RESEARCH_PLAN_PROMPT}
            );
            messages.push(
                {'role': 'user', 'content': msg.values.task}
            );

            var ol = await import('ollama')

            const ollama = new ol.Ollama()

            const response = await ollama.chat({
                model: this.context().flow.get('model'),
                messages: messages,
                format: 'json',
                temperature: 0,
            })

            let queries = JSON.parse(response.message.content)['search_queries']

            var content = []

            if (msg.values.content && msg.values.content.length > 0) {
                content = msg.values.content
            }

            var f = await import('fetch')

            for (let i in queries) {
                const raw = JSON.stringify({
                    "api_key": "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",
                    "query": queries[i],
                    "max_results": 2
                });

                const requestOptions = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: raw,
                    redirect: "follow"
                };

                let response = await fetch("https://api.tavily.com/search", requestOptions)
                let result = await response.json()
                for (let r in result['results']) {
                    let x = result['results'][r]['content']
                    x = x.replace(/(\r\n|\n|\r)/gm, "");
                    content.push(x)
                }
            }
            state.lnode = "research"
            msg.values.content = content
            msg.values.count = msg.values.count + 1
            state.values = JSON.parse(JSON.stringify(msg.values))
            msg.statesnapshots.push(state)
            msg.messages = messages

            send(msg);
            this.status({fill:"green",shape:"dot",text:"done"});
            done();

        });
    }
    RED.nodes.registerType("research-content", Research)
}
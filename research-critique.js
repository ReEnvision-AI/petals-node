module.exports = function(RED) {
    function Research(config){
        RED.nodes.createNode(this, config);


        var node = this;
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
            this.status({fill:"blue",shape:"ring",text:"researching..."});

            const RESEARCH_CRITIQUE_PROMPT = "You are a researcher charged with providing information that can \
            be used when making any requested revisions (as outlined below). \
            Generate a list of search queries that will gather any relevant information. Only generate 3 queries max. Output in structured and correct JSON as follows: \
            { \n \
                'search_queries': [ \n \
                    <query 1>, \n \
                    <query 2>, \n \
                    <query 3>, \n \
                ] \n \
            }"


            let critique = msg.payload.critique

            let messages = []

            messages.push(
                {'role': 'system', 'content': RESEARCH_CRITIQUE_PROMPT}
            );
            messages.push(
                {'role': 'user', 'content': critique}
            );

            var ol = await import('ollama')

            const ollama = new ol.Ollama()

            const response = await ollama.chat({
                model: 'llama3',
                messages: messages,
                format: 'json',
                temperature: 0,
            })

            messages.push(response.message)

            let queries = JSON.parse(response.message.content)['search_queries']

            var content = []

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

            msg.payload.content = content
            msg.payload.created = Date.now()

            send(msg);
            this.status({fill:"green",shape:"dot",text:"done"});

            done();

        });
    }
    RED.nodes.registerType("research-critique", Research)
}
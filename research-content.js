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

            let prompt = msg.payload.prompt
            let plan = msg.payload.plan

            let messages = []

            messages.push(
                {'role': 'system', 'content': RESEARCH_PLAN_PROMPT}
            );
            messages.push(
                {'role': 'user', 'content': prompt}
            );

            var ol = await import('ollama')

            var dotenv = await import('dotenv')
            dotenv.config()

            const API_KEY = process.env.TAVILY_API_KEY

            const ollama = new ol.Ollama()

            const response = await ollama.chat({
                model: 'llama3',
                messages: messages,
                format: 'json',
                temperature: 0,
            })

            messages.push(response.message)

            let queries = JSON.parse(response.message.content)['search_queries']

            let content = []



            var f = await import('fetch')

            for (let i in queries) {
                const raw = JSON.stringify({
                    "api_key": TAVILY_API_KEY,
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
    RED.nodes.registerType("research-content", Research)
}
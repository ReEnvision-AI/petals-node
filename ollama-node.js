module.exports = function(RED) {

    function parseResponse(result, send, done, msg, node) {
        node.status({fill: "green", shape: "dot", text: "generated"})
        console.log(result);
        result = JSON.parse(result)
        result = result['choices'][0]['message']['content']
        msg.payload = result;
        send(msg);
        done();
    }

    function parsePayload(msg) {
        let payload = ""
        if (msg.agent) {
            payload += "You are " + msg.agent.name + "\n"
            payload += msg.agent.backstory + "\n"
            payload += "Your personal goal is: " + msg.agent.goal + "\n"
        }

        if (msg.task) {
            payload += "Current task: " + msg.task.description + "\n"
            payload += "This is the expected criteria for your final answer: " + msg.task.expected_output + "\n"
            payload += "\nyou MUST return the actual complete content as the final answer, not a summary.\n\nBegin! This is VERY important to you, use the tools available and give your best Final Answer, your job depends on it!\n\n"
        }

        if (msg.instructions) {
            payload += "Instructions" + msg.instructions + "\n"
        }

        if (msg.code) {
            payload += "Code: " + msg.code + "\n"
        }

        if (msg.payload) {
            payload += "Insights: " + msg.payload + "\n"
        }
        console.log(payload)
        return payload
    }

    // Ollama node constructor
    function Ollama(config) {
        RED.nodes.createNode(this, config);
        this.model = config.model
        this.max_tokens = config.max_tokens
        this.stream = config.stream
        
        this.url = "http://localhost"
        this.port = "11434"
        this.baseurl = this.url + ":" + this.port + "/v1";

        var openai;
        import('openai').then((oai) => {
            openai = new oai.OpenAI({
                baseURL: this.baseurl,
    
                apiKey: "ollama" //Necessary but ignored
            })
        })

        var node = this;
        node.on('input', async function(msg, send, done) {
            console.log(msg)
            send = send || function() { node.send.apply(node, arguments)}

            node.status({})
            let payload = ""
            if (node.stream) {
                const stream = await openai.chat.completions.create({
                    model: node.model,
                    messages: [{role: 'user', content: parsePayload(msg)}],
                    stream: true,
                });
                for await (const chunk of stream) {
                    const newChunk = chunk.choices[0]?.delta?.content || '';
                    payload += newChunk
                }
            } else {
                const chatComplete = await openai.chat.completions.create({
                    model: node.model,
                    messages: [{role: 'user', content: parsePayload(msg)}],
                    stream: false,
                });

                payload = chatComplete.choices[0].message.content
            }

            node.status({fill: "green", shape: "dot", text: "generated"})
            msg.payload = payload
            send(msg)
            done()
        });
    }

    RED.nodes.registerType("ollama", Ollama)
}
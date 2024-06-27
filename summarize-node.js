module.exports = function(RED) {
    function Summarize(config){
        RED.nodes.createNode(this, config);
        //this.description = config.description
        //this.expected_output = config.expected_output

        var node = this;
        node.on('input', async function(msg, send, done){
            
            //msg.tool = new Object()
            //msg.task.description = node.description
            //msg.task.expected_output = node.expected_output
            this.url = "http://localhost"
            this.port = "11434"
            this.baseurl = this.url + ":" + this.port + "/v1";

            let raw = msg.raw

            var openai;
            import('openai').then((oai) => {
                openai = new oai.OpenAI({
                    baseURL: this.baseurl,
        
                    apiKey: "ollama" //Necessary but ignored
                })
            })

            const stream = await openai.chat.completions.create({
                model: node.model,
                messages: [{role: 'user', content: ''}],
                stream: true,
            });
            for await (const chunk of stream) {
                const newChunk = chunk.choices[0]?.delta?.content || '';
                payload += newChunk
            }
            
        });
    }
    RED.nodes.registerType("summarize", Summarize)
}
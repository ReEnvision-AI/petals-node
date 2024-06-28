const DEFAULT_TASK = "What is the meaning of life?"

async function load_model(model_name, ollama) {
    console.log(`downloading ${model_name}...`)

    let currentDigestDone = false
    const stream = await ollama.pull({model: model_name, stream: true})
    for await (const part of stream) {
        if(part.digest) {
            let percent = 0
            if (part.completed && part.total) {
                percent = Math.round((part.completed / part.total) * 100)
            }
            process.stdout.clearLine(0) // Clear the current line
            process.stdout.cursorTo(0) // Move cursor to the beginning of the line
            process.stdout.write(`${part.status} ${percent}%...`)
            if (percent === 100 && !currentDigestDone) {
                console.log()
                currentDigestDone = true
            } else {
                currentDigestDone = false
            }
        } else {
            console.log(part.status)
        }
    }
}

module.exports = function(RED) {
    function Generate(config){
        RED.nodes.createNode(this, config);


        var node = this;
        node.on('start', async function(){
        })
        node.on('input', async function(msg, send, done){
            // set initial status
            this.status({fill:"blue",shape:"ring",text:"generating first plan..."});

            let session_id = ''
            if (msg.payload.session_id) {
                session_id = msg.payload.session_id
            } else {
                const uuid = await import('uuid');
                session_id = uuid.v4();
                msg.payload.session_id = session_id;
            }


            const PLAN_PROMPT = "You are an expert writer tasked with writing a high level outline of a 5 paragraph essay. \
            Write such an outline for the user provided topic. Give an outline of the essay along with any relevant notes \
            or instructions for the sections."

            let prompt = msg.payload.prompt

            let messages = []
            
            messages.push({'role': 'system', 'content': PLAN_PROMPT});
            messages.push(
                    {'role': 'user', 'content': prompt}
            );


            let model = 'llama3'

            var ol = await import('ollama')

            const ollama = new ol.Ollama()

            load_model(model, ollama)


            let response = await ollama.chat({
                model: model,
                messages: messages,
                temperature: 0,
            })

            messages.push(response.message);

            let plan = response.message.content

            msg.payload.plan = plan
            msg.payload.created = Date.now()
            send(msg);
            this.status({fill:"green",shape:"dot",text:"done"});
            done();

        });
    }
    RED.nodes.registerType("generate-plan", Generate)
};
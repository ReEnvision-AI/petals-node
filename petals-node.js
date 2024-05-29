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

    // Petals node constructor
    function Petals(config) {
        RED.nodes.createNode(this, config);
        this.model = config.model
        this.max_tokens = config.max_tokens
        this.stream = config.stream
        var node = this;
        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node, arguments)}

            node.status({})
            
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");

            const raw = JSON.stringify({
            "model": node.model,
            "messages": [
                {
                "role": "user",
                "content": msg.payload
                }
            ],
            "temperature": 0.6,
            "top_p": 0.9,
            "max_tokens": node.max_tokens,
            "stream": false //node.stream
            });

            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: raw,
                redirect: "follow"
            };
            console.log(requestOptions)
            
            node.status({fill:"yellow", shape: "dot", text:"generating"})

            fetch("http://127.0.0.1:5000/v1/chat/completions/", requestOptions)
            .then((response) => response.text())
            .then((result) => parseResponse(result, send, done, msg, node))
            .catch((error) => { node.error(error); node.status({fill: "red", shape: "dot", text: "error"});});

            //doSomeAsyncWork(msg, function(result) {
            //    msg.payload = result;
            //    node.send(msg);
            //    node.done();
            //});
            
            return;
        });
    }

    RED.nodes.registerType("petals", Petals)
}
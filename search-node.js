module.exports = function(RED) {
    function Search(config){
        RED.nodes.createNode(this, config);
        //this.description = config.description
        //this.expected_output = config.expected_output

        var node = this;
        node.on('input', function(msg, send, done){
            
            msg.tool = new Object()
            //msg.task.description = node.description
            //msg.task.expected_output = node.expected_output
            search_query = msg.search_query
            const request = require('request');
            let options = {
                'method': 'POST',
                'url': 'https://google.serper.dev/search',
                'headers': {
                    'X-API-KEY': '8114e28d0138cf68209afaaf660fc187beacafd4',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "q": search_query
                })
            };

            request(options, (error, response) => {
                if (error) throw new Error(error);
                //console.log(response.body);
                msg.search_result = response.body
                send(msg)
                done()
            });

            
        });
    }
    RED.nodes.registerType("search", Search)
}
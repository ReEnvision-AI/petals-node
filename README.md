# petals-node

## Instructions

### Clone the repo
```
git clone git@github.com:ReEnvision-AI/petals-node.git
```
### Add your API Tokens
Make a copy of `.env.example` and rename it to `.env`

Add the keys (currently [Tavily](https://tavily.com/) and [Serper](https://serper.dev/))

### Add to the Node Red installation
In your node-red user directory, typically `~/.node-red` run:
```
cd ~/.node-red
npm install <location of petals-node directory>
```

### Start/re-start Node Red
The Petals node will appear as the single node in the "ReEnvision AI" palatte 

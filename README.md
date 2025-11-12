### Based on solana-example repo https://github.com/subsquid-labs/solana-example

## Getting started

### Run indexer

```bash
#  Install dependencies and build
npm install

# Fill the environment variables
cp .env.example .env

# Create db container
npm run db:up

# Apply database migrations to create the target schema
npm run db:apply

# Build the application
npm run build

# Run indexer
npm run start

# Generate ABI from IDL
npx squid-solana-typegen src/abi src/abi/trepa/trepa.json

# Get blockheight by slot number use:
curl --request POST --url https://api.devnet.solana.com --header 'accept: application/json' --header 'content-type: application/json' --data '{"id": 1, "jsonrpc": "2.0", "method": "getBlock", "params": [402354762, {"encoding": "jsonParsed", "maxSupportedTransactionVersion": 0}]}' | jq | grep blockHeight
```

For further details, please check [main.ts](./src/main.ts). 

For even more details, see [Solana Indexing Docs](https://docs.subsquid.io/solana-indexing/)

## About SDK

Subsquid SDK is a TypeScript ETL toolkit for blockchain data, that currently supports

* Ethereum and everything Ethereum-like
* [Substrate](https://substrate.io)-based chains
* Solana.

Subsquid SDK stands apart from the competition by

* Being a toolkit (rather than an indexing app like TheGraph or Ponder)
* Fast binary data codecs and type-safe access to decoded data  
* Native support for sourcing the data from Subsquid Network.

The latter is a key point, as Subsquid Network is a decentralized data lake and query engine, 
that allows to granularly select and stream subset of block data to lightweight clients 
while providing game changing performance over traditional RPC API.

## Decoding binary data

`@subsquid/borsh` package allows to easily define fast and type-safe codec for any Solana data structure.

In the future we plan to develop robust code generation tools, 
that would allow to create all relevant definitions from IDL files automatically.

## Disclaimer

Solana support is in beta. 

In particular, we expect to make Subsquid Network data ingestion at least 50 times faster.

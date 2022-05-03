# nft-metadata-watcher
Contract char:
0x5fdcf857957e9db2b58be6c5f499a2bc8d64f24c

Contract land:
0x94595B3B94B2df23fEb9557A2AC295267877e646


![Rada Auction flow image](https://crustwebsites.net/ipfs/QmYWz9rMnYciiTHK719n8FFgMLVPEsmjPYa6DUu9RY9sHT?filename=rada-acution-flow.jpg)
![OpenBox Flow image](https://crustwebsites.net/ipfs/QmSM9ZHvHrnNNJLxJ13QDNh44GNehNB6FsEqKDpj5muY3x?filename=openbox-flow.jpg)

// TODO: add Dockerfile, kubernetes-deployment files.
// TODO: secure privateKey in /data directory
// TODO: fire error log to chat app for monitoring.
// TODO: optimize get nonce to speedup send transactions. (DONE optimization ver 1)
// TODO: check nonce conflict. (DONE attempt 1)

## Enviroment variable description:

NFT_METADATA_PATH

- Directory storing metadata json files.

ETHEREUM_ACCOUNTS_PATH

- Directory storing private key and address for signer.
- For example:
  - ./accounts/signer/privateKey - Storing account private key plain text.
  - ./accounts/signer/address -Storing account address plain text.

POLYGON_URL
POLYGON_CHAIN_ID
POLYGON_NETWORK_ID

- Polygon RPC and chain info.

POLYGON_SCAN_FROM_BACK_LATEST_BLOCK

- Start scan from (latest_block - back_block)

POLYGON_SCAN_START_BLOCK

- Set scan from block manually. If this env variable is not empty, it'll overide POLYGON_SCAN_FROM_BACK_LATEST_BLOCK flow.

POLYGON_DELAY_CONFIRMED_BLOCKS

- Scan to (latest_block - delay_block)

POLYGON_SLEEP_TIME

- When not finding newest block, sleep for miliseconds.

BSC_xxx env variables are similar to polygon counterparts.

## Contract ABI and event info

Look at src/contracts directory.

## Local:

```sh
yarn install

# Prepare account signer private key and address
# ./accounts/signer/privateKey - Storing account private key plain text.
# ./accounts/signer/address -Storing account address plain text.

# Set appropriate environments variables in .env.development file.

# Run polygon watcher
start:polygon_logs_watcher:dev

# Open another terminal, run bsc watcher
start:bsc_logs_watcher:dev
```

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

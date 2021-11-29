# Auction House

## Dev Setup

Install Anchor [here](https://project-serum.github.io/anchor/getting-started/installation.html).

Install deps

```
yarn
```

## Run tests

To run a test against a localnet run

```
anchor test
```

To run tests again devnet,

```
anchor test --provider.cluster devnet --skip-deploy
```

To run tests against mainnet,

```
anchor test --provider.cluster mainnet --skip-deploy
```

import { Program, Provider, Wallet, BN } from '@project-serum/anchor';
import {
	PublicKey,
	Connection,
	SystemProgram,
	SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { Token, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { IDL, AuctionHouse } from './idl';

////////////////////////////////////////////////////////////////////////////////
//
// To run this script, first run
//
// ```
// yarn
// ```
//
// In the directory and ensure you have a funded solana wallet keypair located
// at `~/.config/solana/id.json`. This can be done via
//
// ```
// solana-keypair new -o ~/.config/solana/id.json
// ```
//
// The test will deposit 1 SOL and then withdraw 1 SOL to/from the program.
// If you don't have SOL, then set `SPEND_SOL` to false.
//
// To run the script here, run
//
// ```
// yarn test
// ```
//
////////////////////////////////////////////////////////////////////////////////


// `true` iff you want ot send transactions on mainnet with a wallet at
// ~/.config/solana/id.json.
const FEATURE_SPEND_SOL = true;

// Address of the program on mainnet.
const ID = new PublicKey('hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk');

// Address of a previously initialized auction house account.
const AUCTION_HOUSE = new PublicKey('389VoghcxaWRKD6GkLXPeSrhVDsSPNvinU9Wq2QBsXmb');

// Address  for native SOL token accounts.
//
// The program uses this when one wants to pay with native SOL vs an SPL token.
const NATIVE_SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');

// Seeds constants.
const PREFIX = Buffer.from("auction_house");


// Entrypoint.
async function main() {
	// Program is the typescript/javascript representation of the smart contract.
	// This client's API is auto generated from the IDL and, for the most part,
	// corresponds 1-1 to the Rust API.
	const program = buildAuctionHouseClient();

	const treasuryMint = NATIVE_SOL_MINT;
	const wallet = program.provider.wallet.publicKey;
	const tokenProgram = TOKEN_PROGRAM_ID;
	const systemProgram = SystemProgram.programid;
	const ataProgram = ASSOCIATED_TOKEN_PROGRAM_ID;
	const rent = SYSVAR_RENT_PUBKEY;

	const [auctionHouse, auctionHouseBump] =

	let txSig = await program.rpc.createAuctionHouse(
		,
		{
			accounts: {
				treasuryMint,
				payer,
				authority,
				feeWithdrawalDestination,
				treasuryWithdrawalDestination,
				treasuryWithdrawalDestinationOwner,
				auctionHouse,
				auctionHouseFeeAccount,
				auctionhouseTreasury,
				tokenProgram,
				systemProgram,
				ataProgram,
				rent,
			},
		}
	);

	// Fetch an auction house account at a specific address.
	const auctionHouse = await program.account.auctionHouse.fetch(AUCTION_HOUSE);
	console.log('Auction house account', auctionHouse);

	// Calculate a program-derived-address (PDA).
	//
	// These are special addresses on Solana that are deterministic functions of
	// the "seeds", i.e. the array input below.
	//
	// The program uses several different PDAs to represent various part of the
	// state. Here, the escrow account holding deposits for bidding.
	const [escrowPaymentAccount, escrowPaymentBump] = await PublicKey.findProgramAddress(
		[
			PREFIX,
			AUCTION_HOUSE.toBuffer(),
			program.provider.wallet.publicKey.toBuffer(),
		],
		program.programId,
	);

	if (FEATURE_SPEND_SOL) {
		// The amount to spend.
		const amount = new BN(1*10**9);

		// Sign and send a transaction with the configured wallet provider.
		//
		// This transaction will deposit 1 SOL into the wallet's escrow account,
		// which will be available for bidding.
		//
		// Note the structure of the API. It's a function call on the "rpc"
		// namespace that corresponds 1-1 to the rust code, where normal params
		// are passed in as the first arguments, and a "contesxt" object is passed
		// in as the last parameter, which, among other things, specifies the
		// accounts used for the transaction.
		//
		// Each API on the program is accessible in the same way like this.
		//
		// To know what parameters and accounts to pass into the program, it's
		// recommended to read the smart contract API directly and pattern match.
		//
		console.log('Depositing amount:', amount.toString());
		let txSig = await program.rpc.deposit(escrowPaymentBump, amount, {
			accounts: {
				wallet: program.provider.wallet.publicKey,
				// If deposit currency is SOL, payment account is the native wallet.
				// If deposit currency is an SPL token, payment account is an SPL token account.
				paymentAccount: program.provider.wallet.publicKey,
				// For SPL tokens, this is the "owner" of the token account.
				// For SOL, this field isn't used.
				transferAuthority: program.provider.wallet.publicKey,
				escrowPaymentAccount,
				treasuryMint: auctionHouse.treasuryMint,
				authority: auctionHouse.authority,
				auctionHouse: AUCTION_HOUSE,
				auctionHouseFeeAccount: auctionHouse.auctionHouseFeeAccount,
				tokenProgram: TOKEN_PROGRAM_ID,
				systemProgram: SystemProgram.programId,
				rent: SYSVAR_RENT_PUBKEY,
			}
		});
		console.log('TX:', txSig);

		// Sign and send a transaction with the configured wallet provider.
		//
		// This transaction will deposit 1 SOL into the wallet's escrow account,
		// which will be available for bidding.
		console.log('Withdrawing amount:', amount.toString());
		txSig = await program.rpc.withdraw(escrowPaymentBump, amount, {
			accounts: {
				wallet: program.provider.wallet.publicKey,
				receiptAccount: program.provider.wallet.publicKey,
				escrowPaymentAccount,
				treasuryMint: auctionHouse.treasuryMint,
				authority: auctionHouse.authority,
				auctionHouse: AUCTION_HOUSE,
				auctionHouseFeeAccount: auctionHouse.auctionHouseFeeAccount,
				tokenProgram: TOKEN_PROGRAM_ID,
				systemProgram: SystemProgram.programId,
				ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
				rent: SYSVAR_RENT_PUBKEY,
			}
		});
		console.log('TX:', txSig);
	}
}

// Below here is boilerplate for generating clients.

function buildAuctionHouseClient(): Program<AuctionHouse> {
	return new Program<AuctionHouse>(IDL, ID, buildProvider());
}

// Provider is the wallet and network context. This is the underlying mechanism
// that signs + sends transactions to the cluster.
function buildProvider() {
	// Network connection.
	const connection = buildConnection();

	// Wallet connection.
	//
	// For node, this API reads the ANCHOR_WALLET environment variable, specifying
	// the path to the keypair file.
	//
	// For the browser, one would use the `@solana/wallet-adapter` package, which
	// has a react hook `useAnchorWallet()`.
	const wallet = Wallet.local();

	// Build it.
	return new Provider(
		connection,
		wallet,
		Provider.defaultOptions(),
	);
}

// Client for the SPL token program. Can fetch token accounts with this.
function buildTokenClient(): Token {
	return new Token(
		buildConnection(),
		NATIVE_SOL_MINT,
		TOKEN_PROGRAM_ID,
		null,
	)
}

function buildConnection(): Connection {
	return new Connection('https://solana-api.projectserum.com', 'recent');
}

main();

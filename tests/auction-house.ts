import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { AuctionHouse } from '../target/types/auction_house';

describe('auction-house', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.AuctionHouse as Program<AuctionHouse>;

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});

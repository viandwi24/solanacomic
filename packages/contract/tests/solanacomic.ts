import * as anchor from "@coral-xyz/anchor";
import { BN } from 'bn.js'
import { Solanacomic } from "../target/types/solanacomic";
import { PROGRAM_ID as BGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum";
import { PROGRAM_ID as MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
  getConcurrentMerkleTreeAccountSize,
  ValidDepthSizePair
} from '@solana/spl-account-compression';
import fs from 'fs'
import path from 'path'
import { PublicKey } from "@solana/web3.js";
import dayjs from 'dayjs'

const getKeypair = (path: string) => {
  const secretKeyString = fs.readFileSync(path, {encoding: 'utf8'})
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString))
  return anchor.web3.Keypair.fromSecretKey(secretKey)
}

const getMetadata = (mint: PublicKey) => {
  const metaplex_id = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  const [pdaMasterEdition] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      new PublicKey(metaplex_id).toBuffer(),
      mint.toBuffer(),
    ],
    new PublicKey(metaplex_id)
  )
  return pdaMasterEdition
}

const getEdition = (mint: PublicKey) => {
  const metaplex_id = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  const [pdaMasterEdition] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      new PublicKey(metaplex_id).toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition"),
    ],
    new PublicKey(metaplex_id)
  )
  return pdaMasterEdition
}

describe("solanacomic", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Solanacomic as anchor.Program<Solanacomic>;
  const connection = provider.connection;
  const wallet0 = getKeypair(path.join(__dirname, '../../../../.config/solana/id.json'))
  const wallet1 = getKeypair(path.join(__dirname, '../../../../.config/solana/phantom.json'))
  console.log('connection:', connection.rpcEndpoint)
  console.log('wallet:', provider.wallet.publicKey.toString())

  // it("ping", async () => {
  //   const start_date = new BN(dayjs().unix())
  //   const tx = await program.methods
  //     .ping(new BN())
  //     .accounts({
  //       clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  //     })
  //     .rpc()
  //   console.log('tx:', tx)
  // })

  // it("create merkle tree", async () => {
  //   const user = provider.wallet
  //   const merkleTreeKeypair = anchor.web3.Keypair.generate()
  //   const [treeAuthority] = anchor.web3.PublicKey.findProgramAddressSync(
  //     [merkleTreeKeypair.publicKey.toBuffer()],
  //     BGUM_PROGRAM_ID,
  //   )
  //   const space = getConcurrentMerkleTreeAccountSize(14, 64)
  //   console.log('user :', user.publicKey.toString())
  //   console.log('merkle tree address :', merkleTreeKeypair.publicKey.toString())
  //   console.log('treeAuthority :', treeAuthority.toString())
  //   console.log('space :', space)
  //   const comic_metadata = {
  //     name: 'test2',
  //     description: 'test2',
  //     max_supply: new BN(100),
  //     start_date: new BN(dayjs('2023-04-03').unix()),
  //     end_date:  new BN(dayjs('2023-04-05').unix()),
  //     collection_mint: new PublicKey('2xQUjBUkZFLw4fwQbEH9dJNcTCEs2e5Ay7U1hYrdsWTx'),
  //   }
  //   const [comic] = PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.from("comic"),
  //       merkleTreeKeypair.publicKey.toBuffer(),
  //     ],
  //     program.programId
  //   )
  //   const tx = await program.methods
  //     .createComic(
  //       comic_metadata.name,
  //       comic_metadata.description,
  //       comic_metadata.max_supply,
  //       comic_metadata.start_date,
  //       comic_metadata.end_date,
  //     )
  //     .preInstructions([
  //       anchor.web3.SystemProgram.createAccount({
  //         fromPubkey: user.publicKey,
  //         newAccountPubkey: merkleTreeKeypair.publicKey,
  //         lamports: await connection.getMinimumBalanceForRentExemption(space),
  //         space,
  //         programId: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  //       })
  //     ])
  //     .accounts({
  //       merkleTree: merkleTreeKeypair.publicKey,
  //       treeAuthority,

  //       comic,
  //       collectionMint: comic_metadata.collection_mint,

  //       bubblegumProgram: BGUM_PROGRAM_ID,
  //       compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  //       logWrapper: SPL_NOOP_PROGRAM_ID,
  //       tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
  //       clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  //     })
  //     .signers([merkleTreeKeypair])
  //     .rpc()
  //   console.log('tx :', tx)
  // })

  it("mint comic", async () => {
    const user = wallet1

    const prod = anchor.getProvider()
    anchor.setProvider(
      new anchor.AnchorProvider(prod.connection, new anchor.Wallet(user), { commitment: "finalized", skipPreflight: true })
    )

    const comics = await program.account.comic.all()
    const [search_comic] = PublicKey.findProgramAddressSync([
      Buffer.from("comic"),
      (new PublicKey('3JEzNtXSjgMCtxtDSieN1DHg4V5epdmGHPN26DCWUNNg')).toBuffer(),
    ], program.programId)
    const comic = comics.find((comic) => comic.publicKey.equals(search_comic))
    if (!comic) throw new Error('no comic')

    const merkleTree = comic.account.merkleTree
    const authority = comic.account.authority
    const collectionMint = comic.account.collectionMint
    const collectionMetadata = getMetadata(collectionMint)
    const collectionEdition = getEdition(collectionMint)
    const [treeAuthority] = anchor.web3.PublicKey.findProgramAddressSync(
      [merkleTree.toBuffer()],
      BGUM_PROGRAM_ID,
    )
    console.log('merkleTree:', merkleTree.toString())
    console.log('authority:', authority.toString())
    console.log('collectionMint:', collectionMint.toString())

    const tx = await program.methods
      .mintComic()
      .accounts({
        comic: comic.publicKey,

        // collections
        collectionMint: collectionMint,
        collectionMetadata: collectionMetadata,
        collectionAuthority: authority,
        editionAccount: collectionEdition,

        user: user.publicKey,
        payer: user.publicKey,

        merkleTree,
        treeAuthority,
        treeCreator: authority,

        bubblegumSigner: new PublicKey('4ewWZC5gT6TGpm5LZNDs9wVonfUT2q5PP5sc9kVbwMAK'),

        bubblegumProgram: BGUM_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        logWrapper: SPL_NOOP_PROGRAM_ID,
        tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      })
      .signers([user, wallet0])
      .rpc()
    console.log('tx:', tx)
  })

  // const data = {
  //   merkleTree: new PublicKey('2NJ75pia799TtU9mn5E16Wn8MkfY5kkG8zsQvSJBs6Ta'),
  //   merkeTreeAuthority: new PublicKey('7iidh9psQ3Dt1LfRdD5JLHUYaxJ3TBGMgGU4XMn8CosR'),
  //   mint: new PublicKey('9XwGTDtEb6b8eYCgZby9eq1QxTtiTn8wyipsbqgF1feX'),
  //   metadata: new PublicKey('DUsSiU6DPB78jHPj5FGxKRe4Jr4NufM3HTuJsSGTEiUT'),
  //   edition: new PublicKey('3gSwqqvxv1tRZUjgBWrhYfDNAGQs5quduBvGSrNESDPX'),
  // }

  // it("mint", async () => {
  //   const tx = await program.methods
  //     .mint()
  //     .accounts({
  //       user: wallet1.publicKey,
  //       treeCreator: wallet0.publicKey,

  //       merkleTree: data.merkleTree,
  //       treeAuthority: data.merkeTreeAuthority,

  //       bubblegumProgram: BGUM_PROGRAM_ID,
  //       compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  //       logWrapper: SPL_NOOP_PROGRAM_ID,
  //     })
  //     .signers([wallet1])
  //     .rpc()
  //   console.log('tx :', tx)
  // })

  // it("mint to collection v1", async () => {
  //   const tx = await program.methods
  //     .mintToCollectionV1()
  //     .accounts({
  //       collectionMetadata: data.metadata,
  //       collectionMint: data.mint,
  //       collectionAuthority: wallet0.publicKey,
  //       editionAccount: data.edition,

  //       merkleTree: data.merkleTree,
  //       treeAuthority: data.merkeTreeAuthority,
  //       treeCreator: wallet0.publicKey,
  //       bubblegumSigner: new PublicKey('4ewWZC5gT6TGpm5LZNDs9wVonfUT2q5PP5sc9kVbwMAK'),

  //       bubblegumProgram: BGUM_PROGRAM_ID,
  //       compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  //       logWrapper: SPL_NOOP_PROGRAM_ID,

  //       tokenMetadataProgram: new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'),

  //       user: new PublicKey('Riyzbg8GGJCuAi9TNXAfAee2mBtHy9t7Lk3eqnSDpF3'),
  //     })
  //     .preInstructions([
  //       anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
  //         units: 800000,
  //       }),
  //       anchor.web3.ComputeBudgetProgram.setComputeUnitPrice({
  //         microLamports: 0,
  //       }),
  //     ])
  //     .rpc()
  //   console.log('tx :', tx)
  // })
})

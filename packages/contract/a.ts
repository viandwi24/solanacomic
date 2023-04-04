import fs from 'fs'
import path from 'path'
import * as anchor from "@coral-xyz/anchor"
import {
    createBubblegumSetCollectionSizeInstruction,
    createSetCollectionSizeInstruction,
} from '@metaplex-foundation/mpl-token-metadata'
import { Connection, PublicKey, Transaction, clusterApiUrl, sendAndConfirmTransaction } from '@solana/web3.js'
import { PROGRAM_ID as BGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum"
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js'

const log = console.log
const logDivider = () => log('\n=======================================')

const getKeypair = (path: string) => {
    const secretKeyString = fs.readFileSync(path, {encoding: 'utf8'})
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString))
    return anchor.web3.Keypair.fromSecretKey(secretKey)
}

(async () => {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
    const wallet = getKeypair(path.join(__dirname, '../../../../../.config/solana/id.json'))
    log('wallet:', wallet.publicKey.toString())
    log('connection:', connection.rpcEndpoint)

    const mpx = Metaplex.make(connection)
        .use(keypairIdentity(wallet))

    // create collection nft
    logDivider()
    log('=> create collection nft')
    const collectionNFT = await mpx.nfts().create({
        uri: `https://raw.githubusercontent.com/viandwi24/nfts-devs/main/bgum/collection3_test_metadata.json?r=${Math.random()}`,
        name: 'BGUM3 Test Collection',
        symbol: 'BGTC3',
        sellerFeeBasisPoints: 500,
        isCollection: true,
    }, { commitment: 'finalized' })
    log('mint:', collectionNFT.mintAddress.toString())
    log('metadata:', collectionNFT.metadataAddress.toString())
    log('edition:', collectionNFT.masterEditionAddress.toString())

    // create  nft in collection
    logDivider()
    log('=> create nft in collection')
    const nftInCollection = await mpx.nfts().create({
        uri: `https://raw.githubusercontent.com/viandwi24/nfts-devs/main/bgum/nft3_test_metadata.json?r=${Math.random()}`,
        name: 'BGUM3 Test In Collection',
        symbol: 'BGTC3',
        sellerFeeBasisPoints: 500,
        collection: collectionNFT.mintAddress,
    }, { commitment: 'finalized' })
    log('mint:', nftInCollection.mintAddress.toString())
    log('metadata:', nftInCollection.metadataAddress.toString())
    log('edition:', nftInCollection.masterEditionAddress.toString())

    // verify
    logDivider()
    log('=> verify')
    const verify = await mpx.nfts().verifyCollection({
        mintAddress: nftInCollection.mintAddress,
        collectionMintAddress: collectionNFT.mintAddress,
        isSizedCollection: true,
    })
    log('verify:', verify.response)

    // results links
    logDivider()
    log('=> results links')
    log('collection nft:', `https://explorer.solana.com/address/${collectionNFT.mintAddress.toString()}?cluster=devnet`)
    log('nft in collection:', `https://explorer.solana.com/address/${nftInCollection.mintAddress.toString()}?cluster=devnet`)
})()

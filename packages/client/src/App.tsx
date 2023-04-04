import { useEffect, useMemo, useState } from "react"
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import * as anchor from "@project-serum/anchor"
import idl from "@solanacomic/contract/target/idl/solanacomic.json"
import { Solanacomic } from "@solanacomic/contract/target/types/solanacomic"
import { Keypair, PublicKey } from '@solana/web3.js'
import dayjs from 'dayjs'
import DatePicker from 'react-date-picker'

import { PROGRAM_ID as BGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum"
import { PROGRAM_ID as MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata"
import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
  getConcurrentMerkleTreeAccountSize,
  ValidDepthSizePair
} from '@solana/spl-account-compression'

import { WrapperConnection } from "./utils/wrapper-connection"
import { ReadApiAssetList } from "./utils/types"


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

export function useProgram() {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()
  return {
    program: useMemo(() => {
      const prod = new anchor.AnchorProvider(connection, wallet as any, {})
      return new anchor.Program<Solanacomic>(idl as any, idl.metadata.address, prod)
    }, [connection, wallet]),
  }
}


export type APP_PAGE = 'HOME' | 'COMIC_CREATE' | 'COMIC_LIST' | 'COMIC_DETAIL' | 'ASSETS_LIST'

export type Navigate = (page: APP_PAGE, props?: any) => void

export function App() {
  const [CURRENT_PAGE, setCurrentPage] = useState<APP_PAGE>('HOME')
  const [navigateProps, setNavigateProps] = useState<any>(null)
  const navigate = (page: APP_PAGE, props: any = {}) => {
    setCurrentPage(page)
    setNavigateProps(props)
  }
  return (
    <div className="bg-slate-900 text-gray-100 w-screen h-screen flex flex-col">
      <div className="flex-1 max-w-screen-md mx-auto w-full flex flex-col py-10 max-h-full overflow-hidden">
        <div className="flex justify-end">
          <WalletMultiButton />
        </div>
        <div className="flex-1 flex max-h-full overflow-hidden">
          {CURRENT_PAGE === 'HOME' && <HomePage navigate={navigate} {...navigateProps} />}
          {CURRENT_PAGE === 'COMIC_CREATE' && <ComicCreatePage navigate={navigate} {...navigateProps} />}
          {CURRENT_PAGE === 'COMIC_LIST' && <ComicListPage navigate={navigate} {...navigateProps} />}
          {CURRENT_PAGE === 'COMIC_DETAIL' && <ComicDetailPage navigate={navigate} {...navigateProps} />}
          {CURRENT_PAGE === 'ASSETS_LIST' && <AssetsListPage navigate={navigate} {...navigateProps} />}
        </div>
      </div>
    </div>
  )
}

export function HomePage(props: { navigate: Navigate }) {
  const menus = useMemo(() => [
    { name: 'Create Comic', page: 'COMIC_CREATE' },
    { name: 'List Comic', page: 'COMIC_LIST' },
    { name: 'My Assets', page: 'ASSETS_LIST' },
  ] as { name: string, page: APP_PAGE }[], [])

  return (
    <div className="flex-1 flex flex-col justify-center space-y-4">
      {menus.map((menu) => (
        <button
          key={menu.name}
          className="px-6 py-3 rounded bg-slate-800 duration-300 transition-all hover:bg-slate-700 text-center"
          onClick={() => props.navigate(menu.page)}
        >
          <div className="font-bold text-lg">{menu.name}</div>
        </button>
      ))}
    </div>
  )
}

export function ComicCreatePage(props: { navigate: Navigate }) {
  const wallet = useAnchorWallet()
  const { program } = useProgram()
  const { connection } = useConnection()

  const [merkleTreeKeypair, setMerkleTreeKeypair] = useState<Keypair>()
  const [input, setInput] = useState({
    name: 'test comic' + Math.floor(Math.random()),
    maxSupply: 100,
    description: 'test comic' + Math.floor(Math.random()),
    startDate: dayjs().toDate(),
    endDate: dayjs().add(1, 'day').toDate(),
    collectionMintAddress: '6wH2PM8xcLoPnUHqShpuHHj2fdsCvqzd8QX4JNBqZfAU',
    collectionMetadataAddress: '',
    collectionEditionAddress: '',
    merkleTreeAddress: '',
    treeAuthorityAddress: '',
    comicAddress: '',
  })

  const fetchCollection = async () => {
    setInput(prev => ({
      ...prev,
      collectionMetadataAddress: getMetadata(new PublicKey(input.collectionMintAddress)).toBase58(),
      collectionEditionAddress: getEdition(new PublicKey(input.collectionMintAddress)).toBase58(),
    }))
  }

  useEffect(() => {
    const mt = Keypair.generate()
    const [treeAuthority] = anchor.web3.PublicKey.findProgramAddressSync(
      [mt.publicKey.toBuffer()],
      BGUM_PROGRAM_ID,
    )
    const [comic] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("comic"),
        mt.publicKey.toBuffer(),
      ],
      program.programId
    )
    setMerkleTreeKeypair(mt)
    setInput(prev => ({
      ...prev,
      merkleTreeAddress: mt.publicKey.toBase58(),
      treeAuthorityAddress: treeAuthority.toBase58(),
      comicAddress: comic.toBase58(),
    }))
  }, [])

  const createComic = async () => {
    try {
      const user = wallet

      if (!merkleTreeKeypair || typeof merkleTreeKeypair === 'undefined') return alert('merkle tree keypair is not ready')
      if (!user || typeof user === 'undefined') return alert('wallet is not ready')
      const space = getConcurrentMerkleTreeAccountSize(14, 64)
      const tx = await program.methods
        .createComic(
          input.name,
          input.description,
          new anchor.BN(input.maxSupply),
          new anchor.BN(dayjs(input.startDate).unix()),
          new anchor.BN(dayjs(input.endDate).unix()),
        )
        .accounts({
          merkleTree: merkleTreeKeypair.publicKey,
          treeAuthority: new PublicKey(input.treeAuthorityAddress),

          comic: input.comicAddress,
          collectionMint: new PublicKey(input.collectionMintAddress),

          bubblegumProgram: BGUM_PROGRAM_ID,
          compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
          logWrapper: SPL_NOOP_PROGRAM_ID,
          tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        })
        .preInstructions([
          anchor.web3.SystemProgram.createAccount({
            fromPubkey: user?.publicKey,
            newAccountPubkey: merkleTreeKeypair?.publicKey,
            lamports: await connection.getMinimumBalanceForRentExemption(space),
            space,
            programId: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
          })
        ])
        .signers([merkleTreeKeypair])
        .rpc()
      alert(`tx success !!! tx id : ${tx}`)
      console.log(tx)
    } catch (error) {
      alert(`error !!! detail on console`)
      console.error(error)
    }
  }

  return (
    <div className="flex-1 flex flex-col space-y-4">
      <div className="flex">
        <button onClick={() => props.navigate('HOME')}>Back</button>
      </div>
      <div className="flex-1 flex flex-col rounded bg-slate-800 overflow-hidden max-h-full">
        <div className="font-bold text-lg px-6 py-3 bg-slate-700">Create Comic</div>
        <div className="flex-1 px-6 py-6 max-h-full h-full overflow-y-auto">
          <div className="flex flex-col space-y-2">
            <div className="text-lg font-bold">Comic Details</div>
            <div className="flex space-x-4">
              <div className="w-2/3 flex flex-col">
                <div className="mb-2">Name</div>
                <input type="text" className="w-full px-4 py-2 rounded transition-all duration-300 bg-slate-700 hover:bg-slate-600" value={input.name} onChange={(e) => setInput(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="flex-1 flex flex-col">
                <div className="mb-2">Max Supply</div>
                <input type="number" className="w-full px-4 py-2 rounded transition-all duration-300 bg-slate-700 hover:bg-slate-600" value={input.maxSupply} onChange={(e) => setInput(prev => ({ ...prev, maxSupply: parseInt(e.target.value) }))} />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="mb-2">Description</div>
              <input type="text" className="w-full px-4 py-2 rounded transition-all duration-300 bg-slate-700 hover:bg-slate-600" value={input.description} onChange={(e) => setInput(prev => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="flex space-x-4">
              <div className="flex-1 flex flex-col">
                <div className="mb-2">Start Date</div>
                  <DatePicker
                    value={input.startDate}
                    onChange={(date: any) => setInput(prev => ({ ...prev, startDate: date }))}
                    className="w-full px-4 py-2 rounded transition-all duration-300 bg-slate-700 hover:bg-slate-600"
                  />
              </div>
              <div className="flex-1 flex flex-col">
                <div className="mb-2">End Date</div>
                  <DatePicker
                    value={input.endDate}
                    onChange={(date: any) => setInput(prev => ({ ...prev, startDate: date }))}
                    className="w-full px-4 py-2 rounded transition-all duration-300 bg-slate-700 hover:bg-slate-600"
                  />
              </div>
            </div>
            {/* ok */}
            <div className="text-lg font-bold pt-6">Collection Nft</div>
            <div className="flex flex-col">
              <div className="mb-2">Collection Mint Address</div>
              <div className="flex space-x-4">
                <input type="text" className="w-full px-4 py-2 rounded transition-all duration-300 bg-slate-700 hover:bg-slate-600" value={input.collectionMintAddress} onChange={(e) => setInput(prev => ({ ...prev, collectionMintAddress: e.target.value }))} />
                <button className="px-4 py-2 rounded bg-slate-700 duration-300 transition-all hover:bg-slate-600 text-center" onClick={fetchCollection}>Fetch</button>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="mb-2">Collection Metadata (autofill from mint)</div>
              <input type="text" className="w-full px-4 py-2 rounded transition-all duration-300 bg-slate-700 hover:bg-slate-600 read-only:text-slate-500 read-only:cursor-not-allowed" readOnly value={input.collectionMetadataAddress} onChange={(e) => setInput(prev => ({ ...prev, collectionMetadataAddress: e.target.value }))} />
            </div>
            <div className="flex flex-col">
              <div className="mb-2">Collection Edition (autofill from mint)</div>
              <input type="text" className="w-full px-4 py-2 rounded transition-all duration-300 bg-slate-700 hover:bg-slate-600 read-only:text-slate-500 read-only:cursor-not-allowed" readOnly value={input.collectionEditionAddress} onChange={(e) => setInput(prev => ({ ...prev, collectionEditionAddress: e.target.value }))} />
            </div>
            {/* ok */}
            <div className="text-lg font-bold pt-6">Tree</div>
            <div className="flex flex-col">
              <div className="mb-2">Merkle Tree</div>
              <input type="text" className="w-full px-4 py-2 rounded transition-all duration-300 bg-slate-700 hover:bg-slate-600 read-only:text-slate-500 read-only:cursor-not-allowed" value={input.merkleTreeAddress} readOnly />
            </div>
            <div className="flex flex-col">
              <div className="mb-2">Tree Authority</div>
              <input type="text" className="w-full px-4 py-2 rounded transition-all duration-300 bg-slate-700 hover:bg-slate-600 read-only:text-slate-500 read-only:cursor-not-allowed" value={input.treeAuthorityAddress} readOnly />
            </div>
            <div className="flex flex-col">
              <div className="mb-2">Comic Address</div>
              <input type="text" className="w-full px-4 py-2 rounded transition-all duration-300 bg-slate-700 hover:bg-slate-600 read-only:text-slate-500 read-only:cursor-not-allowed" value={input.comicAddress} readOnly />
            </div>
            {/* actions */}
            <div className="pt-6">
              <button className="px-4 py-2 rounded bg-blue-700 duration-300 transition-all hover:bg-blue-600 text-center" onClick={createComic}>Create Comic</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ComicListPage(props: { navigate: Navigate }) {
  const { program } = useProgram()

  const [loading, setLoading] = useState(false)
  const [comics, setComics] = useState<{
    address: PublicKey,
    authority: PublicKey,
    name: string,
    description: string,
  }[]>([])

  const fetch = async () => {
    setLoading(true)
    const comics = await program.account.comic.all()
    setComics(comics.map((comic) => ({
      address: comic.publicKey,
      authority: comic.account.authority,
      name: comic.account.name,
      description: comic.account.description,
    })))
    setLoading(false)
  }

  useEffect(() => {
    fetch()
  }, [])

  return (
    <div className="flex-1 flex flex-col space-y-4">
      <div className="flex">
        <button onClick={() => props.navigate('HOME')}>Back</button>
      </div>
      <div className="flex-1 flex flex-col rounded bg-slate-800 overflow-hidden">
        <div className="font-bold text-lg px-6 py-3 bg-slate-700">List Comic</div>
        <div className="flex-1 px-6 py-3 max-h-full overflow-y-auto">
          <div className="flex flex-col space-y-4">
            {loading && <div className="flex-1 text-center">Loading...</div>}
            {comics.map((comic) => (
              <button key={Math.random()} className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-left" onClick={() => props.navigate('COMIC_DETAIL', { address: comic.address.toString() })}>
                <div className="font-semibold">{comic.name} ({comic.address.toString()})</div>
                <div className="text-xs">Authority : {comic.authority.toString()}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ComicDetailPage(props: { navigate: Navigate, address: string }) {
  const { program } = useProgram()
  const wallet = useAnchorWallet()

  const [detailValue, setDetailValue] = useState('')
  const [loading, setLoading] = useState(false)

  const [comic, setComic] = useState({
    publicKey: new PublicKey(props.address),
    authority: Keypair.generate().publicKey,
    collectionMint: Keypair.generate().publicKey,
    merkleTree: Keypair.generate().publicKey,
    collectionMetadata: Keypair.generate().publicKey,
    collectionEdition: Keypair.generate().publicKey,
    treeAuthority: Keypair.generate().publicKey,
  })

  const fetch = async () => {
    setLoading(true)
    const c = await program.account.comic.fetch(new PublicKey(props.address))
    const [treeAuthority] = anchor.web3.PublicKey.findProgramAddressSync(
      [c.merkleTree.toBuffer()],
      BGUM_PROGRAM_ID,
    )
    setComic((prev) => ({
      ...prev,
      publicKey: new PublicKey(props.address),
      authority: c.authority,
      merkleTree: c.merkleTree,
      collectionMint: c.collectionMint,
      collectionMetadata: getMetadata(c.collectionMint),
      collectionEdition: getEdition(c.collectionMint),
      treeAuthority,
    }))
    setDetailValue(JSON.stringify({ publicKey: props.address, comic: c }, null, 2))
    setLoading(false)
  }

  useEffect(() => {
    fetch()
  }, [])

  const mint = async () => {
    try {
      if (!wallet || typeof wallet === 'undefined') return alert('Wallet not connected')
      console.log('test', JSON.stringify(comic, null, 2))
      const user = wallet
      const tx = await program.methods
        .mintComic()
        .accounts({
          comic: comic.publicKey,

          // collections
          collectionMint: comic.collectionMint,
          collectionMetadata: comic.collectionMetadata,
          editionAccount: comic.collectionEdition,
          collectionAuthority: comic.authority,

          user: user.publicKey,
          payer: user.publicKey,

          merkleTree: comic.merkleTree,
          treeAuthority: comic.treeAuthority,
          treeCreator: comic.authority,

          bubblegumSigner: new PublicKey('4ewWZC5gT6TGpm5LZNDs9wVonfUT2q5PP5sc9kVbwMAK'),

          bubblegumProgram: BGUM_PROGRAM_ID,
          compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
          logWrapper: SPL_NOOP_PROGRAM_ID,
          tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        })
        .rpc()
      alert('success mint comic, tx id ' + tx)
      console.log(tx)
    } catch (error) {
      alert('have error, deatil on console')
      console.log(error)
    }
  }

  return (
    <div className="flex-1 flex flex-col space-y-4">
      <div className="flex">
        <button onClick={() => props.navigate('COMIC_LIST')}>Back</button>
      </div>
      <div className="flex-1 flex flex-col rounded bg-slate-800 overflow-hidden">
        <div className="font-bold text-lg px-6 py-3 bg-slate-700">Detail Comic {">"} {props.address}</div>
        <div className="flex-1 flex flex-col space-y-4 px-6 py-3 max-h-full overflow-y-auto">
          <div className="flex-1 flex">
            <textarea className="flex-1 w-full px-4 py-2 rounded transition-all duration-300 bg-slate-700 hover:bg-slate-600" value={detailValue} readOnly />
          </div>
          <button className="px-4 py-2 rounded bg-blue-700 duration-300 transition-all hover:bg-blue-600 text-center" onClick={mint}>
            Mint To My Wallet (Compressed NFT)
          </button>
        </div>
      </div>
    </div>
  )
}

export function AssetsListPage(props: { navigate: Navigate }) {
  const { connection: con } = useConnection()
  const wallet = useAnchorWallet()

  const [loading, setLoading] = useState(false)

  const connection = useMemo(() => new WrapperConnection(
    con.rpcEndpoint,
    { commitment: "confirmed" }
  ), [con])

  const [assets, setAssets] = useState<ReadApiAssetList>()

  const fetch = async () => {
    if (!wallet || typeof wallet === 'undefined') return
    setLoading(true)
    const data = await connection.getAssetsByOwner({
      ownerAddress: wallet.publicKey.toBase58(),
    })
    setAssets(data)
    setLoading(false)
  }

  useEffect(() => {
    fetch()
  }, [connection])

  const [mode, setMode] = useState<'list' | 'raw'>('list')

  return (
    <div className="flex-1 flex flex-col space-y-4">
      <div className="flex">
        <button onClick={() => props.navigate('HOME')}>Back</button>
      </div>
      <div className="flex-1 flex flex-col rounded bg-slate-800 overflow-hidden">
        <div className="font-bold text-lg px-6 py-3 bg-slate-700">My Assets</div>
        <div className="flex-1 flex flex-col space-y-4 px-6 py-3 max-h-full overflow-y-auto">
          {loading && <div className="text-center">Loading...</div>}
          {!loading && assets && assets.items.length === 0 && <div className="text-center">No Assets</div>}
          {!loading && assets && (
            <>
              <div className="flex">
                <div className="pr-4">Mode:</div>
                <div className="flex space-x-2">
                  <button className="underline" onClick={() => setMode('list')}>List</button>
                  <button className="underline" onClick={() => setMode('raw')}>Raw</button>
                </div>
              </div>
              {mode === 'raw' && (
                <div className="flex-1 flex">
                  <textarea className="flex-1 w-full px-4 py-2 rounded transition-all duration-300 bg-slate-700 hover:bg-slate-600" value={JSON.stringify(assets, null, 2)} readOnly />
                </div>
              )}
              {mode === 'list' && assets.items.map((asset) => (
                <div key={Math.random()} className="px-4 py-2 flex flex-col rounded bg-slate-700">
                  <div className="text-sm font-semibold">{asset.id}</div>
                  <div className="text-xs flex space-x-2 divide-x-2 divide-gray-100">
                    <span className="">Nft Name : {asset.content.metadata.name}</span>
                    <span className="pl-2">Symbol : {asset.content.metadata.symbol}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}


  // console.log('wallet:', user.publicKey.toString())

  // it("create comic", async () => {
  //   const authority = anchor.web3.Keypair.generate();

  //   const metadata = {
  //     name: 'test nft 1',
  //     description: 'test nft 1',
  //     image: 'https://picsum.photos/200',
  //   }

  //   const [comic] = anchor.web3.PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.from("comic"),
  //       user.publicKey.toBuffer(),
  //       Buffer.from(metadata.name),
  //     ],
  //     program.programId
  //   )
  //   console.log('comic address :', comic.toString())
  // });

  // it("create merkle tree bgum", async () => {
  //   const merkleTreeKeypair = anchor.web3.Keypair.generate()
  //   console.log('merkle tree address :', merkleTreeKeypair.publicKey.toString())
  //   const space = getConcurrentMerkleTreeAccountSize(14, 64);
  //   console.log('space :', space)
  //   const [treeAuthority] = await anchor.web3.PublicKey.findProgramAddress(
  //     [merkleTreeKeypair.publicKey.toBuffer()],
  //     BGUM_PROGRAM_ID,
  //   );
  //   console.log('treeAuthority :', treeAuthority.toString())
  //   console.log('BGUM_PROGRAM_ID :', BGUM_PROGRAM_ID.toString())
    

  //   // run inst
  //   const tx = await program.methods
  //     .mint()
  //     .accounts({
  //       merkleTree: merkleTreeKeypair.publicKey,
  //       treeAuthority: treeAuthority,
  //       bubblegumProgram: BGUM_PROGRAM_ID,
  //       compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  //       logWrapper: SPL_NOOP_PROGRAM_ID,
  //       user: user.publicKey,
  //     })
  //     .signers([user])
  //     .rpc()
  //   console.log('tx :', tx)
  // })

  // it("ping", async () => {
  //   // const [a] = anchor.web3.PublicKey.findProgramAddressSync(
  //   //   [(new anchor.web3.PublicKey('ws6oo9qXSVd4vSKvAGz879RSSrdGGMEdSuXofFBicV3')).toBuffer()],
  //   //   BGUM_PROGRAM_ID,
  //   // )
  //   // console.log('a :', a.toString())
  //   // return
  //   const user = provider.wallet.publicKey
  //   const merkleTreeKeypair = anchor.web3.Keypair.generate()
  //   const [treeAuthority, _bump] = anchor.web3.PublicKey.findProgramAddressSync(
  //     [merkleTreeKeypair.publicKey.toBuffer()],
  //     BGUM_PROGRAM_ID,
  //   )
  //   const space = getConcurrentMerkleTreeAccountSize(14, 64)
  //   console.log('BGUM_PROGRAM_ID :', BGUM_PROGRAM_ID.toString())
  //   console.log('merkle tree address :', merkleTreeKeypair.publicKey.toString())
  //   console.log('treeAuthority :', treeAuthority.toString())
  //   console.log('space :', space)
  //   const tx = await program.methods
  //     .mint()
  //     .accounts({
  //       merkleTree: merkleTreeKeypair.publicKey,
  //       treeAuthority,
  //       bubblegumProgram: BGUM_PROGRAM_ID,
  //       compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  //       logWrapper: SPL_NOOP_PROGRAM_ID,
  //     })
  //     .preInstructions([
  //       anchor.web3.SystemProgram.createAccount({
  //         fromPubkey: user,
  //         newAccountPubkey: merkleTreeKeypair.publicKey,
  //         lamports: await connection.getMinimumBalanceForRentExemption(space),
  //         space,
  //         programId: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  //       })
  //     ])
  //     .signers([merkleTreeKeypair])
  //     .rpc()
  //   console.log('tx :', tx)
  // })
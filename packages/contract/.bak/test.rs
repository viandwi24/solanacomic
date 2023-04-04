

pub fn ping(
    _ctx: Context<PingContext>,
) -> Result<()> {
    msg!("Pong!");
    Ok(())
}



pub fn mint(ctx: Context<MintContext>) -> Result<()> {
    mpl_bubblegum::cpi::mint_v1(
        CpiContext::new(
            ctx.accounts.bubblegum_program.to_account_info(),
            mpl_bubblegum::cpi::accounts::MintV1 {
                merkle_tree: ctx.accounts.merkle_tree.to_account_info(),
                tree_authority: ctx.accounts.tree_authority.to_account_info(),

                leaf_owner: ctx.accounts.user.to_account_info(),
                leaf_delegate: ctx.accounts.user.to_account_info(),

                tree_delegate: ctx.accounts.tree_creator.to_account_info(),

                payer: ctx.accounts.user.to_account_info(),
                log_wrapper: ctx.accounts.log_wrapper.to_account_info(),
                compression_program: ctx.accounts.compression_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            }
        ),
        mpl_bubblegum::state::metaplex_adapter::MetadataArgs {
            name: "test bubblegum".to_string(),
            symbol: "solcom".to_string(),
            uri: "https://raw.githubusercontent.com/viandwi24/nftbox/main/assets/examples/images/nft_voucher.png".to_string(),
            seller_fee_basis_points: 500,
            primary_sale_happened: false,
            is_mutable: true,
            creators: vec![
                mpl_bubblegum::state::metaplex_adapter::Creator {
                    address: *ctx.accounts.user.key,
                    verified: true,
                    share: 100,
                }
            ],
            edition_nonce: Some(0),
            collection: None,
            uses: None,
            token_program_version: mpl_bubblegum::state::metaplex_adapter::TokenProgramVersion::Original,
            token_standard: Some(mpl_bubblegum::state::metaplex_adapter::TokenStandard::Fungible),
        }
    )?;

    Ok(())
}

pub fn create_comic(
    ctx: Context<CreateComicContext>,
    name: String,
    description: String,
    image: String,
    max_supply: u64,
    start_date: u64,
    end_date: u64,
) -> Result<()> {
    msg!("Setting up the program...");

    let comic = &mut ctx.accounts.comic;
    comic.authority = *ctx.accounts.user.key;
    comic.name = name;
    comic.description = description;
    comic.image = image;
    comic.max_supply = max_supply;
    comic.minted = 0;
    comic.start_date = start_date;
    comic.end_date = end_date;

    msg!("Comic created! {} | {}", comic.authority, comic.name);
    msg!("description: {}", comic.description);
    msg!("image: {}", comic.image);
    msg!("max_supply: {}", comic.max_supply);
    msg!("minted: {}", comic.minted);
    msg!("start_date: {}", comic.start_date);
    msg!("end_date: {}", comic.end_date);

    Ok(())
}

pub fn mint(ctx: Context<MintContext>) -> Result<()> {
    msg!("BGUM! {} | {} ", ctx.accounts.bubblegum_program.key(), BUBBLEGUM_PROGRAM_ID);
    msg!("log_wrapper: {} | {} ", ctx.accounts.log_wrapper.key(), spl_account_compression::Noop::id());
    msg!("compression_program: {} | {} ", ctx.accounts.compression_program.key(), spl_account_compression::ID);
    msg!("user: {}", ctx.accounts.user.key());
    msg!("tree_authority: {}", ctx.accounts.tree_authority.key());
    msg!("merkle_tree: {}", ctx.accounts.merkle_tree.key());

    mpl_bubblegum::cpi::create_tree(
        CpiContext::new(
            ctx.accounts.bubblegum_program.to_account_info(),
            mpl_bubblegum::cpi::accounts::CreateTree {
                tree_authority: ctx.accounts.tree_authority.to_account_info(),
                merkle_tree: ctx.accounts.merkle_tree.to_account_info(),
                payer: ctx.accounts.user.to_account_info(),
                tree_creator: ctx.accounts.user.to_account_info(),
                log_wrapper: ctx.accounts.log_wrapper.to_account_info(),
                compression_program: ctx.accounts.compression_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            }
        ),
        14,
        64,
        Option::from(false)
    )?;

    msg!("Tree created! {} | {}", ctx.accounts.tree_authority.key(), ctx.accounts.merkle_tree.key());

    mpl_bubblegum::cpi::mint_to_collection_v1(
        CpiContext::new(
            ctx.accounts.bubblegum_program.to_account_info(),
            mpl_bubblegum::cpi::accounts::MintToCollectionV1 {
                tree_authority: ctx.accounts.tree_authority.to_account_info(),
                leaf_owner: ctx.accounts.user.to_account_info(),
                leaf_delegate: ctx.accounts.user.to_account_info(),
                merkle_tree: ctx.accounts.merkle_tree.to_account_info(),
                payer: ctx.accounts.user.to_account_info(),
                tree_delegate: ctx.accounts.user.to_account_info(),
                collection_authority: ctx.accounts.user.to_account_info(),
                collection_authority_record_pda: ctx.accounts.bubblegum_program.to_account_info(),
                collection_mint: ctx.accounts.collection_mint.to_account_info(),
                collection_metadata: ctx.accounts.collection_metadata.to_account_info(),
                edition_account: ctx.accounts.edition_account.to_account_info(),
                bubblegum_signer: ctx.accounts.bubblegum_program.to_account_info(),
                log_wrapper: ctx.accounts.log_wrapper.to_account_info(),
                compression_program: ctx.accounts.compression_program.to_account_info(),
                token_metadata_program: ctx.accounts.token_metadata_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            }
        ),
        mpl_bubblegum::state::metaplex_adapter::MetadataArgs {
            name: "test bubblegum".to_string(),
            symbol: "solcom".to_string(),
            uri: "https://raw.githubusercontent.com/viandwi24/nftbox/main/assets/examples/images/nft_voucher.png".to_string(),
            seller_fee_basis_points: 500,
            primary_sale_happened: false,
            is_mutable: true,
            creators: vec![
                mpl_bubblegum::state::metaplex_adapter::Creator {
                    address: *ctx.accounts.user.key,
                    verified: true,
                    share: 100,
                }
            ],
            edition_nonce: Some(0),
            collection: None,
            uses: None,
            token_program_version: mpl_bubblegum::state::metaplex_adapter::TokenProgramVersion::Original,
            token_standard: Some(mpl_bubblegum::state::metaplex_adapter::TokenStandard::Fungible),
        }
    )?;

    // mpl_bubblegum::cpi::mint_v1(
    //     CpiContext::new(
    //         ctx.accounts.bubblegum_program.to_account_info(),
    //         mpl_bubblegum::cpi::accounts::MintV1 {
    //             tree_authority: ctx.accounts.tree_authority.to_account_info(),
    //             leaf_owner: ctx.accounts.user.to_account_info(),
    //             leaf_delegate: ctx.accounts.user.to_account_info(),
    //             merkle_tree: ctx.accounts.merkle_tree.to_account_info(),
    //             payer: ctx.accounts.user.to_account_info(),
    //             tree_delegate: ctx.accounts.user.to_account_info(),
    //             log_wrapper: ctx.accounts.log_wrapper.to_account_info(),
    //             compression_program: ctx.accounts.compression_program.to_account_info(),
    //             system_program: ctx.accounts.system_program.to_account_info(),
    //         }
    //     ),
    //     mpl_bubblegum::state::metaplex_adapter::MetadataArgs {
    //         name: "test bubblegum".to_string(),
    //         symbol: "solcom".to_string(),
    //         uri: "https://raw.githubusercontent.com/viandwi24/nftbox/main/assets/examples/images/nft_voucher.png".to_string(),
    //         seller_fee_basis_points: 500,
    //         primary_sale_happened: false,
    //         is_mutable: true,
    //         creators: vec![
    //             mpl_bubblegum::state::metaplex_adapter::Creator {
    //                 address: *ctx.accounts.user.key,
    //                 verified: true,
    //                 share: 100,
    //             }
    //         ],
    //         edition_nonce: Some(0),
    //         collection: None,
    //         uses: None,
    //         token_program_version: mpl_bubblegum::state::metaplex_adapter::TokenProgramVersion::Original,
    //         token_standard: Some(mpl_bubblegum::state::metaplex_adapter::TokenStandard::Fungible),
    //     }
    // )?;

    Ok(())
}




#[derive(Accounts)]
pub struct CreateComicContext<'info> {
    /// CHECK: We're about to create this with Anchor
    #[account(
        init,
        payer = user,
        space = 8 + 32 + (4 + 30) + (4 + 30) + (4 + 30) + 8 + 8 + 8 + 8,
        seeds = [
            b"comic".as_ref(),
            user.key.as_ref(),
        ],
        bump,
    )]
    pub comic: Account<'info, Comic>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Comic {
    pub authority: Pubkey, // 32
    pub name: String, // // 4 + 30
    pub description: String, // 4 + 30
    pub image: String, // 4 + 30
    pub max_supply: u64, // 8
    pub minted: u64, // 8
    pub start_date: u64, // 8
    pub end_date: u64, // 8
}


#[derive(Accounts)]
pub struct MintContext<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: This account will be checked in the bubblegum program
    #[account(mut)]
    pub tree_authority: UncheckedAccount<'info>,

    #[account(zero)]
    /// CHECK: This account must be all zeros
    pub merkle_tree: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: This account will be checked in the bubblegum program
    pub collection_mint: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: This account will be checked in the bubblegum program
    pub collection_metadata: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: This account will be checked in the bubblegum program
    pub edition_account: UncheckedAccount<'info>,

    pub log_wrapper: Program<'info, spl_account_compression::Noop>,
    /// CHECK: This account will be checked in the bubblegum program
    pub token_metadata_program: UncheckedAccount<'info>,
    pub compression_program: Program<'info, spl_account_compression::program::SplAccountCompression>,
    pub bubblegum_program: Program<'info, mpl_bubblegum::program::Bubblegum>,
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct PingContext {}
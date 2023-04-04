use {
    anchor_lang::prelude::*,
    mpl_bubblegum::{
        ID as BGUM_PROGRAM_ID,
    },
    state::{
        Comic,
        TokenMetadata,
    },
    utils::{
        assert_account_key
    }
};

pub mod instructions;
pub mod state;
pub mod utils;

declare_id!("3jtph9795JxAkC47KukHYuR7hPsBN5ou3eb2uC77Px6Z");

#[program]
pub mod solanacomic {
    use super::*;

    pub fn ping(
        ctx: Context<PingContext>,
        start_date: u64,
    ) -> Result<()> {
        msg!("Pong!");
        msg!("Start date: {}", start_date);

        let clock = &ctx.accounts.clock;
        msg!("Unix Timestamp: {}", clock.unix_timestamp);

        Ok(())
    }

    pub fn create_comic(
        ctx: Context<CreateComicContext>,
        name: String,
        description: String,
        max_supply: u64,
        start_date: u64,
        end_date: u64,
    ) -> Result<()> {
        msg!("BGUM! {} | {} ", ctx.accounts.bubblegum_program.key(), BGUM_PROGRAM_ID);
        msg!("log_wrapper: {} | {} ", ctx.accounts.log_wrapper.key(), spl_account_compression::Noop::id());
        msg!("compression_program: {} | {} ", ctx.accounts.compression_program.key(), spl_account_compression::ID);
        msg!("user: {}", ctx.accounts.user.key());
        msg!("merkle_tree: {}", ctx.accounts.merkle_tree.key());

        // asert that the bubblegum program is the same as the one in the state
        assert_account_key(&ctx.accounts.bubblegum_program.to_account_info(), &BGUM_PROGRAM_ID)?;

        // assert that the log_wrapper is the same as the one in the state
        assert_account_key(&ctx.accounts.log_wrapper.to_account_info(), &spl_account_compression::Noop::id())?;

        // assert that the compression_program is the same as the one in the state
        assert_account_key(&ctx.accounts.compression_program.to_account_info(), &spl_account_compression::ID)?;

        // token metadat program must be metaqxxx
        assert_account_key(&ctx.accounts.token_metadata_program.to_account_info(), &mpl_token_metadata::id())?;

        // start date must be less than end date
        assert!(start_date < end_date, "Start date must be less than end date");

        // start date must be less than current date or same as current date
        let clock = &ctx.accounts.clock;
        let current_timestamp = clock.unix_timestamp as u64;
        msg!("current_timestamp: {}", current_timestamp);
        msg!("start_date: {}", start_date);
        msg!("end_date: {}", end_date);
        assert!(start_date < current_timestamp, "Start date must be less than or equal to current date");

        // create the merkle tree
        msg!("Creating merkle tree");
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

        // create comic pdas
        msg!("Creating comic pdas");
        let comic = &mut ctx.accounts.comic;
        comic.merkle_tree = *ctx.accounts.merkle_tree.key;
        comic.collection_mint = ctx.accounts.collection_mint.key();
        comic.authority = *ctx.accounts.user.key;
        comic.name = name;
        comic.description = description;
        comic.max_supply = max_supply;
        comic.minted = 0;
        comic.start_date = start_date;
        comic.end_date = end_date;

        msg!("Comic created! {} | {}", comic.authority, comic.name);
        msg!("comic: {}", comic.key());
        msg!("collection_mint: {}", comic.collection_mint);
        msg!("merkle_tree: {}", comic.merkle_tree);
        msg!("description: {}", comic.description);
        msg!("max_supply: {}", comic.max_supply);
        msg!("minted: {}", comic.minted);
        msg!("start_date: {}", comic.start_date);
        msg!("end_date: {}", comic.end_date);

        Ok(())
    }

    pub fn mint_comic(ctx: Context<MintComicContext>) -> Result<()> {
        msg!("Minting comic");

        msg!("user: {}", ctx.accounts.user.key());
        msg!("comic: {}", ctx.accounts.comic.key());
        msg!("comit mint index: {}", ctx.accounts.comic.minted);
        msg!("merkle_tree: {}", ctx.accounts.merkle_tree.key());
        msg!("tree_creator: {}", ctx.accounts.tree_creator.key());

        let metadata = &ctx.accounts.collection_metadata;
        msg!("metadata: {}", metadata.key());
        msg!("metadata name: {}", metadata.data.name);
        msg!("metadata symbol: {}", metadata.data.symbol);
        msg!("metadata uri: {}", metadata.data.uri);
        if let Some(creators) = metadata.data.creators.as_ref() {
            for creator in creators {
                msg!("creator: {}", creator.address);
            }
        }
        msg!("metadata seller fee basis points: {}", metadata.data.seller_fee_basis_points);

        // mints
        let creators = metadata.data.creators.as_ref().unwrap();
        let to_creators = creators.iter().map(|creator| {
            let to_creator = mpl_bubblegum::state::metaplex_adapter::Creator {
                address: creator.address,
                verified: creator.verified,
                share: creator.share,
            };
            to_creator
        }).collect();
        mpl_bubblegum::cpi::mint_to_collection_v1(
            CpiContext::new(
                ctx.accounts.bubblegum_program.to_account_info(),
                mpl_bubblegum::cpi::accounts::MintToCollectionV1 {
                    tree_authority: ctx.accounts.tree_authority.to_account_info(),
                    leaf_owner: ctx.accounts.user.to_account_info(),
                    leaf_delegate: ctx.accounts.user.to_account_info(),
                    merkle_tree: ctx.accounts.merkle_tree.to_account_info(),
                    payer: ctx.accounts.payer.to_account_info(),
                    tree_delegate: ctx.accounts.tree_creator.to_account_info(),
                    collection_authority: ctx.accounts.collection_authority.to_account_info(),
                    collection_authority_record_pda: ctx.accounts.bubblegum_program.to_account_info(),
                    collection_mint: ctx.accounts.collection_mint.to_account_info(),
                    collection_metadata: ctx.accounts.collection_metadata.to_account_info(),
                    edition_account: ctx.accounts.edition_account.to_account_info(),
                    bubblegum_signer: ctx.accounts.bubblegum_signer.to_account_info(),
                    log_wrapper: ctx.accounts.log_wrapper.to_account_info(),
                    compression_program: ctx.accounts.compression_program.to_account_info(),
                    token_metadata_program: ctx.accounts.token_metadata_program.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                }
            ),
            mpl_bubblegum::state::metaplex_adapter::MetadataArgs {
                name: metadata.data.name.clone().to_string(),
                symbol: metadata.data.symbol.clone().to_string(),
                uri: metadata.data.uri.clone().to_string(),
                seller_fee_basis_points: metadata.data.seller_fee_basis_points,
                primary_sale_happened: false,
                is_mutable: true,
                creators: to_creators,
                edition_nonce: Some(0),
                collection: Some(mpl_bubblegum::state::metaplex_adapter::Collection {
                    key: *ctx.accounts.collection_mint.key,
                    verified: false,
                }),
                uses: None,
                token_program_version: mpl_bubblegum::state::metaplex_adapter::TokenProgramVersion::Original,
                token_standard: Some(mpl_bubblegum::state::metaplex_adapter::TokenStandard::Fungible),
            }
        )?;

        // increment minted
        let comic = &mut ctx.accounts.comic;
        comic.minted += 1;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct MintComicContext<'info> {
    #[account(mut)]
    pub comic: Account<'info, Comic>,

    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    /// CHECK: This account will be checked in the bubblegum program
    pub tree_creator: Signer<'info>,

    #[account(mut)]
    /// CHECK: This account will be checked in the bubblegum program
    pub tree_authority: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: This account must be all zeros
    pub merkle_tree: UncheckedAccount<'info>,

    /// CHECK: This is just used as a signing PDA.
    pub bubblegum_signer: UncheckedAccount<'info>,

    /// CHECK: This account will be checked in the bubblegum program
    pub collection_mint: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: This account will be checked in the bubblegum program
    pub collection_metadata: Box<Account<'info, TokenMetadata>>,
    /// CHECK: This account will be checked in the bubblegum program
    pub edition_account: UncheckedAccount<'info>,
    /// CHECK: This account will be checked in the bubblegum program
    pub collection_authority: UncheckedAccount<'info>,

    pub log_wrapper: Program<'info, spl_account_compression::Noop>,
    pub compression_program: Program<'info, spl_account_compression::program::SplAccountCompression>,
    /// CHECK: This is the token metadata program
    pub token_metadata_program: UncheckedAccount<'info>,
    pub bubblegum_program: Program<'info, mpl_bubblegum::program::Bubblegum>,
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct PingContext<'info> {
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
#[instruction(name: String, description: String, max_supply: u64, start_date: u64, end_date: u64)]
pub struct CreateComicContext<'info> {
    /// CHECK: We're about to create this with Anchor
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 32 + 32 + (4 + 30) + (4 + 30) + 8 + 8 + 8 + 8,
        seeds = [
            b"comic".as_ref(),
            merkle_tree.key().as_ref(),
        ],
        bump,
    )]
    pub comic: Account<'info, Comic>,

    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: This account will be checked in the bubblegum program
    #[account(mut)]
    pub tree_authority: UncheckedAccount<'info>,

    #[account(zero)]
    /// CHECK: This account must be all zeros
    pub merkle_tree: UncheckedAccount<'info>,

    /// CHECK: This account will be checked in the bubblegum program
    pub collection_mint: UncheckedAccount<'info>,

    pub log_wrapper: Program<'info, spl_account_compression::Noop>,
    pub compression_program: Program<'info, spl_account_compression::program::SplAccountCompression>,
    /// CHECK: This is the token metadata program
    pub token_metadata_program: UncheckedAccount<'info>,
    pub bubblegum_program: Program<'info, mpl_bubblegum::program::Bubblegum>,
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

use {
    anchor_lang::prelude::*,
    mpl_token_metadata::{
        state::{MAX_METADATA_LEN},
        utils::try_from_slice_checked,
    },
    std::ops::Deref,
};


#[derive(Clone, AnchorDeserialize, AnchorSerialize)]
pub struct TokenMetadata(mpl_token_metadata::state::Metadata);
impl anchor_lang::AccountDeserialize for TokenMetadata {
    fn try_deserialize_unchecked(buf: &mut &[u8]) -> Result<Self> {
        try_from_slice_checked::<mpl_token_metadata::state::Metadata>(
            buf,
            mpl_token_metadata::state::Key::MetadataV1,
            MAX_METADATA_LEN,
        )
        .map(TokenMetadata)
        .map_err(Into::into)
    }
}
impl anchor_lang::AccountSerialize for TokenMetadata {}
impl anchor_lang::Owner for TokenMetadata {
    fn owner() -> Pubkey {
        mpl_token_metadata::id()
    }
}
impl Deref for TokenMetadata {
    type Target = mpl_token_metadata::state::Metadata;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[account]
pub struct Comic {
    pub authority: Pubkey, // 32
    pub merkle_tree: Pubkey, // 32
    pub collection_mint: Pubkey, // 32
    pub name: String, // // 4 + 30
    pub description: String, // 4 + 30
    pub max_supply: u64, // 8
    pub minted: u64, // 8
    pub start_date: u64, // 8
    pub end_date: u64, // 8
}
use {
    anchor_lang::{
        prelude::*,
    },
    solana_program::{
        program_error::ProgramError,
    },
};

pub fn assert_signer(account: &AccountInfo) -> Result<()> {
    if account.is_signer {
        return Ok(());
    }
    return Err(ProgramError::MissingRequiredSignature.into())
}

pub fn assert_owned_by(account: &AccountInfo, owner: &Pubkey) -> Result<()> {
    if account.owner != owner {
        return Err(ProgramError::IllegalOwner.into())
    } else {
        return Ok(())
    }
}

pub fn assert_account_key(account_info: &AccountInfo, key: &Pubkey) -> Result<()> {
    if *account_info.key != *key {
        return Err(ProgramError::InvalidArgument.into())
    } else {
        return Ok(())
    }
}
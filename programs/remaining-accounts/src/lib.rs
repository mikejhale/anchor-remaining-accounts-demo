use anchor_lang::error_code;
use anchor_lang::prelude::*;

declare_id!("4NUxYa3SFp4XTPqvuh6Twt4EdkRrVN5G9gBNZUxyzapc");

#[program]
pub mod remaining_accounts {
    use super::*;

    pub fn create_team(ctx: Context<CreateTeam>, name: String) -> Result<()> {
        let team = &mut ctx.accounts.team;
        team.authority = *ctx.accounts.authority.key;
        team.name = name;
        team.total_score = 0;
        Ok(())
    }

    pub fn create_player(ctx: Context<CreatePlayer>, name: String) -> Result<()> {
        let player = &mut ctx.accounts.player;
        player.authority = *ctx.accounts.authority.key;
        player.team = ctx.accounts.team.key();
        player.name = name;
        player.score = 0;
        Ok(())
    }

    pub fn update_player_score(ctx: Context<UpdatePlayerScore>, score: u8) -> Result<()> {
        let player = &mut ctx.accounts.player;
        player.score = score;
        Ok(())
    }

    pub fn update_team_score(ctx: Context<UpdateTeamScore>) -> Result<()> {
        let team = &mut ctx.accounts.team;

        // get reamining_accounts
        let player_accounts = ctx.remaining_accounts;

        for player_account in player_accounts.iter() {
            let player = &mut Account::<Player>::try_from(player_account)?;

            // require authority for this player to be the Signer
            require!(
                player.authority == *ctx.accounts.authority.key,
                ErrorCode::InvalidAuthority
            );

            // require player belongs  to the team
            require!(player.team == team.key(), ErrorCode::InvalidTeam);

            team.total_score += player.score as u16;

            // reset player score
            // player.score = 0;
        }
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateTeam<'info> {
    #[account(init, payer = authority, space = 8 + Team::INIT_SPACE, seeds = [
        b"team",
        name.as_bytes(),
        authority.to_account_info().key.as_ref(),
    ], bump)]
    pub team: Account<'info, Team>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreatePlayer<'info> {
    #[account(init, payer = authority, space = 8 + Player::INIT_SPACE, seeds = [
        b"player",
        name.as_bytes(),
        authority.to_account_info().key.as_ref(),
    ], bump)]
    pub player: Account<'info, Player>,
    pub team: Account<'info, Team>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePlayerScore<'info> {
    #[account(mut, has_one = authority)]
    pub player: Account<'info, Player>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateTeamScore<'info> {
    #[account(mut, has_one = authority)]
    pub team: Account<'info, Team>,
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Team {
    authority: Pubkey,
    #[max_len(128)]
    pub name: String,
    pub total_score: u16,
}

#[account]
#[derive(InitSpace)]
pub struct Player {
    authority: Pubkey,
    team: Pubkey,
    #[max_len(128)]
    pub name: String,
    pub score: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid authority")]
    InvalidAuthority,
    #[msg("Invalid team")]
    InvalidTeam,
}

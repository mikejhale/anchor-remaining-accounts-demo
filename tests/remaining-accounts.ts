import {
  setProvider,
  getProvider,
  AnchorProvider,
  workspace,
  Program,
  utils,
  web3,
} from '@coral-xyz/anchor';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { expect } from 'chai';
import { RemainingAccounts } from '../target/types/remaining_accounts';

describe('remaining-accounts', async () => {
  // Configure the client to use the local cluster.
  const provider = AnchorProvider.env();
  setProvider(provider);
  const program = workspace.RemainingAccounts as Program<RemainingAccounts>;

  const teamManager = web3.Keypair.generate();
  const teamName = 'Team 1';

  let player1Pda = '';
  let player2Pda = '';
  let player3Pda = '';

  console.log('manager', teamManager.publicKey.toString());

  const [teamPda] = PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode('team'),
      utils.bytes.utf8.encode(teamName),
      teamManager.publicKey.toBuffer(),
    ],
    program.programId
  );

  it('Airdrops to team manager', async () => {
    const tx = await provider.connection
      .requestAirdrop(teamManager.publicKey, 100 * LAMPORTS_PER_SOL)
      .then((tx) => confirmTx(tx));

    const balance = await getProvider().connection.getBalance(
      teamManager.publicKey
    );

    expect(balance).to.equal(100 * LAMPORTS_PER_SOL);
  });

  it('Creates a team', async () => {
    const tx = await program.methods
      .createTeam(teamName)
      .accounts({
        team: teamPda,
        authority: teamManager.publicKey.toString(),
      })
      .signers([teamManager])
      .rpc();

    const team = await program.account.team.fetch(teamPda);
    expect(team.name).to.equal(teamName);
    expect(team.totalScore).to.equal(0);
    expect(team.authority.toString()).to.equal(
      teamManager.publicKey.toString()
    );
  });

  it('Creates Player 1', async () => {
    const playerName = 'Player 1';

    // create player pda
    const [playerPda] = PublicKey.findProgramAddressSync(
      [
        utils.bytes.utf8.encode('player'),
        utils.bytes.utf8.encode(playerName),
        teamManager.publicKey.toBuffer(),
      ],
      program.programId
    );

    player1Pda = playerPda.toString();

    const tx = await program.methods
      .createPlayer(playerName)
      .accounts({
        player: playerPda,
        team: teamPda,
        authority: teamManager.publicKey.toString(),
      })
      .signers([teamManager])
      .rpc();

    const player = await program.account.player.fetch(playerPda);
    expect(player.name).to.equal(playerName);
    expect(player.score).to.equal(0);
    expect(player.team.toString()).to.equal(teamPda.toString());
    expect(player.authority.toString()).to.equal(
      teamManager.publicKey.toString()
    );
  });

  it('Creates Player 2', async () => {
    const playerName = 'Player 2';

    // create player pda
    const [playerPda] = PublicKey.findProgramAddressSync(
      [
        utils.bytes.utf8.encode('player'),
        utils.bytes.utf8.encode(playerName),
        teamManager.publicKey.toBuffer(),
      ],
      program.programId
    );

    player2Pda = playerPda.toString();

    const tx = await program.methods
      .createPlayer(playerName)
      .accounts({
        player: playerPda,
        team: teamPda,
        authority: teamManager.publicKey.toString(),
      })
      .signers([teamManager])
      .rpc();

    const player = await program.account.player.fetch(playerPda);
    expect(player.name).to.equal(playerName);
    expect(player.score).to.equal(0);
    expect(player.team.toString()).to.equal(teamPda.toString());
    expect(player.authority.toString()).to.equal(
      teamManager.publicKey.toString()
    );
  });

  it('Creates Player 3', async () => {
    const playerName = 'Player 3';

    // create player pda
    const [playerPda] = PublicKey.findProgramAddressSync(
      [
        utils.bytes.utf8.encode('player'),
        utils.bytes.utf8.encode(playerName),
        teamManager.publicKey.toBuffer(),
      ],
      program.programId
    );

    player3Pda = playerPda.toString();

    const tx = await program.methods
      .createPlayer(playerName)
      .accounts({
        player: playerPda,
        team: teamPda,
        authority: teamManager.publicKey.toString(),
      })
      .signers([teamManager])
      .rpc();

    const player = await program.account.player.fetch(playerPda);
    expect(player.name).to.equal(playerName);
    expect(player.score).to.equal(0);
    expect(player.team.toString()).to.equal(teamPda.toString());
    expect(player.authority.toString()).to.equal(
      teamManager.publicKey.toString()
    );
  });

  it('gets players', async () => {
    const players = await program.account.player.all([
      {
        memcmp: {
          offset: 8 + 32,
          bytes: teamPda.toBase58(),
        },
      },
    ]);
    expect(players.length).to.equal(3);
  });

  it('Updates player 1 score', async () => {
    const tx = await program.methods
      .updatePlayerScore(1)
      .accounts({
        player: player1Pda,
        authority: teamManager.publicKey.toString(),
      })
      .signers([teamManager])
      .rpc();

    const player = await program.account.player.fetch(player1Pda);
    expect(player.score).to.equal(1);
  });

  it('updates player 2 score', async () => {
    const tx = await program.methods
      .updatePlayerScore(2)
      .accounts({
        player: player2Pda,
        authority: teamManager.publicKey.toString(),
      })
      .signers([teamManager])
      .rpc();

    const player = await program.account.player.fetch(player2Pda);
    expect(player.score).to.equal(2);
  });

  it('updates player 3 score', async () => {
    const tx = await program.methods
      .updatePlayerScore(3)
      .accounts({
        player: player3Pda,
        authority: teamManager.publicKey.toString(),
      })
      .signers([teamManager])
      .rpc();

    const player = await program.account.player.fetch(player3Pda);
    expect(player.score).to.equal(3);
  });

  it('updates team score', async () => {
    const players = await program.account.player.all([
      {
        memcmp: {
          offset: 8 + 32,
          bytes: teamPda.toBase58(),
        },
      },
    ]);
    expect(players.length).to.equal(3);

    const tx = await program.methods
      .updateTeamScore()
      .accounts({
        team: teamPda,
        authority: teamManager.publicKey.toString(),
      })
      .remainingAccounts(
        players.map((player) => {
          return {
            pubkey: player.publicKey,
            isWritable: false,
            isSigner: false,
          };
        })
      )
      .signers([teamManager])
      .rpc();

    const team = await program.account.team.fetch(teamPda);
    expect(team.totalScore).to.equal(6);
  });
});

const confirmTx = async (signature: string) => {
  const latestBlockhash = await getProvider().connection.getLatestBlockhash();
  await getProvider().connection.confirmTransaction(
    {
      signature,
      ...latestBlockhash,
    },
    'confirmed'
  );
};

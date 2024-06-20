import { log, BigInt } from '@graphprotocol/graph-ts';
import { Minter, TokenMint } from '../types/schema';
import { JellyMinted, MintingStarted } from '../types/templates/Minter/Minter';

export function handleJellyMinted(event: JellyMinted): void {
  let minter = Minter.load(event.address.toHexString()) as Minter;
  if (minter == null) {
    log.warning('Minter {} does not exist', [event.address.toHexString()]);
    return;
  }
  let tokenMintLpRewards = new TokenMint(
    event.transaction.hash.toHexString() + event.params.stakingRewardsContract.toHexString()
  );
  tokenMintLpRewards.minter = minter.id;
  tokenMintLpRewards.amount = event.params.mintedAmount;
  tokenMintLpRewards.timestamp = event.block.timestamp;
  tokenMintLpRewards.mintInitiator = event.params.sender;
  tokenMintLpRewards.benefactor = event.params.stakingRewardsContract;
  tokenMintLpRewards.epoch = event.params.epochId;
  tokenMintLpRewards.save();

  minter.lastMintedTimestamp = event.params.mintingPeriod;
  if (minter.benfactors.indexOf(event.params.stakingRewardsContract) == -1) {
    minter.benfactors.push(event.params.stakingRewardsContract);
  }
  minter.lastMintedAmount = event.params.mintedAmount;
  minter.mintingPeriod = event.params.mintingPeriod;
  minter.save();
}

export function handleMintingStarted(event: MintingStarted): void {
  let newMinter = new Minter(event.address.toHexString());
  newMinter.mintingPeriod = event.params.startTimestamp;
  newMinter.lastMintedTimestamp = event.params.startTimestamp;
  newMinter.lastMintedAmount = BigInt.fromI32(0);
  newMinter.benfactors = [];
  newMinter.save();
}

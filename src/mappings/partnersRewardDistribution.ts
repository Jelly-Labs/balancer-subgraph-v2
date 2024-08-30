import {
  Claimed as ClaimedEvent,
  DropAdded as DropAddedEvent,
} from '../types/templates/PartnersRewardDistribution/PartnersRewardDistribution';
import {
  PartnersMerkleTree,
  PartnersRewardDistributionSnapshot,
  UserPartnersRewardDistributionMetaData,
  UserClaimedPartnersRewardDistribution,
} from '../types/schema';
import { UserPartnersRewardDistributionMetaData as UserPartnersRewardDistributionMetaDataTemplate } from '../types/templates';
import { log, store, Bytes, Address, BigInt, dataSource } from '@graphprotocol/graph-ts';
import { getDistributionDataPartnerRewards, UserData } from './helpers/rewardDistribution';

export function handleClaimed(event: ClaimedEvent): void {
  let snapshotId = event.params.dropId;
  let address = event.params.claimant;

  let userClaimedData = UserClaimedPartnersRewardDistribution.load(address.toHexString());
  if (userClaimedData == null) {
    userClaimedData = new UserClaimedPartnersRewardDistribution(address.toHexString());
    userClaimedData.snapshots = [snapshotId];
  } else {
    let snapshots = userClaimedData.snapshots;
    snapshots.push(snapshotId);
    userClaimedData.snapshots = snapshots;
  }
  userClaimedData.save();
}

export function handleDropAdded(event: DropAddedEvent): void {
  let snapshotId = event.params.dropId; //primary key is dropId
  let ipfsCid = event.params.ipfs;
  let tokenAddress = event.params.token;
  let tokenAmount = event.params.amount;

  let snapshot = new PartnersRewardDistributionSnapshot(snapshotId.toString());
  snapshot.blockNumber = event.block.number;
  snapshot.blockTimestamp = event.block.timestamp;
  snapshot.ipfsCid = ipfsCid;
  snapshot.ipfsData = ipfsCid;
  snapshot.ipfsMerkleTree = ipfsCid;
  snapshot.tokenAmount = tokenAmount;
  snapshot.tokenAddress = tokenAddress;

  UserPartnersRewardDistributionMetaDataTemplate.create(ipfsCid);
  snapshot.save();
}

export function handleMetaData(content: Bytes): void {
  let lpMerkleTree = new PartnersMerkleTree(dataSource.stringParam());
  lpMerkleTree.merkleTree = content;
  lpMerkleTree.save();

  let distributionsData: UserData[] = getDistributionDataPartnerRewards(content);
  if (distributionsData.length == 0) {
    log.warning('There is a problem with geting data from ipfs', []);
    return;
  }

  for (let index = 0; index < distributionsData.length; index++) {
    let distribution = distributionsData[index];
    log.warning('Distribution Partners data to save {} {}', [distribution.amount, distribution.address]);
    let address = changetype<Address>(Address.fromHexString(distribution.address));
    let key = dataSource.stringParam() + '-' + address.toHexString();
    let userRewardDistributionMetadata = new UserPartnersRewardDistributionMetaData(key);
    userRewardDistributionMetadata.epoch = BigInt.fromString(distribution.epoch);
    userRewardDistributionMetadata.ipfsCid = dataSource.stringParam();
    userRewardDistributionMetadata.address = address;
    userRewardDistributionMetadata.value = BigInt.fromString(distribution.amount);
    userRewardDistributionMetadata.save();
  }
}

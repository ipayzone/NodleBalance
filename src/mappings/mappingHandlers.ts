import { SubstrateEvent, SubstrateBlock } from "@subql/types";
import { Transfer } from "../types/models/Transfer";
import { BalanceSet } from "../types/models/BalanceSet";
import { Deposit } from "../types/models/Deposit";
import { IDGenerator } from "../types/models/IDGenerator";
import { Reserved } from "../types/models/Reserved";
import { Unreserved } from "../types/models/Unreserved";
import { Withdraw } from "../types/models/Withdraw";
import { Slash } from "../types/models/Slash";
import { ReservRepatriated } from "../types/models/ReservRepatriated";
import { AccountInfo, EventRecord } from "@polkadot/types/interfaces/system";
import { Account, AccountSnapshot, Endowed } from "../types";

const enableTakeAccountSnapshot: boolean = false;

class AccountInfoAtBlock {
  accountId: string;
  freeBalance: bigint;
  reserveBalance: bigint;
  totalBalance: bigint;
  snapshotAtBlock: bigint;
}

/**
 * Handle block data from the current fetched block
 * @method handleBlock
 * @param {SubstrateBlock} block - The fetched block containing block data info
 */  
export async function handleBlock(block: SubstrateBlock): Promise<void> {
  let blockNumber = block.block.header.number.toBigInt();

  let events = block.events;
  let accounts4snapshot: string[] = [];
  for (let i = 0; i < events.length; i++) {
    let event = events[i];
    const {
      event: { method, section, index },
    } = event;

    if (section === "balances") {
      const eventType = `${section}/${method}`;
      logger.info(
        `
        Block: ${blockNumber}, Event ${eventType} :
        -------------
          ${JSON.stringify(event.toJSON(), null, 1)}  
        =============
        `
      );

      let accounts: string[] = [];
      switch (method) {
        case "Endowed":
          accounts = await handleEndowed(block, event);
          break;
        case "Transfer":
          accounts = await handleTransfer(block, event);
          break;
        case "BalanceSet":
          accounts = await handleBalanceSet(block, event);
          break;
        case "Deposit":
          accounts = await handleDeposit(block, event);
          break;
        case "Reserved":
          accounts = await handleReserved(block, event);
          break;
        case "Withdraw":
          accounts = await handleWithdraw(block, event);
          break;
        case "Unreserved":
          accounts = await handleUnreserved(block, event);
          break;
        case "Slash":
          accounts = await handleSlash(block, event);
          break;
        case "ReservRepatriated":
          accounts = await handleReservRepatriated(block, event);
          break;
        default:
          break;
      }

      for (const a of accounts) {
        if (accounts4snapshot.length > 0 && accounts4snapshot.indexOf(a) > -1) {
          continue;
        }
        accounts4snapshot.push(a);
      }
    }
  }

  if (enableTakeAccountSnapshot === true) {
    if (accounts4snapshot && accounts4snapshot.length > 0) {
      await takeAccountSnapshot(blockNumber, accounts4snapshot);
    }
  }
}

/**
 * Save target accounts info to db
 * @method takeAccountSnapshot
 * @param {bigint} blockNumber - The fetched block number
 * @param {string[]} accounts4snapshot - The accounts to be saved
 */  
async function takeAccountSnapshot(
  blockNumber: bigint,
  accounts4snapshot: string[]
) {
  for (const accountId of accounts4snapshot) {
    let accountInfo: AccountInfoAtBlock = await getAccountInfoAtBlockNumber(
      accountId,
      blockNumber
    );
    let id = `${blockNumber.toString()}-${accountId}`;
    let snapshotRecords = await AccountSnapshot.get(id);

    if (!snapshotRecords) {
      let newSnapshot: AccountSnapshot = AccountSnapshot.create({
        id: id,
        accountId: accountId,
        snapshotAtBlock: accountInfo.snapshotAtBlock,
        freeBalance: accountInfo.freeBalance,
        reserveBalance: accountInfo.reserveBalance,
        totalBalance: accountInfo.totalBalance,
      });
      await newSnapshot.save();
    }

    let accountRecord = await Account.get(accountId);
    if (!accountRecord) {
      accountRecord = Account.create({
        id: accountId,
        atBlock: blockNumber,
        freeBalance: accountInfo.freeBalance,
        reserveBalance: accountInfo.reserveBalance,
        totalBalance: accountInfo.totalBalance,
        aid: await getID(),
      });
      await accountRecord.save();
    } else {
      accountRecord.atBlock = blockNumber;
      accountRecord.freeBalance = accountInfo.freeBalance;
      accountRecord.reserveBalance = accountInfo.reserveBalance;
      accountRecord.totalBalance = accountInfo.totalBalance;
      await accountRecord.save();
    }
  }
}

/**
 * Get the latest accounts info via polkadot js 
 * @method getAccountInfoAtBlockNumber
 * @param {string} accountId - The accountId
 * @param {bigint} blockNumber - The block number
 */  
async function getAccountInfoAtBlockNumber(
  accountId: string,
  blockNumber: bigint
): Promise<AccountInfoAtBlock> {
  logger.info(`getAccountInfo at ${blockNumber} by addres:${accountId}`);
  const raw: AccountInfo = (await api.query.system.account(
    accountId
  )) as unknown as AccountInfo;

  let accountInfo: AccountInfoAtBlock;
  if (raw) {
    accountInfo = {
      accountId: accountId,
      freeBalance: raw.data.free.toBigInt(),
      reserveBalance: raw.data.reserved.toBigInt(),
      totalBalance: raw.data.free.toBigInt() + raw.data.reserved.toBigInt(),
      snapshotAtBlock: blockNumber,
    };
  } else {
    accountInfo = {
      accountId: accountId,
      freeBalance: BigInt(0),
      reserveBalance: BigInt(0),
      totalBalance: BigInt(0),
      snapshotAtBlock: blockNumber,
    };
  }
  logger.info(
    `getAccountInfo at ${blockNumber} : ${accountInfo.accountId}--${accountInfo.freeBalance}--${accountInfo.reserveBalance}--${accountInfo.totalBalance}`
  );
  return accountInfo;
}

/**
 * Handle event data at the fetched block
 * @method handleEvent
 * @param {SubstrateEvent} event - The event containing data about an event emitted
 */  
export async function handleEvent(event: SubstrateEvent): Promise<void> { }

const generaterID = "GENERATOR";

/**
 * Eeturn an auto-generated id for record id assignment
 * @method getID
 * @returns {bigint} an auto-generated id 
 */  
const getID = async () => {
  let generator = await IDGenerator.get(generaterID);
  if (generator == null) {
    generator = new IDGenerator(generaterID);
    generator.aID = BigInt(0).valueOf();
    await generator.save();
    logger.info(`first aID is : ${generator.aID}`);
    return generator.aID;
  } else {
    generator.aID = generator.aID + BigInt(1).valueOf();
    await generator.save();
    logger.info(`new aID is : ${generator.aID}`);
    return generator.aID;
  }
};

/**
 * Handle and save 'Endowed' event 
 * @method handleEndowed
 * @param {SubstrateBlock} block - The block containing data in fetch block
 * @param {EventRecord} substrateEvent - The event containing data about an event emitted
 */  
async function handleEndowed(
  block: SubstrateBlock,
  substrateEvent: EventRecord
): Promise<string[]> {
  const { event } = substrateEvent;
  const { timestamp: createdAt, block: rawBlock } = block;
  const { number: bn } = rawBlock.header;
  const [accountId, balanceChange] = event.data.toJSON() as [string, bigint];
  let blockNum = bn.toBigInt();

  logger.info(`New Endowed happened!: ${JSON.stringify(event)}`);

  let newEndowed = await Endowed.create({
    id: accountId,
    accountId: accountId,
    freeBalance: BigInt(balanceChange),
    reserveBalance: BigInt(0),
    totalBalance: BigInt(balanceChange),
    blockNumber: blockNum,
    aid: await getID(),
    timestamp: block.timestamp,
  });
  await newEndowed.save();

  return [accountId];
}

/**
 * Handle and save 'Transfer' event 
 * @method handleTransfer
 * @param {SubstrateBlock} block - The block containing data in fetch block
 * @param {EventRecord} substrateEvent - The event containing data about an event emitted
 */  
export const handleTransfer = async (
  block: SubstrateBlock,
  substrateEvent: EventRecord
): Promise<string[]> => {
  const { event } = substrateEvent;
  const { timestamp: createdAt, block: rawBlock } = block;
  const { number: bn } = rawBlock.header;
  const [from, to, balanceChange] = event.data.toJSON() as [
    string,
    string,
    bigint
  ];
  let blockNum = bn.toBigInt();

  logger.info(`New Transfer happened!: ${JSON.stringify(event)}`);

  // Create the new transfer entity
  let aID = await getID();
  const transfer = new Transfer(`${blockNum}-${event.index}-${aID}`);
  transfer.blockNumber = blockNum;
  transfer.fromAccountId = from;
  transfer.toAccountId = to;
  transfer.balanceChange = BigInt(balanceChange);
  transfer.aid = aID;
  transfer.timestamp = block.timestamp;

  await transfer.save();

  return [from, to];
};

/**
 * Handle and save 'BalanceSet' event 
 * @method handleBalanceSet
 * @param {SubstrateBlock} block - The block containing data in fetch block
 * @param {EventRecord} substrateEvent - The event containing data about an event emitted
 */  
//“AccountId” ‘s free balance =”Balance1”, reserve balance = “Balance2”
export const handleBalanceSet = async (
  block: SubstrateBlock,
  substrateEvent: EventRecord
): Promise<string[]> => {
  const { event } = substrateEvent;
  const { timestamp: createdAt, block: rawBlock } = block;
  const { number: bn } = rawBlock.header;
  const [accountToSet, balance1, balance2] = event.data.toJSON() as [
    string,
    bigint,
    bigint
  ];
  let blockNum = bn.toBigInt();

  logger.info(`BalanceSet happened!: ${JSON.stringify(event)}`);

  // Create the new BalanceSet entity
  let aID = await getID();
  const balanceSet = new BalanceSet(`${blockNum}-${event.index}-${aID}`);
  balanceSet.accountId = accountToSet;
  balanceSet.blockNumber = blockNum;
  balanceSet.aid = aID;
  balanceSet.balanceChange = BigInt(balance1) + BigInt(balance2);
  balanceSet.timestamp = block.timestamp;

  await balanceSet.save();
  return [accountToSet];
};

/**
 * Handle and save 'Deposit' event 
 * @method handleDeposit
 * @param {SubstrateBlock} block - The block containing data in fetch block
 * @param {EventRecord} substrateEvent - The event containing data about an event emitted
 */ 
//“AccountId” ’s free balance + “Balance”
export const handleDeposit = async (
  block: SubstrateBlock,
  substrateEvent: EventRecord
): Promise<string[]> => {
  const { event } = substrateEvent;
  const { timestamp: createdAt, block: rawBlock } = block;
  const { number: bn } = rawBlock.header;
  const [accountToSet, balance] = event.data.toJSON() as [string, bigint];
  let blockNum = bn.toBigInt();

  logger.info(`Deposit happened!: ${JSON.stringify(event)}`);

  // Create the new Deposit entity
  let aID = await getID();
  const deposit = new Deposit(`${blockNum}-${event.index}-${aID}`);
  deposit.accountId = accountToSet;
  deposit.blockNumber = blockNum;
  deposit.aid = aID;
  deposit.balanceChange = BigInt(balance);
  deposit.timestamp = block.timestamp;

  await deposit.save();
  return [accountToSet];
};

/**
 * Handle and save 'Reserved' event 
 * @method handleReserved
 * @param {SubstrateBlock} block - The block containing data in fetch block
 * @param {EventRecord} substrateEvent - The event containing data about an event emitted
 */ 
//“AccountId” ‘s free balance - “Balance”,“AccountId” ‘s reserve balance + “Balance”
export const handleReserved = async (
  block: SubstrateBlock,
  substrateEvent: EventRecord
): Promise<string[]> => {
  const { event } = substrateEvent;
  const { timestamp: createdAt, block: rawBlock } = block;
  const { number: bn } = rawBlock.header;
  const [accountToSet, balance] = event.data.toJSON() as [string, bigint];
  let blockNum = bn.toBigInt();

  logger.info(`Reserved happened!: ${JSON.stringify(event)}`);

  // Create the new Reserved entity
  let aID = await getID();
  const reserved = new Reserved(`${blockNum}-${event.index}-${aID}`);
  reserved.accountId = accountToSet;
  reserved.blockNumber = blockNum;
  reserved.aid = aID;
  reserved.balanceChange = BigInt(balance);
  reserved.timestamp = block.timestamp;

  await reserved.save();

  return [accountToSet];
};

/**
 * Handle and save 'Unreserved' event 
 * @method handleUnreserved
 * @param {SubstrateBlock} block - The block containing data in fetch block
 * @param {EventRecord} substrateEvent - The event containing data about an event emitted
 */ 
//“AccountId” ‘s free balance + “Balance”, “AccountId” ‘s reserve balance - “Balance”
export const handleUnreserved = async (
  block: SubstrateBlock,
  substrateEvent: EventRecord
): Promise<string[]> => {
  const { event } = substrateEvent;
  const { timestamp: createdAt, block: rawBlock } = block;
  const { number: bn } = rawBlock.header;
  const [accountToSet, balance] = event.data.toJSON() as [string, bigint];
  let blockNum = bn.toBigInt();

  logger.info(`Unreserved happened!: ${JSON.stringify(event)}`);

  // Create the new Reserved entity
  let aID = await getID();
  const unreserved = new Unreserved(`${blockNum}-${event.index}-${aID}`);
  unreserved.accountId = accountToSet;
  unreserved.blockNumber = blockNum;
  unreserved.aid = aID;
  unreserved.balanceChange = BigInt(balance);
  unreserved.timestamp = block.timestamp;

  await unreserved.save();

  return [accountToSet];
};

/**
 * Handle and save 'Withdraw' event 
 * @method handleWithdraw
 * @param {SubstrateBlock} block - The block containing data in fetch block
 * @param {EventRecord} substrateEvent - The event containing data about an event emitted
 */  
//“AccountId” ‘s free balance - “Balance”
export const handleWithdraw = async (
  block: SubstrateBlock,
  substrateEvent: EventRecord
): Promise<string[]> => {
  const { event } = substrateEvent;
  const { timestamp: createdAt, block: rawBlock } = block;
  const { number: bn } = rawBlock.header;
  const [accountToSet, balance] = event.data.toJSON() as [string, bigint];
  let blockNum = bn.toBigInt();

  logger.info(`Withdraw happened!: ${JSON.stringify(event)}`);

  // Create the new Withdraw entity
  let aID = await getID();
  const withdraw = new Withdraw(`${blockNum}-${event.index}-${aID}`);
  withdraw.accountId = accountToSet;
  withdraw.blockNumber = blockNum;
  withdraw.aid = aID;
  withdraw.balanceChange = BigInt(balance);
  withdraw.timestamp = block.timestamp;

  await withdraw.save();

  return [accountToSet];
};

/**
 * Handle and save 'Slash' event 
 * @method handleSlash
 * @param {SubstrateBlock} block - The block containing data in fetch block
 * @param {EventRecord} substrateEvent - The event containing data about an event emitted
 */  
//“AccountId” ‘s total balance - “Balance”
//(hard to determine if the slash happens on free/reserve)
//If it is called through internal method “slash”, then it will prefer free balance first but potential slash reserve if free is not sufficient.
//If it is called through internal method “slash_reserved”, then it will slash reserve only.
export const handleSlash = async (
  block: SubstrateBlock,
  substrateEvent: EventRecord
): Promise<string[]> => {
  const { event } = substrateEvent;
  const { timestamp: createdAt, block: rawBlock } = block;
  const { number: bn } = rawBlock.header;
  const [accountToSet, balance] = event.data.toJSON() as [string, bigint];
  let blockNum = bn.toBigInt();

  logger.info(`Slash happened!: ${JSON.stringify(event)}`);

  // Create the new Withdraw entity
  let aID = await getID();
  const slash = new Slash(`${blockNum}-${event.index}-${aID}`);
  slash.accountId = accountToSet;
  slash.blockNumber = blockNum;
  slash.aid = aID;
  slash.balanceChange = BigInt(balance);
  slash.timestamp = block.timestamp;

  await slash.save();

  return [accountToSet];
};

/* -ReserveRepatriated(AccountId, AccountId, Balance, Status) 
    AccountId: sender  
    AccountId: receiver
    Balance: amount of sender's reserve being transfered
    Status: Indicating the amount is added to receiver's reserve part or free part of balance.
    “AccountId1” ‘s reserve balance - “Balance”
    “AccountId2” ‘s “Status” balance + “Balance” (”Status” indicator of free/reserve part) */
/**
 * Handle and save 'ReservRepatriated' event 
 * @method handleReservRepatriated
 * @param {SubstrateBlock} block - The block containing data in fetch block
 * @param {EventRecord} substrateEvent - The event containing data about an event emitted
 */  
export const handleReservRepatriated = async (
  block: SubstrateBlock,
  substrateEvent: EventRecord
): Promise<string[]> => {
  const { event } = substrateEvent;
  const { timestamp: createdAt, block: rawBlock } = block;
  const { number: bn } = rawBlock.header;
  const [sender, receiver, balance, status] = event.data.toJSON() as [
    string,
    string,
    bigint,
    string
  ];
  let blockNum = bn.toBigInt();

  logger.info(`Repatraiated happened!: ${JSON.stringify(event)}`);

  //ensure that our account entities exist

  // Create the new Reserved entity
  let aID=await getID();
  const reservRepatriated = new ReservRepatriated(`${blockNum}-${event.index}-${aID}`);

  reservRepatriated.fromAccountId = sender;
  reservRepatriated.toAccountId = receiver;
  reservRepatriated.blockNumber = blockNum;
  reservRepatriated.aid = aID;
  reservRepatriated.balanceChange = BigInt(balance);
  reservRepatriated.timestamp = block.timestamp;

  await reservRepatriated.save();

  return [sender, receiver];
};
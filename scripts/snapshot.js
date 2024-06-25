import { client } from './client.js'
import fs from 'fs'

const TARGET_COIN_TYPE =
  '0x84d155fb70aebcc1391bf497d8fc139154be745765dfec57faef4704f4112c79::vaporeon::VAPOREON'
const START_CHECKPOINT = '28000000'
const END_CHECKPOINT = 31000000
const TX_DIGESTS_FILE = 'tx_digests.json'
const ADDRESSES_FILE = 'addresses.json'

// Load previous state if exists
let addresses = new Set()
let txDigests = []
let lastCheckpoint = START_CHECKPOINT

const save_digests_state = (digests, checkpoint) => {
  fs.writeFileSync(
    TX_DIGESTS_FILE,
    JSON.stringify({
      savedTxDigests: digests,
      savedCheckpoint: checkpoint,
    })
  )
}

if (fs.existsSync(ADDRESSES_FILE)) {
  const { savedAddresses } = JSON.parse(fs.readFileSync(ADDRESSES_FILE, 'utf8'))
  savedAddresses.forEach(address => addresses.add(address))
}

if (fs.existsSync(TX_DIGESTS_FILE)) {
  const { savedTxDigests, savedCheckpoint } = JSON.parse(fs.readFileSync(TX_DIGESTS_FILE, 'utf8'))
  txDigests = savedTxDigests
  lastCheckpoint = savedCheckpoint
} else {
  const get_checkpoints = async cursor => {
    const { data, hasNextPage, nextCursor } = await client.getCheckpoints({
      cursor,
      descendingOrder: false,
    })
    return { data, hasNextPage, nextCursor }
  }

  let cursor = lastCheckpoint

  while (parseInt(cursor) <= END_CHECKPOINT) {
    const { data, hasNextPage, nextCursor } = await get_checkpoints(cursor)
    txDigests.push(...data.flatMap(({ transactions }) => transactions))
    save_digests_state(txDigests, nextCursor)
    console.log(`Gathered ${txDigests.length} transaction digests up to checkpoint ${cursor}`)

    if (!hasNextPage) break
    cursor = nextCursor
  }
}

const get_transactions = async transactions => {
  const chunks = Array.from(chunkArray(transactions, 50))

  for (const chunk of chunks) {
    const txs = await client.multiGetTransactionBlocks({
      digests: chunk,
      options: { showBalanceChanges: true },
    })

    for (const tx of txs) {
      const { balanceChanges = [] } = tx
      process_balance_changes(balanceChanges)
    }

    console.log(`Processed ${chunk.length} transactions, total addresses found: ${addresses.size}`)
    save_state()
  }
}

/** Split an array in chunks of a specific size */
function* chunkArray(array, chunkSize) {
  for (let i = 0; i < array.length; i += chunkSize) {
    yield array.slice(i, i + chunkSize)
  }
}

const process_balance_changes = balance_changes => {
  balance_changes.forEach(({ coinType, owner: { AddressOwner } }) => {
    if (coinType === TARGET_COIN_TYPE && AddressOwner) {
      addresses.add(AddressOwner)
      console.log(`found: ${AddressOwner}`)
    }
  })
}

const save_state = () => {
  fs.writeFileSync(
    ADDRESSES_FILE,
    JSON.stringify({
      savedAddresses: Array.from(addresses),
    })
  )
}

const process_tx_digests = async () => {
  await get_transactions(txDigests)
  console.log('Processing complete.')
}

await process_tx_digests()

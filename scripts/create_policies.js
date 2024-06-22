import { Transaction } from '@mysten/sui/transactions'
import { keypair, client, kiosk_client } from './client.js'
import { TransferPolicyTransaction, percentageToBasisPoints } from '@mysten/kiosk'

const ROYALTY = 10
const MIN_TRANSFER_FEE = 100_000_000 // (0.1 sui)
const DEPLOYER = keypair.getPublicKey().toSuiAddress()
const ARESRPG = '0x37cf46b499f740e653644bd2f7a8ed97f248e8b3c69d5d12c97d7845a54c0cd8'

console.log('==================== [ CREATING POLICIES ] ====================')
console.log('public key:', DEPLOYER)
console.log('policy owner:', ARESRPG)
console.log(' ')

const tx = new Transaction()
const vaporeon_policy = new TransferPolicyTransaction({
  kioskClient: kiosk_client,
  transaction: tx,
})

await vaporeon_policy.create({
  type: `0xe3a1731e77249efa892e3a050c96f0de1be9bb5ef3c855a50766077be2d8411c::vaporeon::Vaporeon`,
  publisher: '0xdab5a97dfd95457fb63b78673f5377b8084fc354a491c525e6ccdf8786417891',
})

vaporeon_policy
  .addLockRule()
  .addRoyaltyRule(percentageToBasisPoints(ROYALTY), MIN_TRANSFER_FEE)
  .addPersonalKioskRule()
  .shareAndTransferCap(ARESRPG)

// Sign and execute transaction block.
const result = await client.signAndExecuteTransaction({
  transaction: tx,
  signer: keypair,
  options: { showEffects: true },
})

console.log('policies created:', result.digest)

console.log('==================== [ x ] ====================')

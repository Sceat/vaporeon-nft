import { Transaction } from '@mysten/sui/transactions'
import { keypair, client, kiosk_client } from './client.js'
import { TransferPolicyTransaction, percentageToBasisPoints } from '@mysten/kiosk'

const ROYALTY = 10
const MIN_TRANSFER_FEE = 100_000_000 // (0.1 sui)
const DEPLOYER = keypair.getPublicKey().toSuiAddress()
const ARESRPG = '0x37cf46b499f740e653644bd2f7a8ed97f248e8b3c69d5d12c97d7845a54c0cd8'

// const POLICY_CAP = '0xcc1a15a47402f401c1ede56a0eb788468759727fbb1c6443c3428f45b34f2886'

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
  type: `0x270f7a64af25345c30b2f52c59b34a7d3b71c71714b4371b494cc525a3500d8b::vaporeon::Vaporeon`,
  publisher: '0x85387cee58a29da4f5de3f17c258a9d9b104f85b4e3d62cb2a132c26b339f12a',
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

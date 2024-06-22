import { client, keypair } from './client.js'
import { Transaction } from '@mysten/sui/transactions'

const tx = new Transaction()

console.log('==================== [ Burning upgrade cap ] ====================')
console.log('public key:', keypair.getPublicKey().toSuiAddress())
console.log(' ')

tx.transferObjects(['0x77ae7604d0b482f5e96af012bbd98e50946bc574ceaf107bd6b7d47679c907b4'], '0x0')

const result = await client.signAndExecuteTransaction({
  signer: keypair,
  transaction: tx,
  options: {
    showEffects: true,
  },
})

console.log('digest:', result.digest)
console.log('==================== [ x ] ====================')

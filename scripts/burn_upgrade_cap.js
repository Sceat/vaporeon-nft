import { client, keypair } from './client.js'
import { Transaction } from '@mysten/sui/transactions'

const tx = new Transaction()

console.log('==================== [ Burning upgrade cap ] ====================')
console.log('public key:', keypair.getPublicKey().toSuiAddress())
console.log(' ')

tx.transferObjects(['0x4da78c88067f9e7737d6c7e47fe5e0114a4d32cd3dea83701089c62f664bbe01'], '0x0')

const result = await client.signAndExecuteTransaction({
  signer: keypair,
  transaction: tx,
  options: {
    showEffects: true,
  },
})

console.log('digest:', result.digest)
console.log('==================== [ x ] ====================')


// BURNED: AQge8LtEeXrQ4saVkx2ZTLcg5D6HsTmtkXyeySxxenfL
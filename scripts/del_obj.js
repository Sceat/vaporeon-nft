import { client, keypair } from './client.js'
import { Transaction } from '@mysten/sui/transactions'

const tx = new Transaction()

console.log('==================== [ Deleting objects ] ====================')
console.log('public key:', keypair.getPublicKey().toSuiAddress())
console.log(' ')

const { data } = await client.getOwnedObjects({
  owner: keypair.getPublicKey().toSuiAddress(),
  filter: {
    StructType:
      '0x270f7a64af25345c30b2f52c59b34a7d3b71c71714b4371b494cc525a3500d8b::vaporeon::VaporeonKey',
  },
})

const objs = data.map(({ data: { objectId } }) => objectId)

tx.transferObjects(objs, '0x0')

// const result = await client.signAndExecuteTransaction({
//   signer: keypair,
//   transaction: tx,
//   options: {
//     showEffects: true,
//   },
// })

console.log('transferred objects:', objs.length, 'digest:', result.digest)
console.log('==================== [ x ] ====================')

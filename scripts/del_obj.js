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
      '0xe3a1731e77249efa892e3a050c96f0de1be9bb5ef3c855a50766077be2d8411c::vaporeon::VaporeonKey',
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

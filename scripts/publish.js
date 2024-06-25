import { client, keypair } from './client.js'
import { Transaction } from '@mysten/sui/transactions'
import { execSync } from 'child_process'

const txb = new Transaction()

console.log('==================== [ CREATING COLLECTION ] ====================')
console.log('public key:', keypair.getPublicKey().toSuiAddress())
console.log(' ')

const [, cli_result] = execSync(
  `
  sui client switch --env mainnet && \
  sui move build --dump-bytecode-as-base64 --path ./`,
  {
    encoding: 'utf-8',
  }
).split('\n')

const { modules, dependencies } = JSON.parse(cli_result)

const [upgrade_cap] = txb.publish({
  modules,
  dependencies,
})

txb.transferObjects([upgrade_cap], keypair.getPublicKey().toSuiAddress())

console.log('publishing package...')

const result = await client.signAndExecuteTransaction({
  signer: keypair,
  transaction: txb,
  options: {
    showEffects: true,
  },
})

if (!result.digest) throw new Error('Failed to publish package.')

console.dir(result, { depth: Infinity })
console.log('==================== [ x ] ====================')

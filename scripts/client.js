import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client'
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography'
import { KioskClient, Network } from '@mysten/kiosk'

const { PRIVATE_KEY = '' } = process.env

const keypair = Ed25519Keypair.fromSecretKey(decodeSuiPrivateKey(PRIVATE_KEY).secretKey)
const client = new SuiClient({
  url: getFullnodeUrl(Network.TESTNET),
})
const kiosk_client = new KioskClient({
  client,
  network: Network.TESTNET,
})

export { keypair, client, kiosk_client }

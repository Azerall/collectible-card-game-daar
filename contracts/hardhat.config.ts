import 'dotenv/config'
import 'hardhat-deploy'
import { HardhatUserConfig } from 'hardhat/config'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import 'hardhat-gas-reporter'
import 'hardhat-abi-exporter'
import fs from 'fs'

// Liste des adresses d'admins
const admins = readAdminAddresses('../admins.json')

// Fonction pour lire les adresses d'admins à partir d'un fichier
function readAdminAddresses(filePath: string): { address: string; privateKey: string }[] {
  const data = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(data) // Lire le fichier JSON
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
const config: HardhatUserConfig = {
  solidity: '0.8.20',
  paths: {
    deploy: './deploy',
    sources: './src',
  },
  namedAccounts: {
    deployer: { default: 0 },
    admin: { default: 0 },
    second: { default: 1 },
    random: { default: 8 },
  },
  networks: {
    hardhat: {
      accounts: admins.map(admin => ({
        privateKey: admin.privateKey,
        balance: '99000000000000000000', // 99 ETH
      })),
    },
  },
  abiExporter: {
    runOnCompile: true,
    path: '../frontend/src/abis',
    clear: true,
    flat: true,
    only: [],
    pretty: true,
  },
  typechain: {
    outDir: '../typechain',
  },
}

export default config

import 'dotenv/config'
import { DeployFunction } from 'hardhat-deploy/types'
import fs from 'fs'

// Liste des adresses d'admins
const admins = readAdminAddresses('../admins.json')

// Fonction pour lire les adresses d'admins à partir d'un fichier
function readAdminAddresses(filePath: string): { address: string; privateKey: string }[] {
  const data = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(data) // Lire le fichier JSON
}

const deployer: DeployFunction = async hre => {
  if (hre.network.config.chainId !== 31337) return
  const { deployer } = await hre.getNamedAccounts()
  const adminAddresses = admins.map(admin => admin.address);
  await hre.deployments.deploy('Main', { from: deployer, log: true, args: [adminAddresses] })
}

export default deployer

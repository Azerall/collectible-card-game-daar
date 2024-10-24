import 'dotenv/config'
import { DeployFunction } from 'hardhat-deploy/types'
import fs from 'fs'
import { ethers } from 'hardhat'

// Liste des adresses d'admins
const admins = readAddresses('../admins.json')
const users = readAddresses('../users.json')

// Fonction pour lire les adresses d'admins à partir d'un fichier
function readAddresses(filePath: string): { address: string; privateKey: string }[] {
  const data = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(data)
}

const deployer: DeployFunction = async hre => {
  if (hre.network.config.chainId !== 31337) return
  const { deployer } = await hre.getNamedAccounts()

  // Distribuer de l'argent aux admins et aux utilisateurs
  const [signer] = await ethers.getSigners()
  for (const admin of admins) {
    const tx = await signer.sendTransaction({
      to: admin.address,
      value: ethers.utils.parseEther("99.9"),
    })
  }
  for (const user of users) {
    const tx = await signer.sendTransaction({
      to: user.address,
      value: ethers.utils.parseEther("10"),
    })
  }

  await hre.deployments.deploy('Main', { from: deployer, log: true, args: [admins.map(admin => admin.address)] })
}

export default deployer

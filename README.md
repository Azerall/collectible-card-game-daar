# Collectible Card Game

## Résumé de l'application
Ce projet a été réalisée dans le cadre de l'unité d'enseignement **Développement des Algorithmes d’Application Réticulaire (DAAR)** de l'année 2024. Il met en oeuvre une application qui est un jeu de cartes à collectionner basé sur la blockchain Ethereum. Les cartes sont créées et échangées sous forme de NFTs (ERC-721).

## Fonctionnalités
- **Créer une collection** : Les super-admins peuvent créer des collections de cartes.
- **Minter des cartes** : Les super-admins peuvent mint des cartes à des utilisateurs.
- **Visualiser les cartes des utilisateurs** : Les utilisateurs peuvent voir leurs propres cartes ainsi que celles des autres.
- **Échanger des cartes** : Les utilisateurs peuvent s'échanger leurs cartes.
- **Acheter et ouvrir un booster** : Les utilisateurs peuvent acheter des boosters et les ouvrir pour obtenir des cartes aléatoires.

## Configurations
- `HardHat` : Pour gérer et déployer les contrats Solidity.
- `Metamask` : Pour interagir avec la blockchain Ethereum. Pour permettre la connexion à notre environnement local, un réseau Hardhat doit être ajouté dans Metamask avec l'URL RPC `http://localhost:8545` et le Chain ID `31337`.
- `Node.js` ainsi que `NPM ou Yarn` : Pour la gestion des dépendances du frontend et son lancement.
- `Go` : Pour le lancement du backend. La version **1.21.0** est au minimum requise pour pouvoir supporter notre base de données SQLite.

## Installation
### Pour lancer l'application :
1. **Contrats :**
   - Se placer dans `collectible-card-game-daar/contracts`.
   - Compiler les contrats avec la commande :
     ```bash
     npx hardhat compile
     ```

2. **Serveur :**
   - Se placer dans `collectible-card-game-daar/backend`.
   - Lancer le serveur Go avec :
     ```bash
     go run server.go
     ```

3. **Frontend :**
   - Se placer dans `collectible-card-game-daar`.
   - Installer les dépendances avec Yarn :
     ```bash
     yarn
     ```
   - Lancer l'application avec :
     ```bash
     yarn dev
     ```

## Configuration Super-admin et Utilisateur
- **Se mettre en super-admin avec de l'argent virtuel** :
  - Renseigner votre adresse et clé privée Metamask dans le fichier `admins.json` pour vous autoriser à créer et minter des cartes, et obtenir de l'argent virtuel à utiliser dans le jeu.

- **Ajouter de l'argent virtuel en tant qu'utilisateur** :
  - Renseigner votre adresse et clé privée Metamask dans le fichier `users.json` pour obtenir de l'argent virtuel à utiliser dans le jeu.

## Important : Patience lors des transactions Metamask
Après chaque opération nécessitant une approbation dans Metamask, assurez-vous d’attendre la fin complète de la transaction avant de procéder à une autre action pour éviter toute incohérence ou erreur. En effet, Metamask peut prendre quelques secondes pour finaliser les opérations sur la blockchain.

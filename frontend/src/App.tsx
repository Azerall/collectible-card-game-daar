import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './styles.module.css'
import * as ethereum from '@/lib/ethereum'
import * as main from '@/lib/main'

type Canceler = () => void
const useAffect = (
  asyncEffect: () => Promise<Canceler | void>,
  dependencies: any[] = []
) => {
  const cancelerRef = useRef<Canceler | void>()
  useEffect(() => {
    asyncEffect()
      .then(canceler => (cancelerRef.current = canceler))
      .catch(error => console.warn('Uncatched error', error))
    return () => {
      if (cancelerRef.current) {
        cancelerRef.current()
        cancelerRef.current = undefined
      }
    }
  }, dependencies)
}

const useWallet = () => {
  const [details, setDetails] = useState<ethereum.Details>()
  const [contract, setContract] = useState<main.Main>()
  useAffect(async () => {
    const details_ = await ethereum.connect('metamask')
    if (!details_) return
    setDetails(details_)
    const contract_ = await main.init(details_)
    if (!contract_) return
    setContract(contract_)
  }, [])
  return useMemo(() => {
    if (!details || !contract) return
    return { details, contract }
  }, [details, contract])
}

export const App = () => {
  const wallet = useWallet()
  const [collectionName, setCollectionName] = useState('')
  
  // Gestion de la création d'une nouvelle collection
  const handleCreateCollection = async () => {
    if (!wallet || !wallet.contract) return
    try {
      // Appel au backend pour récupérer les données de la collection via l'API Pokémon TCG
      const pokemonSetData = await fetch(`/api/pokemon-set?name=${collectionName}`).then(res => res.json())

      const imgURIs = pokemonSetData.cards.map((card: any) => card.imageUrl)
      const cardCount = imgURIs.length

      // Appel du smart contract pour créer la collection
      await wallet.contract.createCollection(pokemonSetData.name, cardCount, imgURIs)
      alert('Collection créée avec succès !')
    } catch (error) {
      console.error('Erreur lors de la création de la collection:', error)
    }
  }

  return (
    <div className={styles.body}>
      <h1>Welcome to Pokémon TCG</h1>

      {/* Section pour créer une collection */}
      <div>
        <input
          type="text"
          placeholder="Nom de la collection"
          value={collectionName}
          onChange={(e) => setCollectionName(e.target.value)}
          className={styles.input}
        />
        <button onClick={handleCreateCollection} className={styles.button}>
          Créer la collection
        </button>
      </div>

      {/* Afficher la collection du propriétaire */}
      <h2>Votre Collection</h2>
      <div className={styles.collection}>
        {wallet && wallet.collection && wallet.collection.length > 0 ? (
          wallet.collection.map((card, index) => (
            <div key={index} className={styles.card}>
              <img src={card.imgURI} alt={`Card ${index}`} />
              <p>Card #{index + 1}</p>
            </div>
          ))
        ) : (
          <p>Pas de cartes dans votre collection.</p>
        )}
      </div>
      
    </div>
  )
}

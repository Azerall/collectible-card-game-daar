import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './styles.module.css'
import * as ethereum from '@/lib/ethereum'
import * as main from '@/lib/main'

import { HomePage } from './homePage'
import { CollectionPage } from './collectionPage'
import { UserPage } from './userPage'
import { MintPage } from './mintPage'

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

  const [page, setPage] = useState("homePage"); // La première page affichée est la page de connexion
  
  // Fonction pour changer de page
  const changePage = (page: string) => {
    setPage(page);
  }

  return (
    <div className={styles.body}>
      <div className={styles.maincontent}>
        <header className={styles.header}>
          <nav className={styles.nav}>
            <img src="/logo.png" alt="Logo" className={styles.logo} />
            <ul className={styles.navlinks}>
              <li onClick={() => changePage("homePage")}>Accueil</li>
              <li onClick={() => changePage("collectionPage")}>Collections</li>
              <li onClick={() => changePage("userPage")}>Utilisateurs</li>
              <li onClick={() => changePage("mintPage")}>Mint</li>
            </ul>
          </nav>
        </header>
        { page==="homePage"? <HomePage/> : "" }
        { page==="collectionPage"? <CollectionPage/> : "" }
        { page==="userPage"? <UserPage/> : "" }
        { page==="mintPage"? <MintPage/> : "" }
      </div>
      
    </div>
  )

  /*return (
    <div className={styles.body}>
      <h1>Welcome to Pokémon TCG</h1>

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
  )*/
}

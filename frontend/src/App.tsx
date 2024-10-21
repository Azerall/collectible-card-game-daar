  import { useEffect, useMemo, useRef, useState } from 'react'
  import styles from './styles.module.css'
  import * as ethereum from '@/lib/ethereum'
  import * as main from '@/lib/main'
  import Web3 from 'web3';

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

  type Card = {
    id: string;
    name: string;
    imageUrl: string;
    SetID: string;
  };

  type Collection = {
    id: string;
    name: string;
    Cards: Card[];
  };

  export const App = () => {
    const wallet = useWallet()
    const web3 = new Web3('http://localhost:8545');

    const [accounts, setAccounts] = useState<string[]>()
    const [userCollections, setUserCollections] = useState<Collection[]>([]);
    const [page, setPage] = useState("homePage");

    useEffect(() => {
      if (!wallet) return
      console.log('wallet', wallet)
    } , [wallet])

    useEffect(() => {
      const fetchAccounts = async () => {
        const accounts_ = await web3.eth.getAccounts()
        console.log('accounts', accounts_)
        setAccounts(accounts_)
      }
      fetchAccounts()
    }, [])
    
    // Fonction pour changer de page
    const changePage = (page: string) => {
      setPage(page);
    }

    // Récupérer toutes les collections depuis le backend
    useEffect(() => {
      const fetchUserCollections = async () => {
        try {
          const response = await fetch('http://localhost:8080/collections');
          const collections = await response.json();
          setUserCollections(collections);
          console.log(collections);
        } catch (error) {
          console.error('Error fetching collections:', error);
        }
      };

      fetchUserCollections();
    }, []);

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
          { page==="collectionPage"? <CollectionPage userCollections={userCollections} setUserCollections={setUserCollections} wallet={wallet}/> : "" }
          { page==="userPage"? <UserPage/> : "" }
          { page==="mintPage"? <MintPage  userCollections={userCollections} wallet={wallet} accounts={accounts}/> : "" }
        </div>
        
      </div>
    )
  }

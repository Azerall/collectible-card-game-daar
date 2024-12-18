import { useEffect, useState } from 'react'
import styles from './styles.module.css'
import * as ethereum from '@/lib/ethereum'
import * as main from '@/lib/main'

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

type Booster = {
  name: string;
  setID: string;
  Cards: Card[];
  isOpened?: boolean;
}

interface BoosterPageProps {
  userCollections: Collection[]
  setSelectedUserFromBoosterPage: (page: string) => void
  changePage: (page: string) => void
  wallet: { details: ethereum.Details, contract: main.Main } | undefined
  accounts: string[] | undefined
}

export const BoosterPage = ({ userCollections, setSelectedUserFromBoosterPage, changePage, wallet, accounts }: BoosterPageProps) => {

  const [selectedSet, setSelectedSet] = useState('');
  const [boosters, setBoosters] = useState<Booster[]>([]);

  const [openedBooster, setOpenedBooster] = useState<Booster | null>(null);
  const [isBoosterOpen, setIsBoosterOpen] = useState(false);

  // Récupérer les boosters de l'utilisateur
  useEffect(() => {
    const getUserBoosters = async () => {
      try {
        const userBoosters: Booster[] = [];
        const [boosterNames, boosterOpened] = await wallet?.contract.getBoostersOfOwner();
        // Retirer les chaines vides
        const filteredBoosterNames = boosterNames.filter((name: string) => name !== '');
        for (let i = 0; i < filteredBoosterNames.length; i++) {
          const response = await fetch(`http://localhost:8080/booster?name=${filteredBoosterNames[i]}`, {
            method: 'GET',
          });
          if (response.ok) {
            const booster = await response.json();
            const userBooster = { name: filteredBoosterNames[i], setID: booster.booster.SetID, Cards: booster.booster.cards, isOpened: boosterOpened[i] };    
            userBoosters.push(userBooster);
          }
        }
        setBoosters(userBoosters);
      } catch (error) {
        console.error('Erreur lors de la récupération des sets :', error);
      }
    };
    getUserBoosters();
  }, []);

  // Fonction pour créer un booster
  const handleCreateBooster = async () => {
    if (!selectedSet) {
      alert('Veuillez sélectionner un set.');
      return;
    }
    try {
      const response = await fetch(`http://localhost:8080/create-booster?id=${selectedSet}`, {
        method: 'POST',
      });
      if (response.ok) {
        const booster = await response.json();
        console.log('Booster créé :', booster.booster);
        try {
          await wallet?.contract.createBooster(booster.booster.id, booster.booster.SetID, booster.booster.cards.length);
          
          alert('Booster créé avec succès !');
          setBoosters([...boosters, { name: booster.booster.id, setID: booster.booster.SetID, Cards: booster.booster.cards, isOpened: false }]);
        } catch (contractError) {
          if ((contractError as any).code === "ACTION_REJECTED") {
            alert('Vous avez refusé la transaction.');
            await fetch(`http://localhost:8080/booster?name=${booster.booster.id}`, {
              method: 'DELETE',
            });
          } else {
            console.log(contractError);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la création de la collection :', error);
    }
  };

  // Fonction pour ouvrir un booster
  const handleOpenBooster = async (booster: Booster) => {
    console.log('Ouverture du booster :', booster);
    try {
      await wallet?.contract.openBooster(
        extractBoosterId(booster.name),
        booster.Cards.map((card) => card.id),
        booster.Cards.map((card) => card.name),
        booster.Cards.map((card) => card.imageUrl)
      );
      booster.isOpened = true;
      openBooster(booster);
    } catch (contractError) {
      if ((contractError as any).code === "ACTION_REJECTED") {
        alert('Vous avez refusé la transaction.');
      } else {
        console.log(contractError);
      }
    }
  };

  function extractBoosterId(boosterName: string) {
    const parts = boosterName.split(" ");
    const idString = parts[parts.length - 1];
    const id = parseInt(idString, 10);
    return id;
  }

  const openBooster = (booster: Booster | null) => {
    setOpenedBooster(booster);
    setIsBoosterOpen(!isBoosterOpen);
  };


  return (
    <div className={styles.container}>

      {isBoosterOpen ? 

        (<section className={styles.section}>
          <div className="cardForm">
            <div className={styles.closeButton} onClick={() => openBooster(null)}>
              &#8592;
            </div>
            <h2>Vous avez obtenu :</h2>
            <div className={styles.cardsContainer}>
              {openedBooster?.Cards.map((card) => (
                <div key={card.id} className={styles.card} onClick={() => { if (accounts) { changePage("userPage"); setSelectedUserFromBoosterPage(accounts[0]); } }}>
                  <img src={card.imageUrl} alt={card.name} className={styles.cardImage}/>
                </div>
              ))}
            </div>
          </div> 
        </section>)
        
        :
          
        (<div>
          <section className={styles.section}>
            <h2>Acheter un booster d'une collection</h2>
            <div className={styles.collectionForm}>
              <select
                value={selectedSet}
                onChange={(e) => setSelectedSet(e.target.value)}
                className={styles.select}>
                <option value="">Sélectionnez une collection</option>
                {userCollections.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.name}
                  </option>
                ))}
              </select>
              <button onClick={handleCreateBooster} className={styles.createButton} >
                Acheter
              </button>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Vos boosters</h2>
            <div className={styles.collectionGrid}>
              {boosters.map((booster) => (
                <div key={booster.name} className={styles.collectionItem}>
                  <img 
                    src={`https://images.pokemontcg.io/${booster.setID}/logo.png`} 
                    alt={booster.setID} 
                    className={styles.collectionImage} 
                  />
                  <p>{booster.name}</p>
                  <button
                    className={`${styles.createButton} ${booster.isOpened ? styles.disabledButton : ''}`}
                    disabled={booster.isOpened}
                    onClick={() => handleOpenBooster(booster)}
                  >
                    {booster.isOpened ? 'Ouvert' : 'Ouvrir'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>)
      }
    </div>
  );
};

export default BoosterPage;
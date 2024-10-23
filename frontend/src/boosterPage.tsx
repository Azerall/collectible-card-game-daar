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
  isOpened?: boolean;
}

interface BoosterPageProps {
  userCollections: Collection[]
  wallet: { details: ethereum.Details, contract: main.Main } | undefined
  accounts: string[] | undefined
}

export const BoosterPage = ({ userCollections, wallet, accounts }: BoosterPageProps) => {

  const [selectedSet, setSelectedSet] = useState('');
  const [boosters, setBoosters] = useState<Booster[]>([]);

  // Récupérer les boosters de l'utilisateur
  useEffect(() => {
    const getUserBoosters = async () => {
      try {
        const [boosterNames, boosterCollectionIds, boosterOpened] = await wallet?.contract.getBoostersOfOwner();
        const userBoosters = boosterNames.map((name: string, index: number) => ({ name, setID: boosterCollectionIds[index], isOpened: boosterOpened[index] }));
        setBoosters(userBoosters);
        console.log('Boosters de l\'utilisateur :', userBoosters);
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
            const boosterId = await wallet?.contract.createBooster(
              booster.booster[0].SetID, 
              booster.booster.length, 
              booster.booster.map((card: any) => card.id), 
              booster.booster.map((card: any) => card.name), 
              booster.booster.map((card: any) => card.imageUrl)
            );
            alert('Booster créé avec succès !');
            setBoosters([...boosters, { name: "Booster "+boosterId.value, setID: booster.booster[0].SetID }]);
          } catch (contractError) {
            if ((contractError as any).code === "ACTION_REJECTED") {
              alert('Vous avez refusé la transaction.');
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
    try {
      await wallet?.contract.openBooster(extractBoosterId(booster.name));
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

  return (
    <div className={styles.container}>

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
            Créer
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
              <button className={styles.createButton} disabled={booster.isOpened}>
                {booster.isOpened ? 'Ouvert' : 'Ouvrir'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default BoosterPage;
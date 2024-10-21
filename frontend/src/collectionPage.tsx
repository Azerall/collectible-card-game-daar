import React from 'react'
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

interface CollectionPageProps {
  userCollections: Collection[]
  setUserCollections: React.Dispatch<React.SetStateAction<Collection[]>>
  setSelectedCollectionFromCollectionPage: (page: string) => void
  changePage: (page: string) => void
  wallet: { details: ethereum.Details, contract: main.Main } | undefined
}
export const CollectionPage = ({ userCollections, setUserCollections, setSelectedCollectionFromCollectionPage, changePage, wallet }: CollectionPageProps) => {
    
  const [availableSets, setAvailableSets] = useState<[string, string][]>([]);
  const [selectedSet, setSelectedSet] = useState('');
  const [loading, setLoading] = useState(false);

  // Récupérer les sets disponibles depuis le backend
  useEffect(() => {
    const fetchAvailableSets = async () => {
      try {
        const response = await fetch('http://localhost:8080/pokemon-sets');
        const sets = await response.json();
        setAvailableSets(sets.sets);
      } catch (error) {
        console.error('Error fetching sets:', error);
      }
    };

    fetchAvailableSets();
  }, []);
  
  // Récupérer toutes les collections depuis le backend
  useEffect(() => {
    const fetchUserCollections = async () => {
      try {
        const response = await fetch('http://localhost:8080/collections');
        const collections = await response.json();
        setUserCollections(collections);
        console.log('userCollections :', collections);
      } catch (error) {
        console.error('Error fetching collections:', error);
      }
    };

    fetchUserCollections();
  }, []);

  // Fonction pour créer une collection
  const handleCreateCollection = async () => {
    if (!selectedSet) {
      alert('Veuillez sélectionner un set.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/pokemon-set?id=${selectedSet}`, {
        method: 'POST',
      });
      if (response.ok) {
        const set = await response.json();
        try {
          await wallet?.contract.createCollection(set.set.id, set.set.name, set.set.Cards.length);
          await fetch(`http://localhost:8080/collections?id=${set.set.id}`, {
            method: 'POST',
          });
          setUserCollections([...userCollections, set.set]);
          alert('Collection enregistrée sur la blockchain avec succès !');
        } catch (contractError) {
          alert("Vous n'êtes pas autorisé à créer une collection (super-admin requis) !");
        }
      } else if (response.status === 400) {
        alert("Le set existe déjà dans la base de données.");
      }
    } catch (error) {
      console.error('Error creating collection:', error)
    }
    setLoading(false);
    
  };

  return (
    <div className={styles.container}>

      <section className={styles.section}>
        <h2>Créez une collection</h2>
        <div className={styles.collectionForm}>
          <select
            value={selectedSet}
            onChange={(e) => setSelectedSet(e.target.value)}
            className={styles.select}>
            <option value="">Sélectionnez un set</option>
            {availableSets.map((set) => (
              <option key={set[0]} value={set[0]}>
                {set[1]}
              </option>
            ))}
          </select>
          <button onClick={handleCreateCollection} className={styles.createButton} disabled={loading}>
            {loading ? 'Création...' : 'Créer'}
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Vos collections</h2>
        <div className={styles.collectionGrid}>
          {userCollections.map((collection) => (
            <div key={collection.name} className={styles.collectionItem} onClick={() => { changePage("mintPage"); setSelectedCollectionFromCollectionPage(collection.name)}}>
              <img 
                src={`https://images.pokemontcg.io/${collection.id}/logo.png`} 
                alt={collection.name} 
                className={styles.collectionImage} 
              />
              <p>{collection.name}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CollectionPage;
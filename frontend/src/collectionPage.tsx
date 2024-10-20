import React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './styles.module.css'

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
}
export const CollectionPage = ({ userCollections, setUserCollections }: CollectionPageProps) => {
    
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
        console.log(collections);
      } catch (error) {
        console.error('Error fetching collections:', error);
      }
    };

    fetchUserCollections();
  }, []);

  // Fonction pour créer une collection
  const handleCreateCollection = async () => {
    if (!selectedSet) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/pokemon-set?id=${selectedSet}`, {
        method: 'POST',
      });
      if (response.ok) {
        alert('Collection créée avec succès !');
        const set = await response.json();
        setUserCollections([...userCollections, set.set]);
      }
    } catch (error) {
      console.error('Error creating collection:', error);
    }
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
            <div key={collection.name} className={styles.collectionItem}>
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
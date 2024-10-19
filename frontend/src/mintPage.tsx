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

interface MintPageProps {
  userCollections: Collection[]
}

export const MintPage = ({ userCollections }: MintPageProps) => {

  const [selected, setSelected] = useState<string>('');
  const selectedCollection = userCollections.find((collection) => collection.name === selected);

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isCardOpen, setIsCardOpen] = useState(false);

  const openCard = (card: Card) => {
    console.log("openCard", card);
    setSelectedCard(card);
    setIsCardOpen(true);
  };

  const closeCard = () => {
    setSelectedCard(null);
    setIsCardOpen(false);
  };

  return(
    <div>
      <div className={styles.container}>
        <section className={styles.section}>

        {isCardOpen ? 

          (<div className="cardForm">
            <div className={styles.closeButton} onClick={() => setIsCardOpen(false)}>
              &#8592;
            </div>
            <MintForm selectedCard={selectedCard} />
          </div>) 

          :

          (<div>
            <h2>Sélectionnez une collection</h2>
            
            <div className={styles.collectionForm}>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className={styles.select}>
                <option value="">Sélectionnez une collection</option>
                {userCollections.map((set) => (
                  <option key={set.name} value={set.name}>
                    {set.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCollection && (
              <div className={styles.cardsContainer}>
                {selectedCollection.Cards.map((card) => (
                  <div key={card.id} className={styles.card} onClick={() => openCard(card)}>
                    <img src={card.imageUrl} alt={card.name} className={styles.cardImage}/>
                  </div>
                ))}
              </div>
            )}
          </div>)}

        </section>
      </div>
    </div>
  )
}

interface MintFormProps {
  selectedCard: Card | null;
}

const MintForm = ({ selectedCard }: MintFormProps) => {
  const [isMined, setIsMined] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [manualAddress, setManualAddress] = useState('');

  const handleSubmit = async () => {
    console.log("Carte attribuée à : ", selectedUser || manualAddress);
  };

  return (
    <div className={styles.cardFormContent}>
      <img src={selectedCard?.imageUrl} alt={selectedCard?.name} className={styles.cardFormImage} />
      <form onSubmit={handleSubmit}>
        {isMined ? (
          <p>Cette carte a déjà été minée.</p>
        ) : (
          <div>
            <p>Attribuer cette carte :</p>
            <select onChange={(e) => setSelectedUser(e.target.value)} value={selectedUser}>
              <option value="">Sélectionner un utilisateur</option>
              {/* Remplacer par une liste d'utilisateurs */}
              <option value="user1">User 1</option>
              <option value="user2">User 2</option>
            </select>
            <p>Ou entrer une adresse manuellement :</p>
            <input
              type="text"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="Adresse Ethereum"
            />
            <div>
              <button type="submit" className={styles.createButton}>Attribuer</button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default MintPage;
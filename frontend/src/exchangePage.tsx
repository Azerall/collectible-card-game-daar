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

interface ExchangePageProps {
  userCollections: Collection[]
  wallet: { details: ethereum.Details, contract: main.Main } | undefined
  accounts: string[] | undefined
}

export const ExchangePage = ({ userCollections, wallet, accounts }: ExchangePageProps) => {

  const [selectedUser1, setSelectedUser1] = useState('');
  const [selectedUser2, setSelectedUser2] = useState('');
  const [userCards1, setUserCards1] = useState<Card[]>([]);
  const [userCards2, setUserCards2] = useState<Card[]>([]);
  const [selectedCard1, setSelectedCard1] = useState<Card | undefined>();
  const [selectedCard2, setSelectedCard2] = useState<Card | undefined>();

  useEffect(() => {
    if (selectedUser1) {
      // Récupérer les cartes de l'utilisateur sélectionné
      const getUserCards = async () => {
        try {
          let allUserCards: Card[] = [];
          for (let collection of userCollections) {
            const [cardNumbers, cardNames, cardImages] = await wallet?.contract.getUserCards(collection.id, selectedUser1);
            if (cardNumbers && cardNames && cardImages) {
              console.log(`Cards from collection ${collection.id}:`, cardNumbers);
          
              // Mapper les trois tableaux en un tableau d'objets Card
              const mappedCards = cardNumbers.map((cardNumber: string, index: number) => ({
                id: cardNumber,
                name: cardNames[index],
                imageUrl: cardImages[index],
                SetID: collection.id,
              }));
          
              allUserCards = [...allUserCards, ...mappedCards];
            }
          }
          setUserCards1(allUserCards);
        } catch (contractError) {
          console.log("Erreur lors de la récupération des cartes de l'utilisateur : ", contractError);
        }
      };
      getUserCards();
      console.log("Cartes de l'utilisateur 1", selectedUser1, userCards1);
    }
  }, [selectedUser1]);

  useEffect(() => {
    if (selectedUser2) {
      // Récupérer les cartes de l'utilisateur sélectionné
      const getUserCards = async () => {
        try {
          let allUserCards: Card[] = [];
          for (let collection of userCollections) {
            const [cardNumbers, cardNames, cardImages] = await wallet?.contract.getUserCards(collection.id, selectedUser2);
            if (cardNumbers && cardNames && cardImages) {
              console.log(`Cards from collection ${collection.id}:`, cardNumbers);
          
              // Mapper les trois tableaux en un tableau d'objets Card
              const mappedCards = cardNumbers.map((cardNumber: string, index: number) => ({
                id: cardNumber,
                name: cardNames[index],
                imageUrl: cardImages[index],
                SetID: collection.id,
              }));
          
              allUserCards = [...allUserCards, ...mappedCards];
            }
          }
          setUserCards2(allUserCards);
        } catch (contractError) {
          console.log("Erreur lors de la récupération des cartes de l'utilisateur : ", contractError);
        }
      };
      getUserCards();
      console.log("Cartes de l'utilisateur 2", selectedUser2, userCards2);
    }
  }, [selectedUser2]);

  const exchangeCards = async () => {
    try {
      console.log("Echange des cartes : ", selectedCard1, selectedCard2);
      const token1 = await wallet?.contract.getCardToken(selectedCard1?.SetID, selectedUser1, selectedCard1?.id);
      const token2 = await wallet?.contract.getCardToken(selectedCard2?.SetID, selectedUser2, selectedCard2?.id);
      console.log("Tokens : ", token1, token2);
      await wallet?.contract.transferCard(selectedCard1?.SetID, selectedUser1, selectedUser2, token1);
      await wallet?.contract.transferCard(selectedCard2?.SetID, selectedUser2, selectedUser1, token2);
      console.log("Cartes échangées");
    } catch (contractError) {
      console.log("Erreur lors de l'échange des cartes : ", contractError);
    }
  }

  return( 
      <div className={styles.container}>
          <section className={styles.section}>
              <h2>Echange de cartes</h2>

              <div className={styles.exchangeFormContainer}>
                <div className={styles.exchangeFormColumn}>
                  <p>Sélectionnez un utilisateur</p>
                  <div className={styles.collectionForm}>
                      <select onChange={(e) => setSelectedUser1(e.target.value)} value={selectedUser1} className={styles.selectUser}>
                          <option value="">Sélectionner un utilisateur</option>
                          {accounts?.map((account) => (
                          <option key={account} value={account}>
                              {account}
                          </option>
                          ))}
                      </select>
                  </div>
                  {userCards1 && (
                    <div className={styles.cardsContainer}>
                      {userCards1.map((card) => (
                        <div key={card.id} className={styles.card} onClick={() => setSelectedCard1(card)}>
                          <img src={card.imageUrl} alt={card.name} className={styles.cardImage}/>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.exchangeFormColumn}>
                  <p>Sélectionnez un utilisateur</p>
                  <div className={styles.collectionForm}>
                      <select onChange={(e) => setSelectedUser2(e.target.value)} value={selectedUser2} className={styles.selectUser}>
                          <option value="">Sélectionner un utilisateur</option>
                          {accounts?.map((account) => (
                          <option key={account} value={account}>
                              {account}
                          </option>
                          ))}
                      </select>
                  </div>
                  {userCards2 && (
                    <div className={styles.cardsContainer}>
                      {userCards2.map((card) => (
                        <div key={card.id} className={styles.card} onClick={() => setSelectedCard2(card)}>
                          <img src={card.imageUrl} alt={card.name} className={styles.cardImage}/>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.createButton}>
                  <button onClick={() => exchangeCards()}>Echanger</button>
                </div>
              </div>
          </section>
      </div>
  );

};

export default ExchangePage;
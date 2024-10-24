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
      setUserCards1([]);
      // Récupérer les cartes de l'utilisateur sélectionné
      const getUserCards = async () => {
        try {
          let allUserCards: Card[] = [];
          for (let collection of userCollections) {
            const [cardIds, cardNames, cardImages] = await wallet?.contract.getUserCards(collection.id, selectedUser1);
            if (cardIds && cardNames && cardImages) {
              // Mapper les trois tableaux en un tableau d'objets Card
              const mappedCards = cardIds.map((cardId: string, index: number) => ({
                id: cardId,
                name: cardNames[index],
                imageUrl: cardImages[index],
                SetID: collection.id,
              }));
          
              allUserCards = [...allUserCards, ...mappedCards];
            }
          }
          setUserCards1(allUserCards);
        } catch (contractError) {
          console.log("Erreur lors de la récupération des cartes de l'utilisateur 1 : ", contractError);
        }
      };
      getUserCards();
    }
  }, [selectedUser1]);

  useEffect(() => {
    if (selectedUser2) {
      setUserCards2([]);
      // Récupérer les cartes de l'utilisateur sélectionné
      const getUserCards = async () => {
        try {
          let allUserCards: Card[] = [];
          for (let collection of userCollections) {
            const [cardIds, cardNames, cardImages] = await wallet?.contract.getUserCards(collection.id, selectedUser2);
            if (cardIds && cardNames && cardImages) {
              // Mapper les trois tableaux en un tableau d'objets Card
              const mappedCards = cardIds.map((cardId: string, index: number) => ({
                id: cardId,
                name: cardNames[index],
                imageUrl: cardImages[index],
                SetID: collection.id,
              }));
          
              allUserCards = [...allUserCards, ...mappedCards];
            }
          }
          setUserCards2(allUserCards);
        } catch (contractError) {
          console.log("Erreur lors de la récupération des cartes de l'utilisateur 2 : ", contractError);
        }
      };
      getUserCards();
    }
  }, [selectedUser2]);

  const exchangeCards = async () => {
    if (!selectedUser1 || !selectedUser2) {
      alert("Veuillez sélectionner deux utilisateurs.");
      return;
    }
    if (!selectedCard1 || !selectedCard2) {
      alert("Veuillez sélectionner deux cartes à échanger.");
      return;
    }
    if (selectedUser1 === selectedUser2) {
      alert("Veuillez sélectionner deux utilisateurs différents.");
      return;
    }
    try {
      console.log("Echange des cartes : ", selectedCard1, selectedCard2);
      const token1 = await wallet?.contract.getCardToken(selectedCard1?.SetID, selectedUser1, selectedCard1?.id);
      const token2 = await wallet?.contract.getCardToken(selectedCard2?.SetID, selectedUser2, selectedCard2?.id);
      console.log("Tokens : ", token1, token2);
      await wallet?.contract.setApprovalForAll(selectedCard1?.SetID, wallet?.contract.address, true);
      await wallet?.contract.setApprovalForAll(selectedCard2?.SetID, wallet?.contract.address, true);
      await wallet?.contract.tradeCards(selectedCard1?.SetID, selectedUser1, token1, selectedCard2?.SetID, selectedUser2, token2);
      alert("Echange effectué avec succès !");
      setSelectedUser1('');
      setSelectedUser2('');
      setUserCards1([]);
      setUserCards2([]);
    } catch (contractError) {
      if ((contractError as any).code === "ACTION_REJECTED") {
        alert('Vous avez refusé la transaction.');
      } else if ((contractError as any).message.includes("Super-admin requis.")) {
        alert("Vous n'êtes pas autorisé à créer une collection (super-admin requis) !");
      } else {
        console.log(contractError);
      }
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
                              {account === wallet?.details?.account ? "(YOU) " : ""}{account}
                          </option>
                          ))}
                      </select>
                  </div>
                  {userCards1 && (
                    <div className={styles.cardsExchangeContainer}>
                      {userCards1.map((card) => (
                        <div key={card.id} className={selectedCard1 === card ? styles.cardExchangeSelected : styles.cardExchange} onClick={() => selectedCard1 === card ? setSelectedCard1(undefined) : setSelectedCard1(card)}>
                          <img src={card.imageUrl} alt={card.name} className={styles.cardExchangeImage}/>
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
                              {account === wallet?.details?.account ? "(YOU) " : ""}{account}
                          </option>
                          ))}
                      </select>
                  </div>
                  {userCards2 && (
                    <div className={styles.cardsExchangeContainer}>
                      {userCards2.map((card) => (
                        <div key={card.id} className={selectedCard2 === card ? styles.cardExchangeSelected : styles.cardExchange} onClick={() => selectedCard2 === card ? setSelectedCard2(undefined) : setSelectedCard2(card)}>
                          <img src={card.imageUrl} alt={card.name} className={styles.cardExchangeImage}/>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.exchangeButton}>
                <button onClick={() => exchangeCards()}>Echanger</button>
              </div>
          </section>
      </div>
  );

};

export default ExchangePage;
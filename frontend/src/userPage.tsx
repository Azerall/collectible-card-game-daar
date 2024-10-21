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

interface UserPageProps {
  userCollections: Collection[]
  setSelectedCardFromUserPage: React.Dispatch<React.SetStateAction<Card | undefined>>
  changePage: (page: string) => void
  wallet: { details: ethereum.Details, contract: main.Main } | undefined
  accounts: string[] | undefined
}

export const UserPage = ({ userCollections, setSelectedCardFromUserPage, changePage, wallet, accounts }: UserPageProps) => {

  const [selectedUser, setSelectedUser] = useState('');
  const [userCards, setUserCards] = useState<Card[]>([]);

  useEffect(() => {
    if (selectedUser) {
      // Récupérer les cartes de l'utilisateur sélectionné
      const getUserCards = async () => {
        try {
          let allUserCards: Card[] = [];
          for (let collection of userCollections) {
            const [cardNumbers, cardNames, cardImages] = await wallet?.contract.getUserCards(collection.id, selectedUser);
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
          setUserCards(allUserCards);
        } catch (contractError) {
          console.log("Erreur lors de la récupération des cartes de l'utilisateur : ", contractError);
        }
      };
      getUserCards();
      console.log("Cartes de l'utilisateur ", selectedUser, userCards);
    }
  }, [selectedUser]);

  return(
      <div className={styles.container}>
        <section className={styles.section}>
            <h2>Sélectionnez un utilisateur</h2>
            <div className={styles.collectionForm}>
              <select onChange={(e) => setSelectedUser(e.target.value)} value={selectedUser} className={styles.selectUser}>
                <option value="">Sélectionner un utilisateur</option>
                {accounts?.map((account) => (
                  <option key={account} value={account}>
                    {account}
                  </option>
                ))}
              </select>
            </div>
            {userCards && (
              <div className={styles.cardsContainer}>
                {userCards.map((card) => (
                  <div key={card.id} className={styles.card} onClick={() => { changePage("mintPage"); setSelectedCardFromUserPage(card)}}>
                    <img src={card.imageUrl} alt={card.name} className={styles.cardImage}/>
                  </div>
                ))}
              </div>
            )}
        </section>
      </div>
  )
}

export default UserPage;
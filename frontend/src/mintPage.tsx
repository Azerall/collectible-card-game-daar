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

interface MintPageProps {
  userCollections: Collection[]
  selectedCollectionFromCollectionPage: string
  selectedCardFromUserPage: Card | undefined
  wallet: { details: ethereum.Details, contract: main.Main } | undefined
  accounts: string[] | undefined
}

export const MintPage = ({ userCollections, selectedCollectionFromCollectionPage, selectedCardFromUserPage, wallet, accounts }: MintPageProps) => {

  const [selected, setSelected] = useState<string>('');
  const selectedCollection = userCollections.find((collection) => collection.name === selected);

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isCardOpen, setIsCardOpen] = useState(false);

  useEffect(() => {
    if (selectedCollectionFromCollectionPage) {
      setSelected(selectedCollectionFromCollectionPage);
    } else if (selectedCardFromUserPage) {
      const foundCollection = userCollections.find((collection) => collection.id === selectedCardFromUserPage.SetID);
      if (foundCollection) {
        setSelected(foundCollection.name);
      }
      setSelectedCard(selectedCardFromUserPage);
      setIsCardOpen(true);
    }
  }, []);

  const openCard = (card: Card) => {
    if (isCardOpen) {
      setSelectedCard(null);
      setIsCardOpen(false);
    } else {
      setSelectedCard(card);
      setIsCardOpen(true);
    }
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
            <h2>Attribuez cette carte</h2>
            <MintForm selectedCard={selectedCard} wallet={wallet} accounts={accounts}/>
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
  wallet: { details: ethereum.Details, contract: main.Main } | undefined
  accounts: string[] | undefined
}

const MintForm = ({ selectedCard, wallet, accounts }: MintFormProps) => {
  const [isMined, setIsMined] = useState(false);
  const [owner, setOwner] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    const getOwner = async () => {
      try {
        console.log("Carte sélectionnée : ", selectedCard);
        const owner = await wallet?.contract.getCardOwner(selectedCard?.SetID, selectedCard?.id);
        if (owner != "0x0000000000000000000000000000000000000000") {
          setOwner(owner);
          console.log("Propriétaire de la carte : ", owner);
          setIsMined(true);
        }
      } catch (contractError) {
        console.log("Erreur lors de la récupération du propriétaire de la carte : ", contractError);
      }
    };
    getOwner();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUser) {
      alert("Veuillez sélectionner un utilisateur.");
      return;
    }
    if (isMined) {
      if (selectedUser === owner) {
        alert("Cette carte est déjà attribuée à cet utilisateur.");
      } else {
        try {
          await wallet?.contract.transferCard(selectedCard?.SetID, selectedCard?.id, owner, selectedUser);
          alert("La carte a été transférée avec succès !");
          setOwner(selectedUser);
        } catch (contractError) {
          console.log("Erreur lors du transfert de la carte : ", contractError);
        }
      }
    } else {
      try {
        await wallet?.contract.mintCard(selectedCard?.SetID, selectedUser, selectedCard?.id, selectedCard?.name, selectedCard?.imageUrl);
        alert("La carte a été attribuée avec succès !");
        setIsMined(true);
        setOwner(selectedUser);
      } catch (contractError) {
        console.log("Erreur lors de l'attribution de la carte : ", contractError);
      }
    }
  };

  return (
    <div className={styles.cardFormContent}>
      <img src={selectedCard?.imageUrl} alt={selectedCard?.name} className={styles.cardFormImage} />
      <form onSubmit={handleSubmit}>
        {isMined ? (
          <div>
            <p>Cette carte a déjà été attribuée à : <br></br>{owner}</p>
            <p>Choisissez un utilisateur à qui la transférer :</p>
          </div>
        ) : (
          <p>Choisissez un utilisateur à qui l'attribuer :</p>
        )}
        <div>
          <select onChange={(e) => setSelectedUser(e.target.value)} value={selectedUser}>
            <option value="">Sélectionner un utilisateur</option>
            {accounts?.map((account) => (
              <option key={account} value={account}>
                {account}
              </option>
            ))}
          </select>
          <div>
            <button type="submit" className={styles.createButton}>Attribuer</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MintPage;
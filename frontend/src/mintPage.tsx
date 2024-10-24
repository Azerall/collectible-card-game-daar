import { useEffect, useState } from 'react'
import styles from './styles.module.css'
import * as ethereum from '@/lib/ethereum'
import * as main from '@/lib/main'
import { ethers } from 'ethers'

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

  const openCard = (card: Card | null) => {
    setSelectedCard(card);
    setIsCardOpen(!isCardOpen);
  };
  
  return(
    <div>
      <div className={styles.container}>
        <section className={styles.section}>

        {isCardOpen ? 

          (<div className="cardForm">
            <div className={styles.closeButton} onClick={() => openCard(null)}>
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
  const [owners, setOwners] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {     
    const getOwner = async () => {
      try {
        console.log("Carte sélectionnée : ", selectedCard);
        const owners = await wallet?.contract.getCardOwners(selectedCard?.SetID, selectedCard?.id);
        if (owners) {
          // Retirer les doublons et l'adresse 0
          const uniqueOwners = [...new Set(owners)].filter(owner => owner !== '0x0000000000000000000000000000000000000000');
          setOwners(uniqueOwners as string[]);
          if (uniqueOwners.length) console.log("Propriétaires de la carte : ", uniqueOwners);
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
    try {
      await wallet?.contract.mintCard(selectedCard?.SetID, ethers.utils.getAddress(selectedUser), selectedCard?.id, selectedCard?.name, selectedCard?.imageUrl);
      alert("La carte a été attribuée avec succès !");
      if (!owners.includes(selectedUser)) {
        setOwners([...owners, selectedUser]);
      }
    } catch (contractError) {
      if ((contractError as any).code === "ACTION_REJECTED") {
        alert('Vous avez refusé la transaction.');
      } else if ((contractError as any).message.includes("Super-admin requis.")) {
        alert("Vous n'êtes pas autorisé à créer une collection (super-admin requis) !");
      } else {
        console.log(contractError);
      }
    }
  };

  return (
    <div className={styles.cardFormContent}>
      <img src={selectedCard?.imageUrl} alt={selectedCard?.name} className={styles.cardFormImage} />
      <form onSubmit={handleSubmit}>
        {owners.length ? (
          <div>
            <p>Cette carte a déjà été minée à : <br></br></p>
            {owners.map((owner) => (
              <p key={owner}>{owner}</p>
            ))}
          </div>
        ) : (
          <p>Choisissez un utilisateur à qui la miner :</p>
        )}
        <div>
          <select onChange={(e) => setSelectedUser(e.target.value)} value={selectedUser}>
            <option value="">Sélectionner un utilisateur</option>
            {accounts?.map((account) => (
              <option key={account} value={account}>
                {account === wallet?.details?.account ? "(YOU) " : ""}{account}
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
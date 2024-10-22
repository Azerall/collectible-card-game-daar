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

interface BoosterPageProps {
  wallet: { details: ethereum.Details, contract: main.Main } | undefined
  accounts: string[] | undefined
}

export const BoosterPage = ({ wallet, accounts }: BoosterPageProps) => {

    return(
        <div>

        </div>
    );

};

export default BoosterPage;
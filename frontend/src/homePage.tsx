import React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './styles.module.css'

export const HomePage = () => {

  return(
      <div className={styles.homepage}>
        <section className={styles.introtext}>
          <h1>Bienvenue dans Pokémon TCG !</h1>
          <p>
            Notre plateforme vous permet de créer et gérer facilement une collection de cartes Pokémon, 
            d'échanger avec d'autres dresseurs et de consulter les collections de la communauté.
          </p>
        </section>
      </div>
  )
}

export default HomePage;
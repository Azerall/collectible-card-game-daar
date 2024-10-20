package main

import (
	"log"
	"net/http"
	"strings"

	"encoding/json"
	"fmt"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/go-resty/resty/v2"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type User struct {
	ID          uint         `gorm:"primaryKey"`
	Name        string       `json:"name"`
	MintedCards []MintedCard `gorm:"foreignKey:UserID"` // Relation 1-N avec MintedCard
}

type MintedCard struct {
	ID     uint `gorm:"primaryKey"` // Identifiant unique, représente le NFT
	CardID uint // Clé étrangère vers Card
	UserID uint // Clé étrangère vers User
}

// Structure pour stocker les données d'une carte
type Card struct {
	ID       string `gorm:"primaryKey" json:"id"` // Identifiant unique de la carte
	Name     string `json:"name"`
	ImageUrl string `json:"imageUrl"`
	SetID    string // Clé étrangère vers PokemonSet
}

// Structure pour stocker les données du set
type PokemonSet struct {
	ID    string `json:"id"` // Identifiant unique du set
	Name  string `json:"name"`
	Cards []Card `gorm:"foreignKey:SetID"` // Clé étrangère vers les cartes
}

// Fonction pour récupérer le set de cartes de l'API Pokémon TCG et le sauvegarder dans la base de données
func fetchPokemonSet(setId string, db *gorm.DB, collections map[string]string) (PokemonSet, error) {
	client := resty.New()
	setId = strings.TrimSpace(setId)
	// apiUrl := fmt.Sprintf("https://api.pokemontcg.io/v2/sets?q=name:%s", setName)
	apiUrl := fmt.Sprintf("https://api.pokemontcg.io/v2/sets?q=id:%s", setId)

	// Appel de l'API pour récupérer le set de cartes
	resp, err := client.R().
		SetHeader("Accept", "application/json").
		Get(apiUrl)

	if err != nil {
		return PokemonSet{}, fmt.Errorf("Erreur lors de l'appel à l'API Pokémon TCG : %v", err)
	}

	// Extraction du premier set trouvé
	var responseData map[string]interface{}
	err = json.Unmarshal(resp.Body(), &responseData)
	if err != nil || len(responseData["data"].([]interface{})) == 0 {
		return PokemonSet{}, fmt.Errorf("Aucun set trouvé pour ce nom.")
	}

	// Vérification si la clé "data" existe et n'est pas nulle
	data, ok := responseData["data"].([]interface{})
	if !ok || data == nil {
		return PokemonSet{}, fmt.Errorf("Aucun set trouvé pour ce nom.")
	}

	firstSet := responseData["data"].([]interface{})[0].(map[string]interface{})
	setID := firstSet["id"].(string)
	setName := firstSet["name"].(string)

	// Vérifier si le set existe déjà dans la base de données
	var existingSet PokemonSet
	err = db.Where("id = ?", setID).First(&existingSet).Error
	if err == nil {
		// Si aucune erreur, cela signifie que le set existe déjà
		return existingSet, fmt.Errorf("Le set existe déjà dans la base de données")
	}

	// Appel pour récupérer les cartes de ce set
	cardResp, err := client.R().
		SetHeader("Accept", "application/json").
		Get(fmt.Sprintf("https://api.pokemontcg.io/v2/cards?q=set.id:%s", setID))

	if err != nil {
		return PokemonSet{}, fmt.Errorf("Erreur lors de l'appel aux cartes du set : %v", err)
	}

	var cardData map[string]interface{}
	err = json.Unmarshal(cardResp.Body(), &cardData)
	if err != nil {
		return PokemonSet{}, fmt.Errorf("Erreur de parsing des cartes : %v", err)
	}

	// Récupération des URLs d'images des cartes
	cards := []Card{}
	for _, card := range cardData["data"].([]interface{}) {
		cardId := card.(map[string]interface{})["id"].(string)
		cardName := card.(map[string]interface{})["name"].(string)
		cardIdSet := card.(map[string]interface{})["set"].(map[string]interface{})["id"].(string)
		cardMap := card.(map[string]interface{})
		imgUrl := cardMap["images"].(map[string]interface{})["small"].(string)
		cards = append(cards, Card{ID: cardId, Name: cardName, ImageUrl: imgUrl, SetID: cardIdSet})
	}

	// Créer et sauvegarder le set de cartes dans la base de données
	newSet := PokemonSet{
		ID:    setID,
		Name:  setName,
		Cards: cards,
	}

	if err := db.Create(&newSet).Error; err != nil {
		return PokemonSet{}, fmt.Errorf("Erreur lors de l'insertion du set dans la base de données : %v", err)
	}

	// Retourne le set de cartes avec le nom du set
	return newSet, nil
}

func pokemonSetHandler(c *gin.Context, db *gorm.DB, collections map[string]string) {
	// setName := c.Query("name") // Récupère le nom du set depuis les paramètres de requête
	// println("AVANT ", setName)
	setId := c.Query("id") // Récupère l'id du set depuis les paramètres de requête
	// pokemonSet, err := fetchPokemonSet(setName, db, collections)
	pokemonSet, err := fetchPokemonSet(setId, db, collections)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"set": pokemonSet})
}

// Fonction pour récupérer tous les sets de cartes de l'API Pokémon TCG
func fetchAllPokemonSets() ([]string, error) {
	client := resty.New()
	apiUrl := "https://api.pokemontcg.io/v2/sets"

	// Appel de l'API pour récupérer tous les sets
	resp, err := client.R().
		SetHeader("Accept", "application/json").
		Get(apiUrl)

	if err != nil {
		return nil, fmt.Errorf("Erreur lors de l'appel à l'API Pokémon TCG : %v", err)
	}

	// Décodage de la réponse JSON
	var responseData struct {
		Data []PokemonSet `json:"data"`
	}

	err = json.Unmarshal(resp.Body(), &responseData)
	if err != nil {
		return nil, fmt.Errorf("Erreur de parsing de la réponse : %v", err)
	}

	// Extraction des noms des sets
	sets := []string{}
	for _, set := range responseData.Data {
		sets = append(sets, set.Name)
	}

	return sets, nil
}

func pokemonSetsHandler(c *gin.Context) {
	sets, err := fetchAllPokemonSets()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"sets": sets})
}

// créer une map pour les collections, clé = id de la collection, valeur = nom de la collection
func createMapCollections() map[string]string {
	client := resty.New()
	apiUrl := "https://api.pokemontcg.io/v2/sets"

	// Appel de l'API pour récupérer tous les sets
	resp, err := client.R().
		SetHeader("Accept", "application/json").
		Get(apiUrl)

	if err != nil {
		return nil
	}

	// Décodage de la réponse JSON
	var responseData struct {
		Data []PokemonSet `json:"data"`
	}

	err = json.Unmarshal(resp.Body(), &responseData)
	if err != nil {
		return nil
	}

	// Extraction des noms des sets
	sets := make(map[string]string)
	for _, set := range responseData.Data {
		sets[set.ID] = set.Name
	}

	return sets
}

// Handler pour la route API /pokemon-set
/*func pokemonSetHandler(w http.ResponseWriter, r *http.Request) {
	// Récupérer le nom du set depuis les paramètres de requête
	setName := r.URL.Query().Get("name")
	if setName == "" {
		http.Error(w, "Le nom du set est requis.", http.StatusBadRequest)
		return
	}

	// Récupérer les données du set via l'API Pokémon TCG
	pokemonSet, err := fetchPokemonSet(setName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Convertir la réponse en JSON et l'envoyer au frontend
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pokemonSet)
}*/

// Fonction pour récupérer toutes les collections de cartes dans la base de données
func getAllCollections(c *gin.Context, db *gorm.DB) {
	// Variable pour stocker toutes les collections
	var collections []PokemonSet

	// Récupération de toutes les collections (sets) dans la base de données
	if err := db.Preload("Cards").Find(&collections).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des collections"})
		return
	}

	// Renvoi des collections sous forme de JSON
	c.JSON(http.StatusOK, collections)
}

func main() {
	// Connexion à la base de données SQLite
	db, err := gorm.Open(sqlite.Open("cards.db"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	log.Println("Connected to database")

	// Migration de la structure des tables
	db.AutoMigrate(&Card{}, &User{}, &MintedCard{}, &PokemonSet{})

	// Créer la map des collections, clé = id de la collection, valeur = nom de la collection
	collections := createMapCollections()
	if collections == nil {
		log.Println("Erreur lors de la récupération des collections")
	} else {
		log.Println("Collections récupérées avec succès")
	}
	// Initialisation du routeur Gin
	r := gin.Default()

	// Middleware CORS
	r.Use(cors.New(cors.Config{
		AllowAllOrigins: true,
		AllowMethods:    []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:    []string{"Accept", "Content-Type", "Authorization"},
	}))

	r.POST("/pokemon-set", func(c *gin.Context) { // Route pour créer un set Pokémon
		pokemonSetHandler(c, db, collections)
	})
	r.GET("/pokemon-sets", func(c *gin.Context) { // Route pour récupérer tous les sets Pokémon
		pokemonSetsHandler(c)
	})
	r.GET("/collections", func(c *gin.Context) { // Route pour récupérer toutes les collections
		getAllCollections(c, db)
	})

	// Démarrage du serveur Gin sur le port 8080
	log.Println("Server starting on port 8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Error starting server: %s\n", err)
	}

	log.Println("Server started successfully")
}

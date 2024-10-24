package main

import (
	"log"
	"net/http"
	"sort"
	"strings"

	"encoding/json"
	"fmt"
	"math/rand"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/go-resty/resty/v2"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

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

type Booster struct {
	ID    string `json:"id"` // Identifiant unique du booster
	SetID string // Clé étrangère vers PokemonSet
	Cards []Card `gorm:"many2many:booster_cards" json:"cards"` // Clé étrangère vers les cartes
}

// Fonction pour récupérer le set de cartes de l'API Pokémon TCG et le sauvegarder dans la base de données
func fetchPokemonSet(setId string, db *gorm.DB) (PokemonSet, error) {
	client := resty.New()
	setId = strings.TrimSpace(setId)
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
		return existingSet, fmt.Errorf("SetExistsError: Le set existe déjà dans la base de données")
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

	// Retourne le set de cartes avec le nom du set
	return newSet, nil
}

func pokemonSetHandler(c *gin.Context, db *gorm.DB) {
	setId := c.Query("id") // Récupère l'id du set depuis les paramètres de requête
	pokemonSet, err := fetchPokemonSet(setId, db)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err})
		return
	}
	c.JSON(http.StatusOK, gin.H{"set": pokemonSet})
}

func createCollectionHandler(c *gin.Context, db *gorm.DB) {
	setId := c.Query("id") // Récupère l'id du set depuis les paramètres de requête
	pokemonSet, err := fetchPokemonSet(setId, db)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Sauvegarder le set récupéré dans la base de données
	if err := db.Create(&pokemonSet).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de l'enregistrement du set dans la base de données"})
		return
	}

	// Répondre avec succès et retourner les informations du set créé
	c.JSON(http.StatusOK, gin.H{"message": "Collection créée avec succès", "set": pokemonSet})
}

func fetchAllPokemonSets() ([][2]string, error) {
	client := resty.New()
	apiUrl := "https://api.pokemontcg.io/v2/sets"

	// Appel de l'API pour récupérer tous les sets
	resp, err := client.R().
		SetHeader("Accept", "application/json").
		Get(apiUrl)

	if err != nil {
		return nil, err
	}

	// Décodage de la réponse JSON
	var responseData struct {
		Data []PokemonSet `json:"data"`
	}

	err = json.Unmarshal(resp.Body(), &responseData)
	if err != nil {
		return nil, err
	}

	// Création de la liste de paires [id, name]
	sets := make([][2]string, len(responseData.Data))
	for i, set := range responseData.Data {
		sets[i] = [2]string{set.ID, set.Name}
	}

	// Trier les sets par ordre alphabétique des noms
	sort.Slice(sets, func(i, j int) bool {
		return sets[i][1] < sets[j][1]
	})

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

func createBoosterHandler(c *gin.Context, db *gorm.DB) {
	// Récupération de l'ID du set de cartes
	setId := c.Query("id")
	cards, err := createBooster(setId, db)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Booster créé avec succès", "booster": cards})
}

func createBooster(setId string, db *gorm.DB) (Booster, error) {
	// Recherche des cartes du set dans la base de données
	var cardsInSet []Card
	err := db.Where("set_id = ?", setId).Find(&cardsInSet).Error
	if err != nil {
		return Booster{}, fmt.Errorf("Erreur lors de la récupération des cartes du set : %v", err)
	}

	if len(cardsInSet) == 0 {
		return Booster{}, fmt.Errorf("Aucune carte trouvée pour ce set dans la base de données.")
	}

	// Sélectionner aléatoirement 10 cartes du set
	var cards []Card
	rand.Seed(time.Now().UnixNano())
	alreadyAdded := make(map[string]bool)
	collectionLength := len(cardsInSet)
	counter := 0

	for counter < 10 {
		randomIndex := rand.Intn(collectionLength)
		selectedCard := cardsInSet[randomIndex]

		// Assurez-vous que chaque carte est unique dans le booster
		if !alreadyAdded[selectedCard.ID] {
			cards = append(cards, selectedCard)
			alreadyAdded[selectedCard.ID] = true
			counter++
		}
	}

	var count int64
	err = db.Model(&Booster{}).Count(&count).Error
	if err != nil {
		return Booster{}, fmt.Errorf("Erreur lors de la récupération du nombre de boosters : %v", err)
	}

	boosterName := fmt.Sprintf("Booster %d", count)

	// Créer et enregistrer le booster avec ses cartes
	booster := Booster{
		ID:    boosterName,
		SetID: setId,
		Cards: cards,
	}

	// Sauvegarder le booster dans la base de données
	err = db.Create(&booster).Error
	if err != nil {
		return Booster{}, fmt.Errorf("Erreur lors de la création du booster : %v", err)
	}

	return booster, nil
}

// Fonction pour récupérer un booster par son nom
func getBoosterHandler(c *gin.Context, db *gorm.DB) {
	// Récupération du nom du booster
	boosterName := c.Query("name")
	var booster Booster
	err := db.Where("id = ?", boosterName).Preload("Cards").First(&booster).Error
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Booster non trouvé"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"booster": booster})
}

// Fonction pour supprimer un booster par son nom
func deleteBoosterHandler(c *gin.Context, db *gorm.DB) {
	// Récupération du nom du booster
	boosterName := c.Query("name")
	var booster Booster
	err := db.Where("id = ?", boosterName).First(&booster).Error
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Booster non trouvé"})
		return
	}

	// Supprimer les relations entre le booster et les cartes
	err = db.Model(&booster).Association("Cards").Clear()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la suppression des cartes associées"})
		return
	}

	db.Delete(&booster)
	c.JSON(http.StatusOK, gin.H{"message": "Booster supprimé avec succès"})
}

func main() {
	// Connexion à la base de données SQLite
	db, err := gorm.Open(sqlite.Open("cards.db"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	log.Println("Connected to database")

	// Migration de la structure des tables
	db.AutoMigrate(&Card{}, &PokemonSet{}, &Booster{})

	// Initialisation du routeur Gin
	r := gin.Default()

	// Middleware CORS
	r.Use(cors.New(cors.Config{
		AllowAllOrigins: true,
		AllowMethods:    []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:    []string{"Accept", "Content-Type", "Authorization"},
	}))

	r.POST("/pokemon-set", func(c *gin.Context) { // Route pour récupérer un set Pokémon
		pokemonSetHandler(c, db)
	})
	r.POST("/collections", func(c *gin.Context) { // Route pour créer une collection
		createCollectionHandler(c, db)
	})
	r.GET("/pokemon-sets", func(c *gin.Context) { // Route pour récupérer tous les sets Pokémon
		pokemonSetsHandler(c)
	})
	r.GET("/collections", func(c *gin.Context) { // Route pour récupérer toutes les collections
		getAllCollections(c, db)
	})
	r.POST("/create-booster", func(c *gin.Context) { // Route pour créer un booster
		createBoosterHandler(c, db)
	})
	r.GET("/booster", func(c *gin.Context) { // Route pour récupérer un booster par son nom
		getBoosterHandler(c, db)
	})
	r.DELETE("/booster", func(c *gin.Context) { // Route pour supprimer un booster par son nom
		deleteBoosterHandler(c, db)
	})

	// Démarrage du serveur Gin sur le port 8080
	log.Println("Server starting on port 8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Error starting server: %s\n", err)
	}

	log.Println("Server started successfully")
}

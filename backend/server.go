package main

import (
	"log"
	"net/http"
	"net/url"

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
	// MintedAt time.Time // Date à laquelle la carte a été mintée, historique
}

// Structure pour stocker les données d'une carte
type Card struct {
	ID       uint   `gorm:"primaryKey"`
	ImageUrl string `json:"imageUrl"`
	Name     string `json:"name"`
	SetID    uint   // Clé étrangère vers PokemonSet
}

// Structure pour stocker les données du set
type PokemonSet struct {
	ID    uint   `gorm:"primaryKey"` // Identifiant unique pour le set
	Name  string `json:"name"`
	Cards []Card `gorm:"foreignKey:SetID"` // Clé étrangère vers la carte
}

// Fonction pour récupérer le set de cartes de l'API Pokémon TCG
func fetchPokemonSet(setName string) (PokemonSet, error) {
	client := resty.New()
	setName = url.QueryEscape(setName)
	apiUrl := fmt.Sprintf("https://api.pokemontcg.io/v2/sets?q=name:%s", setName)
	// https://api.pokemontcg.io/v2/sets?q=name:Jungle

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

	firstSet := responseData["data"].([]interface{})[0].(map[string]interface{})
	setID := firstSet["id"].(string)
	setName = firstSet["name"].(string)

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
		cardMap := card.(map[string]interface{})
		imgUrl := cardMap["images"].(map[string]interface{})["small"].(string)
		cards = append(cards, Card{ImageUrl: imgUrl})
	}

	// Retourne le set de cartes avec le nom du set
	return PokemonSet{Name: setName, Cards: cards}, nil
}

func pokemonSetHandler(c *gin.Context) {
	setName := c.Query("name") // Récupère le nom du set depuis les paramètres de requête

	pokemonSet, err := fetchPokemonSet(setName)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, pokemonSet)
}

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

// Exemple d'utilisation dans un handler
func pokemonSetsHandler(c *gin.Context) {
	sets, err := fetchAllPokemonSets()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"sets": sets})
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

func main() {
	// Connexion à la base de données SQLite
	db, err := gorm.Open(sqlite.Open("cards.db"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	log.Println("Connected to database")

	// Migration de la structure des tables
	db.AutoMigrate(&Card{}, &User{}, &MintedCard{}, &PokemonSet{})

	// Initialisation du routeur Gin
	r := gin.Default()

	// Middleware CORS
	r.Use(cors.New(cors.Config{
		AllowAllOrigins: true,
		AllowMethods:    []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:    []string{"Accept", "Content-Type", "Authorization"},
	}))

	r.GET("/pokemon-set", pokemonSetHandler)   // Route pour récupérer un set Pokémon
	r.GET("/pokemon-sets", pokemonSetsHandler) // Route pour récupérer tous les sets Pokémon

	// Démarrage du serveur Gin sur le port 8080
	log.Println("Server starting on port 8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Error starting server: %s\n", err)
	}

	log.Println("Server started successfully") // Ajoutez ce log
}

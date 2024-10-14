package main

import (
	"log"
	"net/http"
)

// Structure pour stocker les données d'une carte
type Card struct {
	ImageUrl string `json:"imageUrl"`
	//ajouter name
}

// Structure pour stocker les données du set
type PokemonSet struct {
	Name  string `json:"name"`
	Cards []Card `json:"cards"`
}

// Fonction pour récupérer le set de cartes de l'API Pokémon TCG
func fetchPokemonSet(setName string) (PokemonSet, error) {
	/*client := resty.New()
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
	return PokemonSet{Name: setName, Cards: cards}, nil*/
	return PokemonSet{}, nil
}

// Handler pour la route API /pokemon-set
func pokemonSetHandler(w http.ResponseWriter, r *http.Request) {
	// Récupérer le nom du set depuis les paramètres de requête
	/*setName := r.URL.Query().Get("name")
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
	json.NewEncoder(w).Encode(pokemonSet)*/
}

func main() {
	http.HandleFunc("/pokemon-set", pokemonSetHandler) // Route pour récupérer un set Pokémon

	log.Println("Server starting on port 8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
	
	// Pour éviter les problèmes de CORS
	/*corsOpts := handlers.CORS(
		handlers.AllowedOrigins([]string{"*"}),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Accept", "Content-Type", "Content-Length", "Accept-Encoding", "X-CSRF-Token", "Authorization"}),
		handlers.AllowCredentials(),
	)

	if err := http.ListenAndServe("0.0.0.0:8080", corsOpts(router)); err != nil {
		log.Fatalf("Error starting server: %s\n", err)
	}*/
}

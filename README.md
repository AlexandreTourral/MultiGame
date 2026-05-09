# District Noir Online

Réplique en ligne du jeu de société **District Noir**, jouable en temps réel à 2 joueurs dans le navigateur.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Vite + React + TypeScript |
| Rendu jeu | PixiJS v8 (WebGL 2D) |
| Temps réel | Socket.io |
| State UI | Zustand |
| Backend | Node.js + Express + TypeScript |
| Shared | Types TypeScript partagés |

## Démarrage

```bash
cd DistrictNoir
npm install
npm run dev
```

- **Client** → http://localhost:5173
- **Serveur** → http://localhost:3001

## Comment jouer

1. Joueur A ouvre http://localhost:5173, entre son nom, clique **Créer une partie**
2. Un code à 6 caractères s'affiche
3. Joueur B ouvre le même URL dans un autre onglet/navigateur, entre son nom, clique **Rejoindre** et entre le code
4. La partie commence !

### Deuxième joueur sur le téléphone / un autre PC (réseau local)

Le jeu parle au serveur via WebSocket. Par défaut en développement, la connexion utilise **la même origine que l’URL affichée dans la barre d’adresse** (le proxy Vite redirige `/socket.io` vers le port 3001). L’hôte doit lancer `npm run dev` à la racine (client + serveur), puis ouvrir la page **depuis l’IP locale** affichée par Vite (ex. `http://192.168.1.10:5173`). Le second joueur doit utiliser **exactement cette même adresse** — pas `localhost` sur son propre appareil, sinon il se connecte à un serveur vide sur sa machine.

Si tu as un fichier `client/.env` avec `VITE_SERVER_URL=http://localhost:3001`, supprime-le ou commente-le pour le dev en LAN (sauf si tu sais pourquoi tu l’as mis).

En **production** (front et API sur des domaines différents), définis `VITE_SERVER_URL` au moment du build pour pointer vers l’URL publique du serveur Socket.io.

## Règles officielles

### Mise en place
- 45 cartes mélangées, **3 retirées sans les regarder**
- **5 cartes** distribuées à chaque joueuse
- **2 cartes** placées face visible au centre (la ligne)
- La joueuse qui reçoit le jeton CAMP commence

### Déroulement — 4 manches
Chaque manche se joue en **6 actions par joueuse** (tour à tour) :

**JOUER UNE CARTE** : choisis une carte de ta main et place-la en bout de ligne.

**PRENDRE LES 5 DERNIÈRES** : récupère exactement les 5 cartes les plus récentes de la ligne (ou moins si < 5 disponibles). **Tu ne peux effectuer cette action qu'une seule fois par manche.** Une fois que tu as pris, tu ne peux plus que jouer des cartes.

La manche se termine quand les deux mains sont vides (6 actions chacune). On distribue ensuite 5 nouvelles cartes chacune pour la manche suivante.

### Victoire immédiate
Si une joueuse réunit les **3 cartes VILLE** dans ses cartes récupérées, elle **gagne immédiatement** (sans calcul de score).

### Fin de partie (après 4 manches)
**Calcul des points :**
- Pour chaque type de **Soutien** : la joueuse avec la majorité marque les points de ce type (en cas d'égalité → 0 pour les deux)
- Chaque **série de 4 Soutiens différents** = +5 points bonus
- Cartes **Alliance** : ajoutent leurs points
- Cartes **Trahison** : soustraient leurs points
- Cartes **Ville** : valent 0 points

La joueuse avec le total le plus élevé gagne. En cas d'égalité : majorité des Caïd (8pts), puis des Lieutenants, etc.

### Types de cartes (45 cartes)

| Type | Valeur | Quantité |
|------|--------|----------|
| Soutien Informateur | 3 pts | 7 |
| Soutien Pickpocket | 4 pts | 7 |
| Soutien Sbire | 5 pts | 7 |
| Soutien Lieutenant | 6 pts | 7 |
| Soutien Caïd | 8 pts | 7 |
| Alliance | +2 pts | 2 |
| Alliance | +3 pts | 2 |
| Trahison | -2 pts | 2 |
| Trahison | -3 pts | 1 |
| Ville | 0 pts (win!) | 3 |
| **Total** | | **45** |

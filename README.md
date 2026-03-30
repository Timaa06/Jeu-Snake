# Snake Game

Un jeu Snake classique développé avec React et Electron, proposant une expérience desktop moderne avec effets visuels, système audio et niveaux de difficulté.

---

## Apercu

Ce projet est un jeu Snake entierement développé en JavaScript avec React pour l'interface et Electron pour le packaging desktop. Il a été concu dans le cadre d'un apprentissage du développement d'applications web et desktop, en utilisant l'intelligence artificielle comme outil d'aide au développement.

---

## Fonctionnalites

- Grille de jeu 20x20
- 3 niveaux de difficulté : Débutant, Moyen, Avancé
- Objectif de score par niveau
- Effets sonores et musique de fond via Web Audio API
- Design moderne avec effet glassmorphism et fond animé
- Tete du serpent animée avec yeux et langue
- Meilleur score enregistré en session
- Contrôles clavier : touches fléchées ou ZQSD
- Pause avec la barre espace
- Bouton mute/unmute
- Compatible navigateur web et application desktop

---

## Stack technique

| Technologie      | Version  | Utilisation                        |
|------------------|----------|------------------------------------|
| React            | 18.2.0   | Interface et logique du jeu        |
| Tailwind CSS     | 3.4.1    | Styles utilitaires                 |
| Electron         | 28.0.0   | Packaging application desktop      |
| Lucide React     | 0.294.0  | Icones UI                          |
| Web Audio API    | natif    | Effets sonores et musique          |
| Electron Builder | 24.9.1   | Build et distribution              |

---

## Installation et lancement

### Prérequis

- Node.js >= 16
- npm >= 8

### Cloner le projet

```bash
git clone https://github.com/ton-utilisateur/JeuSnake.git
cd JeuSnake
```

### Installer les dépendances

```bash
npm install
```

### Lancer en mode web

```bash
npm start
```

Ouvre [http://localhost:3000](http://localhost:3000) dans ton navigateur.

### Lancer en mode desktop (Electron)

```bash
npm run electron:dev
```

### Compiler l'application desktop

```bash
npm run electron:build
```

---

## Structure du projet

```
JeuSnake/
├── public/
│   ├── index.html          # Point d'entrée HTML
│   └── electron.js         # Processus principal Electron
├── src/
│   ├── index.js            # Point d'entrée React
│   ├── index.css           # Animations CSS globales
│   ├── App.js              # Composant racine
│   └── components/
│       └── SnakeGame.jsx   # Composant principal du jeu
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

---

## Controles

| Touche              | Action              |
|---------------------|---------------------|
| Fleches directionnelles | Déplacer le serpent |
| Z Q S D             | Déplacer le serpent |
| Espace              | Pause / Reprendre   |

---

## Niveaux de difficulté

| Niveau   | Vitesse | Objectif       |
|----------|---------|----------------|
| Débutant | 180ms   | Manger 5 pommes  |
| Moyen    | 120ms   | Manger 10 pommes |
| Avancé   | 70ms    | Manger 20 pommes |

---

## Prompts utilises pour développer ce projet

Ce projet a été développé en collaboration avec une intelligence artificielle (Claude). Voici les prompts exacts qui ont été utilisés, dans l'ordre chronologique, pour construire le jeu étape par étape.

---

### Prompt 1 — Créer le jeu Snake de base

```
Tu es un expert développeur React et Electron, spécialisé dans la création
d'applications desktop modernes et de jeux web en JavaScript.

Je veux créer un jeu Snake complet en React avec Electron pour en faire
une application desktop.

Stack technique :
- React 18 (create-react-app)
- Tailwind CSS
- Electron 28

Le jeu doit avoir :
- Une grille de 20x20 cases (chaque case = 25px)
- Un serpent qui se déplace en continu
- Une nourriture (pomme) qui apparaît aléatoirement
- Le serpent grandit quand il mange la pomme
- Game over si le serpent touche un mur ou son propre corps
- Contrôles : touches fléchées OU ZQSD
- Espace pour mettre en pause
- Affichage du score et du meilleur score
- Un écran de démarrage, un écran de pause et un écran game over

Génère tous les fichiers nécessaires : package.json, public/index.html,
public/electron.js, src/index.js, src/App.js et
src/components/SnakeGame.jsx avec la configuration Tailwind.
```

---

### Prompt 2 — Ajouter les niveaux de difficulté

```
Mon jeu Snake React fonctionne. Je veux ajouter un système de
3 niveaux de difficulté avec un écran de sélection avant chaque partie.

Les 3 niveaux :
- Débutant  : vitesse 180ms, objectif = manger 5 pommes
- Moyen     : vitesse 120ms, objectif = manger 10 pommes
- Avancé    : vitesse 70ms,  objectif = manger 20 pommes

Comportement attendu :
- Après l'écran de démarrage, afficher un menu de sélection du niveau
- Pendant la partie, afficher le niveau choisi et l'objectif (ex: "3/10")
- Si le joueur atteint l'objectif -> écran de victoire "Bravo !"
- Si game over avant l'objectif -> écran game over classique
- Le bouton Reset remet au menu de sélection du niveau

Modifie le composant SnakeGame.jsx en conséquence.
```

---

### Prompt 3 — Ajouter les effets sonores et la musique

```
Mon jeu Snake React/Electron fonctionne avec 3 niveaux de difficulté.
Je veux ajouter un système audio complet sans aucune librairie externe,
uniquement avec la Web Audio API native du navigateur.

Sons à implémenter :
- Musique de fond : mélodie simple Do-Re-Mi-Re en boucle (toutes les ~1 sec)
  avec des oscillateurs de type "sine"
- Son manger : bip court à 800Hz (100ms, onde sine)
- Son game over : descente de fréquence de 400Hz à 100Hz (onde sawtooth)
- Son victoire : accord de 3 notes simultanées (600Hz + 800Hz + 1000Hz)

Fonctionnalités :
- Bouton mute/unmute pour couper tous les sons
- La musique démarre au début de la partie et s'arrête sur game over/victoire/pause
- La musique reprend quand on sort de la pause
- Utiliser useRef pour stocker l'AudioContext et les timeouts de la musique

Modifie uniquement SnakeGame.jsx, sans toucher aux autres fichiers.
```

---

### Prompt 4 — Améliorer le design visuel

```
Mon jeu Snake React est fonctionnel avec sons et niveaux de difficulté.
Je veux un redesign complet pour avoir un rendu moderne et premium.

Design à appliquer :
- Fond : dégradé animé qui change de couleur en boucle (violet -> bleu -> indigo)
  via une animation CSS @keyframes dans index.css
- Particules flottantes en arrière-plan (petits ronds semi-transparents animés)
- Carte de jeu : effet glassmorphism (backdrop-blur, fond blanc semi-transparent,
  bordure lumineuse, ombre portée)
- Titre "SNAKE" : effet néon avec text-shadow coloré animé
- Tete du serpent : yeux animés (2 petits ronds blancs) + langue qui dépasse,
  rotation de la tete selon la direction
- Corps du serpent : dégradé de couleur du vert vif vers le vert foncé
  selon la position dans le corps (z-index pour effet de profondeur)
- Boutons : effet glassmorphism + hover avec glow coloré
- Overlays (pause/game over/victoire) : fond semi-transparent flouté
  avec animation d'apparition

Modifie SnakeGame.jsx pour les styles inline dynamiques et index.css
pour les animations globales. Utilise Tailwind pour le reste.
```

---

## Auteur

Projet réalisé dans le cadre d'un cours de développement web.

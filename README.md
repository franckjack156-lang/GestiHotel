# 🏨 GestiHôtel - Application de Gestion d'Interventions

Application web moderne pour la gestion des interventions hôtelières avec support PWA et mode hors ligne.

## 📋 Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Technologies](#technologies)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration Firebase](#configuration-firebase)
- [Démarrage](#démarrage)
- [Structure du projet](#structure-du-projet)
- [Déploiement](#déploiement)
- [Sécurité](#sécurité)

## ✨ Fonctionnalités

### 🎯 Gestion des interventions
- ✅ Création, modification et suppression d'interventions
- 📸 Upload de photos avec prévisualisation
- 🎤 Dictée vocale pour les commentaires
- 🏷️ Système de statuts et priorités
- 👥 Attribution aux techniciens
- 📊 Historique complet des modifications

### 👤 Gestion des utilisateurs
- 🔐 Authentification Firebase
- 🎭 Système de rôles (Super Admin, Manager, Réception, Technicien)
- 👨‍💼 Création et gestion des comptes
- 🔑 Réinitialisation de mots de passe
- 📱 Profils personnalisés

### 📈 Analytics et rapports
- 📊 Statistiques en temps réel
- 📉 Graphiques de performance
- 🎯 Métriques par technicien
- 📍 Analyse par localisation
- 📅 Rapports temporels

### 🎨 Interface et expérience
- 🌓 Mode sombre / clair
- 🎨 Thèmes personnalisables (6 couleurs)
- 📱 Design responsive (mobile, tablette, desktop)
- ♿ Accessibilité optimisée
- 🔄 Synchronisation en temps réel
- 📴 Mode hors ligne fonctionnel

### 🔧 Administration
- 📋 Gestion des listes déroulantes dynamiques
- 👨‍🔧 Base de données des techniciens
- 🏭 Gestion des fournisseurs
- 🛠️ Catalogue d'équipements
- 💾 Export/Import des données
- 🧹 Nettoyage automatique

## 🛠️ Technologies

### Frontend
- **React 18** - Framework JavaScript
- **Vite** - Build tool ultra-rapide
- **Tailwind CSS** - Framework CSS utility-first
- **Lucide React** - Bibliothèque d'icônes

### Backend & Services
- **Firebase Authentication** - Gestion des utilisateurs
- **Cloud Firestore** - Base de données NoSQL en temps réel
- **Firebase Storage** - Stockage de fichiers
- **Firebase Functions** - Serverless backend
- **Firebase Hosting** - Hébergement web

### PWA
- **Vite PWA** - Support Progressive Web App
- **Service Workers** - Cache et mode hors ligne
- **IndexedDB** - Stockage local

## 📦 Prérequis

- **Node.js** >= 16.x
- **npm** >= 8.x ou **yarn** >= 1.22
- **Compte Firebase** (gratuit)

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone https://github.com/votre-username/gestihotel.git
cd gestihotel
```

### 2. Installer les dépendances

```bash
npm install
# ou
yarn install
```

### 3. Configuration de l'environnement

Créer un fichier `.env` à la racine :

```bash
cp .env.example .env
```

## 🔥 Configuration Firebase

### 1. Créer un projet Firebase

1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquer sur "Ajouter un projet"
3. Suivre les étapes de création

### 2. Activer les services

#### Authentication
1. Dans la console Firebase : **Authentication** > **Sign-in method**
2. Activer **Email/Password**

#### Firestore Database
1. **Firestore Database** > **Créer une base de données**
2. Choisir **Mode production**
3. Sélectionner une région proche de vos utilisateurs

#### Storage
1. **Storage** > **Commencer**
2. Accepter les règles par défaut

#### Functions (optionnel)
1. **Functions** > **Commencer**
2. Suivre les instructions d'installation

### 3. Obtenir les credentials

1. **Paramètres du projet** (⚙️ icône)
2. Section **Vos applications** > **SDK Setup and configuration**
3. Copier les valeurs dans votre `.env` :

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet
VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxx
```

### 4. Déployer les règles de sécurité

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Se connecter
firebase login

# Initialiser le projet
firebase init

# Déployer les règles
firebase deploy --only firestore:rules,storage:rules
```

### 5. Créer les index Firestore

Les index composés sont définis dans `firestore.indexes.json`. Pour les déployer :

```bash
firebase deploy --only firestore:indexes
```

## 🎬 Démarrage

### Mode développement

```bash
npm run dev
# ou
yarn dev
```

L'application sera accessible sur `http://localhost:5173`

### Build de production

```bash
npm run build
# ou
yarn build
```

### Prévisualisation du build

```bash
npm run preview
# ou
yarn preview
```

## 📁 Structure du projet

```
gestihotel/
├── public/                      # Fichiers statiques
│   ├── manifest.json           # Configuration PWA
│   └── robots.txt
├── src/
│   ├── components/             # Composants React
│   │   ├── Admin/             # Composants admin
│   │   ├── Analytics/         # Graphiques et stats
│   │   ├── Auth/              # Authentification
│   │   ├── Dashboard/         # Tableau de bord
│   │   ├── Interventions/     # Gestion interventions
│   │   ├── Settings/          # Paramètres
│   │   ├── Users/             # Gestion utilisateurs
│   │   ├── common/            # Composants réutilisables
│   │   └── layout/            # Layout (Header, Sidebar)
│   ├── contexts/              # Contexts React
│   │   ├── AppContext.jsx     # État global app
│   │   ├── AuthContext.jsx    # Authentification
│   │   └── ToastContext.jsx   # Notifications
│   ├── hooks/                 # Hooks personnalisés
│   │   ├── useAuth.js
│   │   ├── useInterventions.js
│   │   ├── useSettings.js
│   │   ├── useSync.js
│   │   └── ...
│   ├── services/              # Services API
│   │   ├── interventionService.js
│   │   ├── storageService.js
│   │   ├── syncService.js
│   │   └── offlineService.js
│   ├── utils/                 # Utilitaires
│   │   ├── dateUtils.js
│   │   ├── fileUtils.js
│   │   └── validationUtils.js
│   ├── Config/
│   │   └── firebase.js        # Configuration Firebase
│   ├── App.jsx                # Composant racine
│   ├── main.jsx               # Point d'entrée
│   └── index.css              # Styles globaux
├── firestore.rules            # Règles de sécurité Firestore
├── firestore.indexes.json     # Index Firestore
├── storage.rules              # Règles de sécurité Storage
├── firebase.json              # Configuration Firebase
├── .env.example               # Variables d'environnement (template)
├── vite.config.js             # Configuration Vite
├── tailwind.config.js         # Configuration Tailwind
└── package.json
```

## 🚀 Déploiement

### Déploiement sur Firebase Hosting

```bash
# Build + Deploy
npm run deploy
# ou
yarn deploy

# Ou séparément
npm run build
firebase deploy --only hosting
```

### Déploiement sur Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

### Déploiement sur Netlify

```bash
# Build
npm run build

# Drag & drop le dossier dist/ sur Netlify
```

## 🔒 Sécurité

### Règles Firestore importantes

Les règles actuelles dans `firestore.rules` sont basiques. **Améliorez-les** :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Fonctions helper
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isSuperAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'superadmin';
    }
    
    function isActive() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.active == true;
    }
    
    // Users - RESTREINDRE DAVANTAGE
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isSuperAdmin(); // Seuls les admins créent
      allow update: if isOwner(userId) || isSuperAdmin();
      allow delete: if isSuperAdmin();
    }
    
    // Interventions
    match /interventions/{interventionId} {
      allow read: if isAuthenticated() && isActive();
      allow create: if isAuthenticated() && isActive();
      allow update: if isAuthenticated() && isActive();
      allow delete: if isSuperAdmin();
    }
  }
}
```

### Variables d'environnement

- ⚠️ **Ne JAMAIS commit le fichier `.env`**
- ✅ Utiliser `.env.example` comme template
- 🔒 Garder les credentials Firebase privées

### HTTPS

- ✅ Firebase Hosting active automatiquement HTTPS
- ✅ Redirection automatique HTTP → HTTPS

## 🐛 Dépannage

### Erreur "Permission denied" Firestore

➡️ Vérifier que l'utilisateur est authentifié et actif
➡️ Vérifier les règles Firestore
➡️ Vérifier que les index sont créés

### Photos ne s'uploadent pas

➡️ Vérifier Storage Rules
➡️ Vérifier que le bucket Storage existe
➡️ Vérifier la taille des fichiers (< 5MB)

### Mode hors ligne ne fonctionne pas

➡️ Vérifier que le Service Worker est enregistré
➡️ Ouvrir DevTools > Application > Service Workers
➡️ Vider le cache et reload

## 📝 Scripts disponibles

```bash
npm run dev          # Démarrer en développement
npm run build        # Build de production
npm run preview      # Prévisualiser le build
npm run deploy       # Build + Deploy Firebase
```

## 👥 Rôles utilisateurs

| Rôle | Permissions |
|------|-------------|
| **Super Admin** | Accès complet à tout |
| **Manager** | Gestion des interventions + Analytics + Options admin (sauf users) |
| **Réception** | Créer/voir les interventions |
| **Technicien** | Voir et mettre à jour ses interventions assignées |

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une PR.

## 📧 Contact

Pour toute question : [votre@email.com](mailto:votre@email.com)

---

**Développé avec ❤️ pour la gestion hôtelière moderne**
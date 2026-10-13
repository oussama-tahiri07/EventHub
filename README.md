# EventHub — Gestion d’Événements & Inscriptions

Application web complète de gestion centralisée d'événements, d'inscriptions et d'annuaire de participants, réalisée sur la pile **PERN** (PostgreSQL, Express, React, Node.js).

---

## Sommaire
- [Architecture & Conception](#-architecture--conception)
- [Fonctionnalités & Règles Métier](#-fonctionnalités--règles-métier)
- [Identifiants de Test (Seed)](#-identifiants-de-test-seed)
- [Démarrage Rapide avec Docker Compose](#-démarrage-rapide-avec-docker-compose)
- [Installation Manuelle Locale](#-installation-manuelle-locale)
- [Documentation de l'API (Swagger / OpenAPI)](#-documentation-de-lapi-swagger--openapi)
- [Tests Automatisés Backend](#-tests-automatisés-backend)

---

## 🏛 Architecture & Conception

Le document complet de conception avec diagramme Entité-Relation (Mermaid), contraintes et index recommandés est consultable dans :  
-> **[`docs/CONCEPTION.md`](file:///docs/CONCEPTION.md)**

```
Tython/
├── docker-compose.yml          # Déploiement complet (Postgres, Backend, Frontend)
├── docs/
│   └── CONCEPTION.md           # ERD (Mermaid), tables, relations, contraintes, index
├── database/
│   ├── init.sql                # Schéma DDL, contraintes, triggers & index
│   └── seed.sql                # Données initiales (2 utilisateurs, 5 événements, 10 participants, 20 inscriptions)
├── backend/
│   ├── src/
│   │   ├── config/             # Pool PostgreSQL, Swagger
│   │   ├── controllers/        # Auth, Events, Participants, Registrations, Dashboard
│   │   ├── middleware/         # Auth JWT, RBAC, Validation Zod, ErrorHandler
│   │   ├── routes/             # Routes REST API
│   │   ├── schemas/            # Schémas de validation Zod
│   │   ├── scripts/            # Migrate & Seeders Node.js
│   │   ├── app.js              # Application Express
│   │   └── server.js           # Point d'entrée HTTP
│   ├── tests/                  # Tests d'intégration Jest & Supertest
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/                # Client Axios configuré
    │   ├── context/            # AuthContext (JWT, rôle, persistance)
    │   ├── components/         # Navbar, Sidebar, StatCard, StatusBadge, Modal...
    │   ├── pages/              # Login, Dashboard, EventsList, EventDetail, ParticipantsList
    │   └── App.jsx
    └── vite.config.js
```

---

## Fonctionnalités & Règles Métier

1. **Authentification & Rôles** :
   - Rôle `admin` : accès complet aux événements, inscriptions et participants.
   - Rôle `staff` : organisation des événements et suivi des inscriptions.
   - Sécurisation par token JWT (Bearer) et mots de passe hachés avec **bcrypt**.

2. **Règles Métier Obligatoires Respectées** :
   -  **Règle 1** : Impossible d'inscrire un participant sur un événement non publié (`HTTP 400`).
   -  **Règle 2** : Un participant ne peut pas s'inscrire 2 fois au même événement (Contrainte unique `(event_id, participant_id)` + `HTTP 409`).
   -  **Règle 3** : Respect strict de `maxParticipants` (blocage atomique si complet avec `HTTP 400`).
   -  **Règle 4** : Quand un événement passe à `cancelled`, toutes ses inscriptions passent automatiquement à `cancelled` (transaction contrôlée + trigger SQL).

3. **Dashboard (KPIs en temps réel)** :
   - Nombre total d'événements
   - Nombre d'événements publiés
   - Inscriptions du jour (`CURRENT_DATE`)
   - Top 5 des événements les plus remplis (jauge de remplissage dynamique)

---

## Identifiants de Test (Seed)

Le script de seed injecte par défaut :
- **1 Administrateur** :
  - **Email** : `admin@eventhub.com`
  - **Mot de passe** : `password123`
  - **Rôle** : `admin`
- **1 Membre Staff** :
  - **Email** : `staff@eventhub.com`
  - **Mot de passe** : `password123`
  - **Rôle** : `staff`
- **5 Événements** (Publiés, Brouillons, Annulés)
- **10 Participants**
- **20 Inscriptions** réparties avec différents statuts (`confirmed`, `pending`, `cancelled`)

*(Des boutons de pré-remplissage en un clic sont présents directement sur l'écran de Login).*

---

## Démarrage Rapide avec Docker Compose

Pour lancer l'ensemble de l'infrastructure en une seule commande :

```bash
docker compose up --build -d
```

- **Frontend** : [http://localhost:3000](http://localhost:3000)
- **Backend REST API** : [http://localhost:5000](http://localhost:5000)
- **Swagger / OpenAPI** : [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **PostgreSQL** : `localhost:5433` (utilisateur: `postgres`, mdp: `postgres`, base: `eventhub`)

Pour arrêter les conteneurs :
```bash
docker compose down
```

---

## Installation Manuelle Locale

### Prérequis
- Node.js 18+
- PostgreSQL 14+ (ou un conteneur PostgreSQL lancé sur le port 5433)

### 1. Base de Données
Si vous utilisez Docker pour Postgres :
```bash
docker run -d --name eventhub-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=eventhub -p 5433:5432 postgres:16-alpine
```

Initialisez la structure et chargez le jeu de données :
```bash
cd backend
npm run migrate
npm run seed
```

### 2. Backend (Node.js + Express)
```bash
cd backend

# Copier l'environnement
cp .env.example .env

# Installer les dépendances
npm install

# Démarrer en mode développement
npm run dev
```
L'API démarre sur : [http://localhost:5000](http://localhost:5000)

### 3. Frontend (React + Vite)
Dans un second terminal :
```bash
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur Vite
npm run dev
```
L'application démarre sur : [http://localhost:3000](http://localhost:3000)

---

## Documentation de l'API (Swagger / OpenAPI)

Une interface Swagger interactive est disponible pour explorer et tester directement tous les endpoints :  
-> **[http://localhost:5000/api/docs](http://localhost:5000/api/docs)**

### Principaux Endpoints REST

| Domaine | Méthode | Endpoint | Description |
|---|---|---|---|
| **Auth** | `POST` | `/api/auth/login` | Connexion et obtention du JWT |
| | `GET` | `/api/auth/me` | Profil utilisateur connecté |
| **Events** | `POST` | `/api/events` | Créer un événement |
| | `GET` | `/api/events?status=&date=` | Liste avec filtres et pagination |
| | `GET` | `/api/events/:id` | Détails + liste des inscriptions |
| | `PUT` | `/api/events/:id` | Mettre à jour un événement |
| | `PATCH` | `/api/events/:id/status` | Changer le statut (publier / annuler) |
| **Participants** | `POST` | `/api/participants` | Créer un participant |
| | `GET` | `/api/participants?search=` | Recherche par nom ou email |
| | `GET` | `/api/participants/:id` | Détails + historique des inscriptions |
| | `PUT` | `/api/participants/:id` | Mettre à jour |
| | `DELETE`| `/api/participants/:id` | Supprimer (admin) |
| **Inscriptions** | `POST` | `/api/registrations` | Inscrire participant à un événement |
| | `GET` | `/api/registrations?eventId=&status=` | Liste des inscriptions |
| | `PATCH` | `/api/registrations/:id/status` | Modifier statut (confirmé / annulé) |
| **Dashboard** | `GET` | `/api/dashboard/stats` | Métriques & Top 5 événements |

---

## Tests Automatisés Backend

La suite de tests automatisés vérifie l'ensemble des règles métier, l'authentification et les contrôles de sécurité :

```bash
cd backend
npm test
```

Résultats : **13 tests passés avec succès** (100% de réussite) :
- Validation d'authentification et gestion d'erreurs 401
- Blocage d'inscription sur événement en brouillon (Règle 1 : `400 Bad Request`)
- Blocage d'inscription en doublon (Règle 2 : `409 Conflict`)
- Blocage lors du dépassement de capacité maximale (Règle 3 : `400 Bad Request`)
- Cascade automatique d'annulation d'événement sur ses inscriptions (Règle 4)
- Calcul précis des KPIs et agrégats du tableau de bord

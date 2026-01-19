🍽️ GlesCrocs - Gestion de File d'Attente
Fluidifiez l'expérience de restauration : commandez, attendez moins, savourez plus.

Ce projet est une application web complète (Fullstack) conçue pour moderniser la gestion de la cantine de notre établissement. Elle permet aux clients de suivre leur temps d'attente en temps réel et aux gérants de piloter les commandes efficacement.

📋 Contexte du projet
Face à l'absence d'outils pour gérer l'affluence, ce projet vise à :

Pour les clients : Supprimer le stress de l'attente, permettre la commande en amont et notifier quand le repas est prêt.

Pour le staff : Simplifier l'organisation, valider les commandes et notifier les clients sans crier les numéros.

🚀 Fonctionnalités Clés

📱 Côté Client (Frontend)
Suivi en temps réel : Visualisation de la file d'attente et estimation du temps restant.

Notifications : Alerte instantanée lorsque le repas est prêt (via Sockets).

Accessibilité : Interface Responsive Mobile accessible via Lien ou QR Code.

🛠️ Côté Administrateur (Dashboard)
Gestion du Menu : Mise à jour du "Menu du jour" affiché aux clients.

Pilotage des Commandes :

Création de commande (attribution d'un numéro).

Validation de la préparation (notification client).

Validation de la réception (clôture de la commande).

Supervision : Vue globale sur les commandes en cours et modification de la file en cas de problème.

🏗️ Architecture Technique
L'application repose sur une architecture 3-tiers moderne :

Base de données : MySQL (Relationnelle).

Backend : API REST avec Node.js et Express.

Temps Réel : Socket.io pour la communication bidirectionnelle (mises à jour de la file instantanées).

Frontend : React.js (Mobile First).

⚙️ Installation et Démarrage
Pré-requis
Node.js & npm

MySQL Server

1. Cloner le projet
Bash

git clone https://github.com/votre-username/cantine-connect.git
cd cantine-connect
2. Configuration Backend
Bash

cd backend
npm install
# Créez un fichier .env avec vos variables (DB_HOST, DB_USER, etc.)
npm start
3. Configuration Frontend
Bash

cd frontend
npm install
npm start
🔄 CI/CD (Intégration et Déploiement Continus)
Le projet intègre une pipeline DevOps via GitHub Actions :

Intégration Continue (CI) : À chaque push sur la branche main, un workflow notifie automatiquement l'équipe sur Discord/Google Chat/Slack.

Déploiement Continu (CD) :

Le Frontend est compilé et déployé automatiquement sur GitHub Pages.

(Note : Le Backend nécessite un hébergement VPS/Serveur dédié pour être accessible publiquement).

🌟 Fonctionnalités Bonus (Roadmap)
[ ] Statistiques : Analyse des temps d'attente par service (12h-14h vs 19h-22h).

[ ] Paiement : Intégration de Stripe pour le paiement en ligne.

[ ] Mobile Natif : Version React Native pour de meilleures performances.

[ ] Avis Clients : Module de notation après le repas.

📚 Compétences Mises en Œuvre
Développement d'interfaces utilisateur (React).

Conception de base de données relationnelle (MySQL).

Communication temps réel (Websockets).

Mise en place d'une chaîne CI/CD et DevOps.

Auteurs
[HEUREUX Axel] - Développeur Fullstack

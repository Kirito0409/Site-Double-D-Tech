# Double D Tech — Site vitrine

Site vitrine cybersécurité **Double D Tech**, construit avec **Astro + Tailwind CSS v4 + TypeScript**.
Le formulaire de contact envoie un vrai email vers votre boîte mail pro (via SMTP + Nodemailer).

## 🚀 Démarrage rapide

```bash
npm install
cp .env.example .env   # puis remplissez vos identifiants SMTP
npm run dev            # http://localhost:4321
```

## 📧 Configuration de l'envoi d'emails

Le formulaire `/contact` poste vers l'endpoint `src/pages/api/contact.ts`, qui envoie
un email via SMTP. Renseignez ces variables dans `.env` :

| Variable               | Description                                              |
| ---------------------- | -------------------------------------------------------- |
| `SMTP_HOST`            | Serveur SMTP (ex. `smtp.gmail.com`)                      |
| `SMTP_PORT`            | Port SMTP (`587` STARTTLS ou `465` SSL)                  |
| `SMTP_SECURE`          | `true` pour le port 465, `false` sinon                   |
| `SMTP_USER`            | Identifiant / adresse d'envoi                            |
| `SMTP_PASS`            | Mot de passe (pour Gmail : **mot de passe d'application**) |
| `CONTACT_TO`           | Adresse qui reçoit les demandes (votre boîte pro)        |
| `CONTACT_FROM`         | Expéditeur affiché (optionnel)                           |
| `PUBLIC_CONTACT_EMAIL` | Email affiché sur le site (bloc contact + footer)        |

### Gmail

1. Activez la **validation en 2 étapes** sur votre compte Google.
2. Créez un **mot de passe d'application** : <https://myaccount.google.com/apppasswords>
3. Collez ce mot de passe (16 caractères) dans `SMTP_PASS`.

> Pour une boîte OVH / Gandi / Infomaniak / Microsoft 365, utilisez simplement les
> paramètres SMTP de votre hébergeur mail — aucun code à modifier.

## 🧱 Structure

```
src/
├─ layouts/Layout.astro        # <head>, polices, fond animé (canvas), reveal au scroll
├─ components/                  # Header, Hero, Services, Méthode, Offres, Contact, Footer…
├─ pages/
│  ├─ index.astro              # page unique (statique)
│  └─ api/contact.ts           # endpoint POST d'envoi d'email (Nodemailer)
└─ styles/global.css           # thème Tailwind v4 + animations
```

## 🛠️ Scripts

| Commande          | Effet                                            |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Serveur de développement (hot reload)            |
| `npm run build`   | Build de production dans `dist/`                 |
| `npm run preview` | Lance le serveur Node de production              |

## 🐳 Docker (local / test)

Le site tourne en conteneur (serveur Node standalone d'Astro).

```bash
# build + run (lit automatiquement le .env), site sur http://localhost:4321
docker compose up --build

# ou en Docker « pur »
docker build -t double-d-tech .
docker run -p 4321:4321 --env-file .env double-d-tech
```

## 🚀 Déploiement sur un VPS (HTTPS automatique)

La pile de production `docker-compose.prod.yml` ajoute un reverse proxy **Caddy**
qui obtient et renouvelle automatiquement un certificat **HTTPS Let's Encrypt**
pour votre domaine.

### Prérequis

1. Un VPS avec **Docker** et **Docker Compose** installés.
2. Le domaine `SITE_DOMAIN` (ex. `doubledtech.fr`) **pointe vers l'IP du VPS**
   (enregistrement DNS de type **A**, + un `A` pour `www` si souhaité).
3. Les **ports 80 et 443** sont ouverts dans le pare-feu du VPS.
4. Le port SMTP sortant (**465**) est autorisé (pour l'envoi d'emails).

### Étapes

```bash
# 1. Récupérer le projet sur le VPS
git clone <votre-repo> double-d-tech && cd double-d-tech
#   (ou copiez le dossier via scp / rsync)

# 2. Créer le fichier .env et le remplir (SMTP_PASS + SITE_DOMAIN)
cp .env.example .env
nano .env

# 3. Lancer en production (build + HTTPS auto, en arrière-plan)
docker compose -f docker-compose.prod.yml up -d --build
```

Le site est alors accessible en **https://votre-domaine** — le certificat TLS est
généré automatiquement au premier démarrage (patientez ~30 s).

### Commandes utiles

```bash
docker compose -f docker-compose.prod.yml logs -f        # voir les logs
docker compose -f docker-compose.prod.yml ps             # état des conteneurs
docker compose -f docker-compose.prod.yml up -d --build  # redéployer après maj
docker compose -f docker-compose.prod.yml down           # arrêter
```

> **Mise à jour du site** : `git pull` puis relancez la commande `up -d --build`.
> Caddy et les certificats sont conservés dans des volumes Docker (`caddy_data`).

---

© Double D Tech — Tous droits réservés

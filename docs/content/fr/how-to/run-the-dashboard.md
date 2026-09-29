# Lancer le tableau de bord et le backend

Le tableau de bord (`web/`) est une application Next.js qui effectue tout son rendu via le backend kikx (`backend/`). Les deux doivent être lancés.

## Démarrer les deux avec les valeurs par défaut

```bash
cp backend/.env.example backend/.env
cp web/.env.example web/.env.local
```

Dans un premier terminal :

```bash
cd backend
cargo run
```

Il affiche `kikx-backend listening on http://127.0.0.1:4000`.

Dans un second terminal :

```bash
cd web
npm install
npm run dev
```

Ouvrez `http://localhost:3000`.

Le backend charge `.env` depuis le répertoire dans lequel vous le démarrez : lancez donc `cargo run` depuis `backend/`.

## Utiliser un autre port ou une autre adresse

Modifiez `backend/.env` :

```dotenv
KIKX_PORT=4100
KIKX_BIND=127.0.0.1
KIKX_ALLOWED_ORIGINS=
```

Puis faites pointer le tableau de bord vers cette adresse dans `web/.env.local` :

```dotenv
NEXT_PUBLIC_KIKX_API_URL=http://localhost:4100
```

Relancez `npm run dev` après avoir modifié `web/.env.local`. Next.js lit les variables `NEXT_PUBLIC_*` au démarrage.

Les options de ligne de commande remplacent le fichier le temps d'une exécution :

```bash
cargo run -- --port 4100 --bind 127.0.0.1
```

## Autoriser une origine de navigateur non locale

Lorsque `KIKX_ALLOWED_ORIGINS` est vide, le backend accepte toute origine de boucle locale (`localhost`, `127.0.0.1`, `[::1]`) sur n'importe quel port. Toute autre origine est refusée.

Si vous ouvrez le tableau de bord depuis un autre nom d'hôte, listez chaque origine autorisée, séparées par des virgules :

```dotenv
KIKX_ALLOWED_ORIGINS=https://kikx.example.com,http://localhost:3000
```

Dès que vous définissez une liste, seules ces origines exactes sont autorisées. La boucle locale n'est plus autorisée automatiquement : ajoutez-la de nouveau si vous en avez encore besoin.

Le backend n'a pas d'authentification. Laissez-le lié à `127.0.0.1`, sauf si vous faites confiance à tout ce qui peut atteindre le port.

## Vérifier que tout fonctionne

```bash
curl http://localhost:4000/api/health
```

Cette commande renvoie `ok`. Si le tableau de bord affiche « Can't reach the kikx backend », vérifiez que `NEXT_PUBLIC_KIKX_API_URL` correspond à l'adresse du backend et que l'origine du tableau de bord est autorisée. Cliquez ensuite sur « Try again ».

## Voir aussi

- [Configuration](../reference/configuration.md)
- [API HTTP](../reference/http-api.md)
- [Comment les éléments s'articulent](../explanation/project-layout.md)

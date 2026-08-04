# Moniteur privé du 98 avenue de Villiers

Ce dossier surveille les signaux factuels liés à l'immeuble sans publier de donnée personnelle et sans aspirer les sites d'annonces.

## Ce que fait le script local

- ADEME : interroge le jeu officiel DPE à l'adresse exacte, crée une baseline, dédoublonne par numéro de DPE et alerte uniquement sur un nouveau DPE ou une modification substantielle.
- RNE : interroge l'API officielle de l'Annuaire des entreprises par SIREN vérifié. Il ne conserve ni dirigeant, ni contact, ni adresse exacte du siège.
- Annonces : ingère uniquement une liste de liens déjà trouvés et vérifiés. Il retire les paramètres de suivi et conserve seulement des caractéristiques immobilières non personnelles.
- Journal : conserve la baseline dans `.private/villiers-watch-state.json` et les rapports/alertes voisins dans `.private/`, ignoré par Git.

Le changement de la seule date technique de mise à jour ADEME ou RNE ne déclenche pas d'alerte. Une disparition temporaire dans une API ne supprime pas la baseline et ne déclenche pas de faux signal.

## Commandes

```text
npm run test:monitoring
npm run monitor:villiers:baseline
npm run monitor:villiers
node monitoring/run.mjs --only=ademe,rne --json
node monitoring/run.mjs --only=announcements --json
powershell.exe -NoProfile -ExecutionPolicy Bypass -File monitoring/run.ps1 --only=ademe,rne --json
```

`run.ps1` retrouve automatiquement le runtime Node fourni par Codex lorsque `node` n'est pas présent dans le `PATH` Windows. La commande `powershell.exe ... -ExecutionPolicy Bypass` est la plus robuste pour une heartbeat locale sur ce poste.

Le premier lancement est automatiquement traité comme une baseline sans alerte. `--baseline` permet de la réinitialiser volontairement. `--dry-run` ne modifie aucun fichier.

## Baseline RNE

Les SIREN actuellement qualifiés sont dans `config.json`. `SCI SODAIM` reste volontairement non raccordée : plusieurs sociétés homonymes existent et aucune pièce locale ne permet de choisir sans inventer.

## Annonces immobilières

Il n'existe pas d'API publique générale et documentée pour Leboncoin, SeLoger ou Bien'ici. Le script ne contourne donc ni robots.txt, ni authentification, ni conditions d'utilisation.

Une automation Codex doit effectuer chaque jour les requêtes `automationQueries` avec la recherche web, ouvrir seulement les pages publiquement accessibles et écrire les résultats retenus dans :

`.private/villiers-watch-announcement-candidates.json`

Le format attendu est illustré dans `examples/announcement-candidates.example.json`. Ne jamais ajouter le nom, le téléphone, l'email ou l'identité du vendeur. Après l'écriture du fichier, l'automation exécute `node monitoring/run.mjs --only=announcements --json` et ne notifie que si `alertCount` est supérieur à zéro ou si `errors` n'est pas vide.

## Répartition script / automation Codex

Le script doit rester responsable des appels déterministes aux API officielles, de la baseline, des empreintes, du dédoublonnage et du journal privé.

L'automation Codex doit rester responsable de la recherche web d'annonces, car elle peut respecter les accès publics, lire le contexte d'une page, citer la source et éviter le scraping automatisé d'un portail sans API. Elle peut aussi résumer les alertes et les transmettre, mais ne doit jamais publier le fichier d'état ni modifier le dashboard public avec des données personnelles.

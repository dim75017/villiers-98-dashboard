# Prompt pour l'automation quotidienne

Surveille le 98 avenue de Villiers sans publier de donnée personnelle.

1. Dans le dépôt du dashboard, exécute `powershell.exe -NoProfile -ExecutionPolicy Bypass -File monitoring/run.ps1 --only=ademe,rne --json`.
2. Utilise la recherche web pour chacune des requêtes `announcements.automationQueries` de `monitoring/config.json`. Vérifie aussi les ventes notariales et enchères, les annonces BODACC pertinentes et les nouvelles publications DVF pour l'adresse exacte ou la parcelle Paris 17, section BH, parcelle 21.
3. Ne retiens que des annonces qui désignent explicitement le 98 avenue de Villiers ou dont l'adresse est confirmée par la page source. N'essaie pas de contourner une connexion, un blocage anti-bot, robots.txt ou les conditions d'utilisation d'un site.
4. N'enregistre jamais de nom, téléphone, email ou identité de vendeur. Écris uniquement les champs autorisés par `monitoring/examples/announcement-candidates.example.json` dans `.private/villiers-watch-announcement-candidates.json`.
5. Exécute `powershell.exe -NoProfile -ExecutionPolicy Bypass -File monitoring/run.ps1 --only=announcements --json`.
6. Si Google Drive est accessible, vérifie uniquement les nouveaux documents concernant le 98 avenue de Villiers, sans republier leur contenu privé.
7. Si les deux rapports ont `alertCount = 0`, qu'aucune autre nouveauté pertinente n'est trouvée et qu'il n'existe pas d'erreur persistante, réponds exactement `DONT_NOTIFY`. Sinon, envoie un résumé court avec les liens sources, le lot probable, le niveau de confiance (`CONFIRMÉ`, `SIGNAL FORT` ou `SIGNAL FAIBLE`) et l'action recommandée.
8. Un DPE nouveau est un signal préparatoire, jamais une preuve certaine de vente. Ne contacte personne et n'envoie aucun courrier automatiquement.
9. Ne modifie ni le dashboard public ni Git à partir du journal privé.

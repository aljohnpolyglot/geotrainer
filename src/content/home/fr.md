# Apprenez un lieu. Rappelez-le. Retenez-le.

GeoTrainer transforme Street View en mémoire géographique durable. Découvrez des lieux, testez-vous sans indice et revenez aux points faibles au moment le plus utile.

## Démarrage rapide

Commencez par un nouveau panorama. Vos erreurs alimentent automatiquement la file de révision.

## Rappel actif

Un lieu peut sembler familier ; le situer prouve ce que vous savez retrouver. Jeu et Révision demandent une réponse avant d’afficher la solution, renforçant le souvenir et révélant l’incertitude.

## Utiliser ou oublier

Les indices géographiques s’effacent lorsqu’on ne les voit qu’une fois. GeoTrainer conserve chaque tentative et ramène les lieux difficiles sans tout répéter également.

## Répétition espacée

Une réponse faible revient plus tôt ; une réponse solide attend plus longtemps. La distance et le score déterminent automatiquement la prochaine révision.

## Votre cycle d’entraînement

1. Étudier — Explorez des panoramas inconnus et apprenez quels indices visibles comptent.
2. Jouer — Répondez sans aide afin de mesurer ce dont vous vous souvenez.
3. Réviser — Retrouvez les lieux faibles selon leur calendrier jusqu’à les reconnaître durablement.

## Comment GeoTrainer complète GeoGuessr

[GeoGuessr](https://www.geoguessr.com/) excelle dans l’exploration, la variété des cartes, les défis solo, le multijoueur et la compétition. GeoTrainer se concentre sur l’intervalle entre les parties : il transforme rencontres et erreurs en plan durable avec étude non notée, historique des tentatives, répétition espacée automatique, groupes de pays confondus et indices enregistrés. Utilisez GeoGuessr pour explorer et vous mesurer aux autres ; utilisez GeoTrainer pour comprendre vos erreurs, travailler vos confusions et ancrer vos acquis. C’est un complément, pas un remplacement.

## Mode Étude

Dans l’étude personnalisée et le jeu, **Couverture intérieure** propose Extérieur uniquement (par défaut) ou Mixte : intérieur et extérieur. Google ne fournit pas de recherche fiable limitée aux intérieurs ; le mode mixte peut montrer les deux. Ce réglage ne modifie pas les cartes importées, Meta, Explorer la carte ni la Révision.

Apprendre propose quatre choix : Personnalisé, Meta, Explorer la carte et Carte importée. Pour Carte importée, choisissez un JSON Map Maker contenant une liste de lieux ou `customCoordinates` ; chaque lieu doit avoir une latitude et une longitude valides. Le fichier doit faire moins de 10 Mo. Précédent se trouve avant Révéler et devient disponible après la visite de deux lieux. Suivant parcourt d’abord les lieux déjà vus avant d’en choisir un autre. La croix à droite de l’en-tête ouvre le choix du mode. La carte reste sur cet appareil ; importez-la aussi sur tout autre appareil utilisé. La variation 0 conserve la vue importée ; 100 cherche Street View jusqu’à 1 km autour et revient à un lieu initial si nécessaire. Le bouton moins réduit la fiche du lieu et agrandir la déploie sur tout l’écran.

Étude est une première rencontre non notée. Choisissez une collection, un pays cible ou un groupe de pays souvent confondus ; chaque pays devient une pastille avec drapeau que vous pouvez retirer. Enregistrer un indice crée automatiquement une carte de Révision sans score fictif. L’état enregistré est restauré après rechargement, donc l’action ne réapparaît pas.

## Mode Jeu

Dans les réglages du jeu, choisissez Lieux générés ou Carte importée. Les manches de la carte utilisent ses lieux et peuvent les répéter si les manches sont plus nombreuses.

Jeu utilise le même groupe de pays et mesure le rappel sans aide sur 1 à 100 manches. Chaque réponse devient une nouvelle tentative et conserve la vue actuelle pour les aperçus.

## Révision et planification

La réponse reste cachée jusqu’à votre estimation. La pratique personnalisée laisse les cartes futures inchangées ; terminer une carte déjà due avance son échéance et persiste après rechargement.

## Coach IA et indices

Jeu utilise la même barre d’apprentissage qu’Étude : Carnet, compteur des notes disponibles à proximité et Coach IA lorsqu’il est activé dans la configuration de la partie.

Coach attend la langue IA enregistrée avant l’analyse, rejette les résultats nettement multilingues et explique les indices visibles derrière chaque nouveau pays candidat.

Analyser rassemble automatiquement plusieurs directions et revient à la vue actuelle si nécessaire. Une estimation de région, ville ou lieu exact n’apparaît que si plusieurs indices visuels forts la soutiennent. Après la révélation, **Analyser** devient **Expliquer** : le Coach utilise uniquement les références du bon pays et reconnaît si l’image ne suffisait pas à l’identifier. Indices ouvre une bibliothèque avec détail complet, Street View et liens Google Maps ; le filtre affiche le total par pays, les classe du plus fourni au moins fourni et × l’efface.

### Capturer, coller et analyser un indice

1. Cadrez l’indice puis appuyez sur **Impr. écran** ou **Windows + Maj + S** pour copier une capture.
2. Ouvrez **Coach IA → Indices connus**, sélectionnez la zone d’indice et appuyez sur **Ctrl + V** (ou **Commande + V** sous macOS).
3. Vérifiez l’aperçu puis choisissez **Analyser l’indice**.
4. GeoTrainer enregistre automatiquement l’image, les preuves et la note d’apprentissage dans **Indices**. Avant une réponse en Révision, l’analyse ne révèle pas la solution.

Si le recadrage montre un sujet principal évident au premier plan, le Coach l’analyse d’abord et utilise l’environnement comme contexte favorable ou contradictoire. Les détails illisibles restent explicitement incertains.

### Utiliser une réponse d’IA externe dans le Carnet

1. Capturez ou copiez l’image de l’indice.
2. Ouvrez Gemini ou une autre interface externe d’IA Google, puis joignez ou collez l’image.
3. Commencez par : **« Tu es un coach GeoGuessr. »** Demandez les preuves visibles, les principaux pays similaires et l’indice qui permettrait de les départager.
4. Copiez la réponse et collez-la dans le champ de texte du **Carnet**.
5. Enregistrez la note pour Révision.

Le Carnet conserve les titres, le gras et les listes à puces collés. Les réponses externes ne sont pas vérifiées automatiquement : laissez les détails illisibles incertains et confrontez chaque affirmation à ce qui est réellement visible.

## Collections et préférences

Dans Réglages → Affichage → Cartes, la **Palette de couleurs de la carte** propose Auto, Clair ou Sombre. Auto suit l’apparence de l’application ; Clair ou Sombre garde le choix pour les plans routiers et de relief. Les images satellite conservent leurs couleurs. Les frontières des pays sont visibles par défaut et peuvent être masquées ; elles n’apparaissent que lorsqu’une frontière se trouve dans la zone affichée.

Pays, villes et environnements orientent la génération sans garantir une couverture totale. Les préférences séparent langues de l’interface, du jeu et de l’IA, ainsi que révision, fuseau horaire, apparence et aides cartographiques. Un nouveau profil autorise 50 nouvelles cartes et 500 révisions par jour. Effets et musique d’ambiance sont facultatifs, désactivés au départ et disposent de volumes séparés.

## Progression et statistiques

Les lieux enregistrés en Étude sont des sources non notées : ils comptent comme activité d’Étude et nouvelles cartes, jamais comme essais « Sans réponse » ou scores nuls. Un rechargement reprend la visite en cours sans ajouter de ligne.

Consultez lieux, tentatives, file, performances, historique et temps actif au premier plan pendant l’Étude, le Jeu actif et la Révision active, y compris les déplacements dans les panoramas et l’utilisation des aides. Le temps est enregistré lors d’un changement de section ou du retour à l’accueil ; les sessions sans visite ni tentative sont masquées. Sur écran tactile, maintenez une barre **Échéances à venir** pour afficher sa date et son nombre. Indices connus totalise les entrées personnelles, IA et Méta sans compter deux fois l’image d’une note. Les parties assistées par IA sont incluses par défaut et peuvent être exclues. Le résumé sépare moyenne précédente et du jour. Deux lieux du même pays à moins de 50 mètres partagent une carte.

## Synchronisation cloud

Le compte est facultatif et l’entraînement local fonctionne sans connexion. Une fois connecté, la synchronisation inclut la progression et les réglages de Révision, langue, interface, audio et jeu ; le réglage le plus récent et la Révision notée en dernier l’emportent. Le cloud est vérifié lorsque chaque écran reprend le focus et met à jour l’application ouverte sans rechargement ni remplacement de l’espace de travail actif. Sans connexion, localhost et le site publié restent séparés.

## Dépannage

1. Panorama vide — passez au suivant ; la couverture Street View peut changer.
2. Commandes sur un écran noir — testez Street View dans Google Maps avec le même navigateur. Si l’image y est également noire, ouvrez GeoTrainer dans une fenêtre privée sans extensions, changez le réglage d’accélération graphique du navigateur, puis relancez-le. Mettez à jour le navigateur et le pilote graphique si nécessaire. Si seul GeoTrainer échoue, rechargez-le une fois et indiquez le navigateur, l’appareil et les extensions actives dans votre signalement.
3. Révision vide — jouez ou enregistrez un lieu d’Étude, puis attendez son échéance.
4. IA indisponible — continuez normalement et réessayez plus tard.
5. Progression ancienne — vérifiez le compte et attendez la fin de la synchronisation.

## Suggestions et signalements de bugs

Envoyez vos suggestions ou signalements de bugs à [mogatas.princealjohn.05082003@gmail.com](mailto:mogatas.princealjohn.05082003@gmail.com). Pour un bug, précisez le navigateur, l’appareil, l’action en cours et joignez une capture d’écran si possible.

## Questions fréquentes

1. Un compte est-il obligatoire ? — Non, seulement pour synchroniser.
2. Étude affecte-t-il le score ? — Non.
3. Puis-je noter manuellement ? — Non, le résultat géographique décide.
4. La pratique libre reporte-t-elle une carte ? — Non ; les cartes futures restent inchangées et une carte déjà due avance une fois terminée.
5. Couverture montre-t-elle tous les lieux ? — Non, seulement ceux rencontrés.

## Ressources d’apprentissage

Croisez marquages routiers, sens de circulation, écritures, poteaux, relief, architecture, végétation, génération de caméra et météo. Plusieurs indices concordants valent mieux qu’un seul indice frappant.

### Références externes

- [Plonk It](https://www.plonkit.net/) — guides structurés par pays, régions, cartes et exercices.
- [GeoHints](https://geohints.com/) — catalogue visuel de bornes, lignes, plaques, panneaux, poteaux, caméras et autres indices.
- [GeoMetas](https://geometas.com/) — leçons gratuites de métas par pays, région et catégorie, avec des quiz dynamiques.
- [Learnable Meta](https://learnablemeta.com/) — cartes d’apprentissage GeoGuessr, documentation et ressources de création de cartes.

## Apprendre, Méta et Carnet

La **caméra à 360°** de l’espace de travail copie quatre directions du panorama actuel dans une seule image. L’image est placée directement dans le presse-papiers et n’est pas enregistrée dans GeoTrainer.

Apprendre propose trois parcours. **Personnalisé** conserve collections et environnements. **Méta** ouvre des leçons guidées au panorama et à l’orientation enregistrés. **Explorer la carte** affiche la couverture Street View. Dans Méta et la carte, Révéler ouvre la fiche normale, où Enregistrer pour révision programme le futur exercice de localisation. La carte remplace Suivant par Retour à la carte du monde. Apprendre personnalisé et Jeu utilisent les images officielles Google par défaut ; le sélecteur permet de mélanger panoramas officiels et contributeurs ou de demander uniquement les panoramas de contributeurs. **Autoriser les intérieurs** est désactivé par défaut dans les deux configurations ; une fois activé, Google peut proposer une couverture Street View intérieure ou extérieure. Dans **Paramètres → Affichage**, vous pouvez régler les noms de rues, la date des images, le mouvement du téléphone, le déplacement, le type de carte, les gestes, les lieux cliquables et les couleurs GeoTrainer. Les noms de rues et les lieux cliquables sont désactivés par défaut pour limiter les indices accidentels.

L’ampoule en haut à droite affiche ou masque l’explication. Le conseil initial peut être fermé une fois ou définitivement sans retirer les leçons. Une Méta rejoint **Mes indices** uniquement après l’enregistrement explicite de son lieu pour révision. En révision, seule l’image apparaît avant la réponse ; le texte complet vient ensuite et les outils d’apprentissage restent disponibles jusqu’au choix de la révision suivante.

Le **Carnet** conserve autant de notes personnelles que souhaité par panorama. Catégorie et texte sont facultatifs ; une entrée vide peut aussi enregistrer le lieu à réviser. Il accepte également les images analysées par Coach. Vous pouvez écrire et enregistrer une nouvelle note pendant la révision ; son analyse d’image ne révèle pas la réponse avant la tentative. Les entrées personnelles, IA et Méta ouvrent une vue détaillée avec Street View et une image superposée lorsqu’elle existe. **Notes disponibles** affiche un compteur et tout l’historique défilant ; les nouvelles analyses Coach y entrent immédiatement et ne se rouvrent pas comme résultat actif après rechargement. Mes indices filtre **Personnel**, **Assisté par IA** et **Leçons Méta** et pagine les résultats correspondants par groupes de 20 ; le texte révélateur reste masqué avant la réponse.

Chaque enregistrement du Carnet reste une entrée indépendante, même dans le même panorama. Si une photo envoyée ne peut pas être chargée, la note reste visible et est signalée pour récupération.

Un résultat faible revient automatiquement à la fin de la session de révision jusqu’à sa réussite. Chaque essai reste un enregistrement distinct.

L’étude Méta contient 359 leçons hébergées localement, normalisées depuis la capture OpenGuessr appariée et des exemples GeoMetas supplémentaires disposant de coordonnées Street View utilisables. Les explications Méta suivent la langue de l’interface dans les huit langues prises en charge. Utiliser Coach IA ou enregistrer une entrée du Carnet crée ou réutilise automatiquement la carte de révision ; sinon, la fiche du lieu révélé conserve Enregistrer pour révision. **Notes disponibles** contient l’historique personnel et assisté par IA du panorama et des nœuds Street View du même pays situés à moins de 50 mètres, avec l’analyse complète, l’heure exacte et la capture soumise lorsqu’elle existe ; Méta reste sous son ampoule. Coach attend la préférence linguistique enregistrée et demande toutes les valeurs en langage naturel dans la langue IA choisie. Le texte personnel et IA finalisé conserve sa langue de création. Réviser une carte déjà due avance son calendrier même depuis la pratique personnalisée et persiste après rechargement.

Méta sélectionne uniquement les leçons non terminées. Une fois les 359 achevées, son option d’apprentissage est grisée et ne peut plus être sélectionnée.

Une session Étude ou Jeu inachevée est conservée. À votre retour, choisissez **Reprendre**, **Recommencer** ou **Retour**. La couverture propose une carte thermique continue de **Maîtrise** : de nombreuses révisions réussies et de longs intervalles éclaircissent progressivement les pays et lieux, tandis que les échecs réduisent l’intensité. Un panorama ouvert depuis Couverture propose Coach IA, Carnet, Méta liée et Notes disponibles ; un enregistrement crée ou réutilise sa carte de révision. Les indices Méta dépendant de l’imagerie affichent un avertissement, car les mises à jour Street View peuvent les rendre obsolètes.

## Styles et profondeur du Coach IA

Dans **Paramètres → Coach IA**, choisissez **Toujours demander avant l’analyse** ou un style préféré. La profondeur Courte, Normale ou Approfondie reste indépendante et change le détail, pas la méthode. Aucun mode Adaptive ni changement automatique.

- **⚡ Quick Guess :** pays probables, vraisemblance relative, principaux indices visibles et confiance. Rapide en partie, mais moins pédagogique.
- **🎯 Meta Coach :** classe poteaux, balises, lignes, plaques, panneaux, voiture Google et couverture par niveau S–D, rôle, fiabilité et confusions. Idéal en No Move, malgré des métas évolutives.
- **🚫 Elimination Coach :** présente les candidats, les indices défavorables, les options plausibles et le meilleur indice de séparation. Limite l’ancrage et évite « impossible » lorsque des exceptions existent.
- **🌍 Deep Geography :** suit quoi → fonction → cause → réponse humaine → résultat visible → valeur GeoGuessr. Développe l’intuition causale, mais signale quand l’image ne justifie pas une histoire, une économie ou une géologie.
- **🧠 Memory Coach :** crée des repères véridiques, chaînes causales, contrastes, contre-indices et questions de rappel. Favorise la mémorisation sans transformer les simplifications en absolus.
- **🏆 Pro Analyst :** pondère indices positifs et négatifs, contradictions, indépendance, indices faibles, incertitude et gain d’information. Adapté aux cas serrés, mais les pourcentages restent des estimations IA.

Tous partent des mêmes observations et séparent observation, inférence et spéculation. Chaque candidat explique le détail concret, sa portée nationale ou régionale, la confusion principale, ce qui les distingue et l’indice qui augmenterait le plus la confiance. Aucun sigle, organisme, culture, fait historique, cause géologique, industrie ou règle n’est inventé.
Pendant une Révision active, l’en-tête indique la carte actuelle, les cartes restantes et que la progression est enregistrée. Un rechargement conserve le nombre de cartes déjà terminées.

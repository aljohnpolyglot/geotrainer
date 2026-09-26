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

### Choisir une priorité d’apprentissage

L’apprentissage avec une carte importée identifie la progression de la source (par exemple **Source : 1/50**). Chaque entrée est marquée comme terminée après vérification : **Suivant** ne peut donc pas la reprendre même si une variation proche ouvre un autre panorama ; une entrée défectueuse n’est également testée qu’une fois. À la fin, **Suivant** disparaît et seul **Précédent** reste. Le Jeu évite aussi de répéter les entrées source. Dans Explorer la carte, recherchez une ville, une région ou un pays puis choisissez une suggestion du catalogue intégré de GeoTrainer pour y zoomer. Les suggestions déplacent seulement la carte de couverture ; cliquez sur la couverture bleue pour ouvrir Street View. Le texte personnel du Carnet est limité à 1 000 caractères par enregistrement et un compteur apparaît sous l’éditeur.

La priorité modifie la sélection des **nouveaux lieux de l’apprentissage personnalisé** après l’application de la collection, du mélange de pays, de l’environnement, de la source d’images et du filtre intérieur. Elle ne change pas Carte importée, Méta, Explorer la carte, Jeu ou Révision.

- **Aléatoire** (par défaut) choisit dans l’ensemble admissible sans utiliser votre historique. Dans Monde, il réduit le poids des très petits territoires pour qu’ils ne dominent pas. Utilisez-le pour varier les lieux ou parcourir largement la collection.
- **Lieux familiers** prend comme point de départ un lieu admissible déjà rencontré et cherche dans un rayon d’environ 1 à 12 km. Il aide à apprendre les environs et à reconnaître des vues proches sans répéter exactement le même panorama.
- **Moins exploré** choisit d’abord un pays admissible jamais vu ou le moins rencontré, remplit les régions incluses encore grises dans la Couverture, puis vise la plus grande lacune géographique restante. Cette étape régionale s’applique aussi aux collections d’un seul pays ; une région sans point local utilisable revient à la recherche nationale.

Sans historique admissible, Lieux familiers et Moins exploré commencent dans l’ensemble sélectionné comme Aléatoire. Dans une recherche Moins exploré avec plusieurs pays, GeoTrainer essaie d’abord le pays gris ou le moins rencontré choisi et sa cible régionale. Chaque recherche sans panorama valide, y compris lorsqu’un panorama se trouve hors du pays demandé, avance immédiatement. Après l’échec d’un pays jamais vu, les pays dont la couverture a déjà été confirmée sont essayés du moins au plus exploré avant les autres pays inconnus ; les égalités sont mélangées. L’ordre recommence jusqu’à trouver un panorama ou jusqu’à votre départ. La couverture Street View et les filtres actifs déterminent toujours si la zone visée peut fournir un panorama ; une vue disponible à proximité peut donc être utilisée si le point exact n’est pas couvert.

Dans Monde avec Moins exploré, une analyse de couverture intégrée ignore les pays dont les points n’ont trouvé aucun panorama officiel navigable. Les ensembles ciblés continuent de rechercher tous les pays sélectionnés.

Étude est une première rencontre non notée. Choisissez une collection, un pays cible ou un groupe de pays souvent confondus ; chaque pays devient une pastille avec drapeau que vous pouvez retirer. Enregistrer un indice crée automatiquement une carte de Révision sans score fictif. Le lieu actuel reste ouvert après l’enregistrement ; utilisez Suivant lorsque vous souhaitez continuer. L’état enregistré est restauré après rechargement, donc l’action ne réapparaît pas.

Utilisez les listes séparées **Régions** et **Villes** et retirez les sélections avec leurs pastilles. Les régions sont regroupées par pays, les villes par région. Sans région sélectionnée, le choix porte sur tout le pays. Sans ville sélectionnée dans une région, toutes ses villes disponibles sont incluses ; choisir des villes limite uniquement cette région. Retirer une région retire ses villes ; retirer sa dernière ville rétablit toutes ses villes disponibles. Après avoir ajouté des pays, vous pouvez ajouter des régions et des villes sous forme de pastilles indépendantes. Les régions sont classées par ordre alphabétique ; les villes sont classées par importance selon leur population par défaut, avec une option alphabétique. **Toutes les villes disponibles** utilise les points de ville inclus dans la région ; ce choix ne couvre pas tout le polygone administratif et ne garantit pas chaque route ou zone rurale. Une nouvelle configuration Apprendre après une session ciblée rétablit World et la liste complète des pays ; Reprendre conserve la session enregistrée. Le mode de moindre exposition cherche d’abord au point choisi, puis élargit localement. En mode Mixte, les nouvelles tentatives utilisent des points de couverture du pays en conservant les filtres. La recherche continue à un rythme modéré jusqu’à trouver une correspondance ou jusqu’à ce que vous quittiez ou modifiiez la configuration ; la couverture au point exact n’est pas garantie.

Les noms des régions et des villes suivent la langue de l’interface lorsqu’un nom localisé est disponible. **Enregistrer le groupe géographique** télécharge les pays, régions et villes choisis au format JSON, sans coordonnées Street View. **Importer un JSON** et **URL JSON** acceptent ce format modifiable ou un JSON de coordonnées Map Maker ; un groupe géographique revient dans Personnalisé pour être modifié, tandis que les coordonnées restent une source finie. Le nom du fichier ou de l’URL est affiché. Le endpoint doit autoriser l’accès du navigateur (CORS).

**Décrire un groupe** envoie une courte demande à Gemini, puis ouvre les pays, régions et villes proposés dans Personnalisé afin de les vérifier et de les modifier. Vous pouvez écrire dans toute langue prise en charge et décrire des lieux, des paysages ou des confusions fréquentes. Il s’agit d’une suggestion de l’IA, pas d’une garantie géographique.

## Mode Jeu

Dans les réglages du jeu, choisissez Lieux générés ou Carte importée. Les manches de la carte utilisent ses lieux et peuvent les répéter si les manches sont plus nombreuses.

Jeu utilise le même groupe de pays et mesure le rappel sans aide sur 1 à 100 manches. Chaque réponse devient une nouvelle tentative et conserve la vue actuelle pour les aperçus.

## Révision et planification

### Personnaliser la révision

- **Nouvelles cartes / jour** limite les cartes jamais révisées. **Révisions maximum / jour** limite toute la file prête, nouvelles cartes comprises. Les deux limites s’appliquent ensemble. Avec 50 nouvelles cartes et 500 révisions maximum, 110 cartes peuvent être dues mais seulement 108 prêtes si deux nouvelles cartes dépassent leur limite. Accueil et Révision affichent le nombre réellement disponible ; augmenter le maximum total ne contourne pas la limite des nouvelles cartes.
- **Niveau d’exigence** règle la notation automatique : Débutant tolère davantage de distance, Équilibré combine pays et précision, et Pro exige un résultat plus fort. Pays, distance, score et temps sont pris en compte ; il n’y a pas de boutons manuels Encore/Difficile/Bon/Facile.
- **Ajouter les manches de jeu à la révision** est distinct de la notation : une future manche crée une carte si son score est inférieur au seuil choisi ou si le pays est faux. L’une ou l’autre condition activée suffit ; les nouveaux profils commencent au seuil Difficile/Encore actif (3 000 en Équilibré).
- **Première révision**, **étape de réapprentissage**, **premier intervalle excellent** et **intervalle maximum** règlent la première échéance, le retour après un échec, l’attente après un excellent premier résultat et le plafond des cartes maîtrisées.
- **Temps de réponse maximum** influence la fluidité de la notation sans créer forcément un compte à rebours. **Ordre** choisit les plus anciennes d’abord ou une file aléatoire.
- **Heure de réinitialisation** et **fuseau horaire** définissent le début d’une nouvelle journée et le renouvellement des limites. La détection automatique suit l’appareil ; désactivez-la pour choisir le fuseau. L’aperçu montre la prochaine révision réelle.
- **Varier la vue de révision** conserve la même carte et le même planning, mais peut changer l’orientation ou utiliser un panorama proche pour une carte maîtrisée. Zéro garde la vue d’origine ; un échec réduit la variation et une recherche infructueuse revient à l’ancre sans créer de doublon.

Choisissez **Enregistrer** pour appliquer les changements. Exigence et intervalles modifient la planification future sans réécrire les tentatives ; limites et ordre s’appliquent au prochain calcul de la file.

La réponse reste cachée jusqu’à votre estimation. Si un ancien identifiant ouvre un panorama à plus de 10 km de la réponse enregistrée, la Révision utilise une vue valide près des coordonnées enregistrées ou n’ouvre pas la carte. Après la réponse, le résultat affiche la ville, la région, la voie, l’adresse complète et les coordonnées disponibles, comme Révéler dans Étude. Réduisez le résultat depuis son coin supérieur droit pour étudier le panorama, puis utilisez Voir le résultat pour le rouvrir. La pratique personnalisée laisse les cartes futures inchangées ; terminer une carte déjà due avance son échéance et persiste après rechargement.

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

Dans Réglages → Affichage → Cartes, la **Palette de couleurs de la carte** propose Auto, Clair ou Sombre. Le **Zoom de la carte des résultats** propose Au plus près, Pays, Région du pays ou Monde ; Pays est le choix par défaut. Auto suit l’apparence de l’application ; Clair ou Sombre garde le choix pour les plans routiers et de relief. Les images satellite conservent leurs couleurs. Les frontières des pays sont visibles par défaut et peuvent être masquées ; elles n’apparaissent que lorsqu’une frontière se trouve dans la zone affichée. L’épaisseur et la couleur des frontières sont réglables avec un aperçu en direct ; les frontières régionales sont désactivées par défaut et peuvent être activées séparément.

Pays, villes et environnements orientent la génération sans garantir une couverture totale. Les préférences séparent langues de l’interface, du jeu et de l’IA, ainsi que révision, fuseau horaire, apparence et aides cartographiques. Un nouveau profil autorise 50 nouvelles cartes et 500 révisions par jour. Effets et musique d’ambiance sont facultatifs, désactivés au départ et disposent de volumes séparés.

## Progression et statistiques

Les lieux enregistrés en Étude sont des sources non notées : ils comptent comme activité d’Étude et nouvelles cartes, jamais comme essais « Sans réponse » ou scores nuls. Un rechargement reprend la visite en cours sans ajouter de ligne.

Consultez lieux, tentatives, file, performances, historique et temps actif au premier plan pendant l’Étude, le Jeu actif et la Révision active, y compris les déplacements dans les panoramas et l’utilisation des aides. Performances, Géographie, Progression et Confusions combinent les tentatives de Jeu et de Révision ; la case IA concerne seulement le Jeu. Le temps masqué ou fermé n’augmente pas les nouvelles durées de réponse. Le temps est enregistré lors d’un changement de section ou du retour à l’accueil ; les sessions sans visite ni tentative sont masquées. Sur écran tactile, maintenez une barre **Échéances à venir** pour afficher sa date et son nombre. Indices connus totalise les entrées personnelles, IA et Méta sans compter deux fois l’image d’une note. Les parties assistées par IA sont incluses par défaut et peuvent être exclues. Le résumé sépare moyenne précédente et du jour. Deux lieux du même pays à moins de 50 mètres partagent une carte.

## Synchronisation cloud

Le compte est facultatif et l’entraînement local fonctionne sans connexion. La progression est d’abord enregistrée dans ce navigateur et la synchronisation est manuelle. Appuyez sur **Synchroniser maintenant** sur l’appareil contenant le nouveau travail pour télécharger, fusionner et envoyer les cartes, tentatives et l’historique de Révision, puis faites-le sur les autres appareils. La planification notée le plus récemment l’emporte et les enregistrements uniques de chaque appareil sont conservés. Se connecter, enregistrer, revenir dans l’application ou la quitter ne transfère rien automatiquement. Sans connexion, localhost et le site publié restent séparés.

Les images privées manquantes sont mises en cache dans ce navigateur pendant la synchronisation manuelle. Ouvrir Indices, Notes disponibles, Couverture ou l’historique utilise cette copie locale sans interroger le stockage cloud.

**Synchroniser et sauvegarder** propose aussi **Exporter** et **Importer** sans accès au cloud. L’exportation télécharge un fichier `.geotrainer` contenant toute la base locale et les photos enregistrées sur cet appareil. L’importation valide le fichier et fusionne uniquement les informations manquantes ou plus récentes sans effacer la progression locale. Le fichier conserve l’identifiant du compte exportateur ; un compte différent ou l’absence de connexion demande confirmation. Gardez le fichier privé et transférez-le par Drive, OneDrive, USB ou un autre emplacement fiable.

## Dépannage

1. Panorama vide — passez au suivant ; la couverture Street View peut changer.
2. Commandes sur un écran noir — testez Street View dans Google Maps avec le même navigateur. Si l’image y est également noire, ouvrez GeoTrainer dans une fenêtre privée sans extensions, changez le réglage d’accélération graphique du navigateur, puis relancez-le. Mettez à jour le navigateur et le pilote graphique si nécessaire. Si seul GeoTrainer échoue, rechargez-le une fois et indiquez le navigateur, l’appareil et les extensions actives dans votre signalement.
3. Révision vide — jouez ou enregistrez un lieu d’Étude, puis attendez son échéance.
4. IA indisponible — continuez normalement et réessayez plus tard.
5. Progression ancienne — vérifiez le compte et appuyez sur **Synchroniser maintenant** sur chaque appareil, en commençant par celui qui contient le nouveau travail.

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

Les images collées, importées ou capturées dans le Carnet peuvent être recadrées avant l’analyse ou l’enregistrement. Utilisez la commande en bas à droite de l’aperçu, déplacez la zone ou ses poignées, puis appliquez le recadrage.

Après l’enregistrement d’une note ou de l’analyse d’un indice collé, une notification confirme sa présence dans le Carnet.

La **caméra à 360°** de l’espace de travail copie quatre directions du panorama actuel dans une seule image. Une notification indique la progression et confirme si la copie a réussi. L’image est placée directement dans le presse-papiers et n’est pas enregistrée dans GeoTrainer.

Apprendre propose quatre parcours. **Personnalisé** conserve collections et environnements. **Méta** ouvre des leçons guidées au panorama et à l’orientation enregistrés. **Explorer la carte** affiche la couverture Street View. Les filtres en bas à gauche choisissent des images officielles, mixtes ou de contributeurs et une couverture extérieure uniquement ou mixte. Dans Méta et la carte, Révéler ouvre la fiche normale, où Enregistrer pour révision programme le futur exercice de localisation. Dans Explorer la carte, cliquez sur la couverture bleue de la carte intégrée à cette fiche pour rejoindre un autre panorama ; la carte de la fiche conserve son zoom et sa position. Si Officiels uniquement ne trouve rien, le message indique de choisir **Officielles + contributeurs** ci-dessous ; il ne modifie jamais ce filtre à votre place. Un bouton globe en haut à gauche du panorama revient à la carte du monde sans occuper l’en-tête. Apprendre personnalisé et Jeu utilisent les images officielles Google par défaut ; le sélecteur permet de mélanger panoramas officiels et contributeurs ou de demander uniquement les panoramas de contributeurs. **Autoriser les intérieurs** est désactivé par défaut dans les deux configurations ; une fois activé, Google peut proposer une couverture Street View intérieure ou extérieure. Dans **Paramètres → Affichage**, vous pouvez régler les noms de rues, la date des images, le mouvement du téléphone, le déplacement, le type de carte, les gestes, les lieux cliquables et les couleurs GeoTrainer. Les noms de rues et les lieux cliquables sont désactivés par défaut pour limiter les indices accidentels.

L’ampoule en haut à droite affiche ou masque l’explication. Le conseil initial peut être fermé une fois ou définitivement sans retirer les leçons. Une Méta rejoint **Mes indices** uniquement après l’enregistrement explicite de son lieu pour révision. En révision, seule l’image apparaît avant la réponse ; le texte complet vient ensuite et les outils d’apprentissage restent disponibles jusqu’au choix de la révision suivante.

Le **Carnet** conserve autant de notes personnelles que souhaité par panorama. Catégorie et texte sont facultatifs ; une entrée vide peut aussi enregistrer le lieu à réviser. Il accepte également les images analysées par Coach. Vous pouvez écrire et enregistrer une nouvelle note pendant la révision ; son analyse d’image ne révèle pas la réponse avant la tentative. Les entrées personnelles, IA et Méta ouvrent une vue détaillée avec Street View et une image superposée lorsqu’elle existe. Dans le détail d’un indice visuel enregistré, vous pouvez ajouter ou modifier sa note, l’enregistrer et ouvrir l’image en plein écran. Les images identiques ne sont fusionnées que si la note ou la description est également identique ou vide ; un texte utile différent conserve des entrées séparées. **Notes disponibles** affiche un compteur et tout l’historique défilant ; les nouvelles analyses Coach y entrent immédiatement et ne se rouvrent pas comme résultat actif après rechargement. Mes indices filtre **Personnel**, **Assisté par IA** et **Leçons Méta** et pagine les résultats correspondants par groupes de 20 ; le texte révélateur reste masqué avant la réponse.

Chaque entrée de Notes disponibles possède une corbeille discrète. Les entrées partageant le même texte normalisé ou exactement la même image sont regroupées automatiquement, en conservant la version la plus complète avec image et description.

Chaque enregistrement du Carnet reste une entrée indépendante, même dans le même panorama. Si une photo envoyée ne peut pas être chargée, la note reste visible et est signalée pour récupération.

Un résultat faible revient automatiquement à la fin de la session de révision jusqu’à sa réussite. Chaque essai reste un enregistrement distinct.

L’étude Méta contient 359 leçons hébergées localement, normalisées depuis la capture OpenGuessr appariée et des exemples GeoMetas supplémentaires disposant de coordonnées Street View utilisables. Les explications Méta suivent la langue de l’interface dans les huit langues prises en charge. Utiliser Coach IA ou enregistrer une entrée du Carnet crée ou réutilise automatiquement la carte de révision ; sinon, la fiche du lieu révélé conserve Enregistrer pour révision. **Notes disponibles** contient l’historique personnel et assisté par IA du panorama et des nœuds Street View du même pays situés à moins de 50 mètres, avec l’analyse complète, l’heure exacte et la capture soumise lorsqu’elle existe ; Méta reste sous son ampoule. Coach attend la préférence linguistique enregistrée et demande toutes les valeurs en langage naturel dans la langue IA choisie. Le texte personnel et IA finalisé conserve sa langue de création. Réviser une carte déjà due avance son calendrier même depuis la pratique personnalisée et persiste après rechargement.

Méta sélectionne uniquement les leçons non terminées. Dans la configuration, **Général** continue avec une leçon non terminée au hasard, tandis que **Parcourir** recherche dans le catalogue traduit et lance la leçon choisie. Une fois les 359 achevées, son option d’apprentissage est grisée et ne peut plus être sélectionnée.

Une session Étude ou Jeu inachevée est conservée. À votre retour, choisissez **Reprendre**, **Recommencer** ou **Retour**. La couverture propose une carte thermique continue de **Maîtrise** : de nombreuses révisions réussies et de longs intervalles éclaircissent progressivement les pays et lieux, tandis que les échecs réduisent l’intensité. Un panorama ouvert depuis Couverture propose Coach IA, Carnet, Méta liée et Notes disponibles ; un enregistrement crée ou réutilise sa carte de révision. Les indices Méta dépendant de l’imagerie affichent un avertissement, car les mises à jour Street View peuvent les rendre obsolètes.

Dans Couverture, faites glisser la carte thermique par pays et utilisez la molette, le curseur ou les boutons pour zoomer. Cliquez sur un pays pour ouvrir sa carte régionale avec la même couche. Les régions sont déterminées à partir des lieux enregistrés ou de Google Maps à l’ouverture. Certains pays ne disposent pas de carte régionale ; les lieux dont la région reste inconnue ne sont pas colorés.

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

La carte du résultat affiche en bleu toutes les estimations précédentes avec coordonnées, en rouge celle du jour et en vert la réponse. La note et la prochaine file sont enregistrées avant l’affichage du résultat ; recharger après une réussite passe donc à la carte suivante.

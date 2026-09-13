/**
 * Suggestions de thèmes alignés sur les programmes officiels de l'Éducation nationale
 * (cycle 3 pour le CM2, cycle 4 pour la 5ème), avec un contexte injecté dans le prompt
 * de génération pour orienter le LLM. Couverture volontairement limitée à CM2 et 5ème
 * pour Mathématiques, Français, Histoire-Géographie et Anglais (LV1) : c'est un MVP,
 * à étendre à d'autres niveaux/matières au besoin.
 *
 * Contenu vérifié sur les textes intégraux des programmes officiels (education.gouv.fr,
 * Éduscol, BO — pas des résumés tiers). Français et Histoire-Géo CM2 reflètent les
 * réformes 2026 en vigueur (Français : BO n°16 du 17/04/2025 pour le cycle 3, BO n°10
 * du 05/03/2026 pour le cycle 4 ; Histoire-Géo cycle 3 : BO du 28/05/2026 — le cycle 4
 * reste sur le programme 2020, non réformé pour la 5ème à ce jour).
 */

export interface CurriculumTopic {
  label: string;
  context: string;
}

type CurriculumBySubject = Record<string, CurriculumTopic[]>;

export const CURRICULUM: Record<string, CurriculumBySubject> = {
  'CM2': {
    'Mathématiques': [
      { label: 'Nombres entiers et numération', context: "Numération décimale de position jusqu'à 999 999 999 (millions, dizaines et centaines de millions) ; comparaison, encadrement, ordre ; multiples et diviseurs (tous les diviseurs d'un nombre ≤30, diviseurs communs ≤30, multiples communs <15) ; critères de divisibilité par 2, 5 et 10." },
      { label: 'Fractions', context: "Fractions de dénominateur ≤60 (dénominateur 100 ou 1000 pour les fractions décimales) : lecture, écriture, repérage sur demi-droite graduée, comparaison, addition et soustraction, produit d'un entier par une fraction, fraction comme opérateur multiplicatif d'une quantité (ex. deux tiers de 12 €)." },
      { label: 'Nombres décimaux', context: 'Écriture à virgule reliée aux fractions décimales, étude étendue aux millièmes ; comparaison, encadrement, intercalation, ordre croissant/décroissant ; arrondi et partie entière.' },
      { label: 'Calcul mental et automatismes', context: 'Mémorisation de faits numériques (tables, moitiés, fractions usuelles) ; multiplication/division par 10, 100, 1000 d\'un décimal ; procédures réfléchies (distributivité dans des cas simples, doubles/moitiés de décimaux).' },
      { label: 'Calcul posé - quatre opérations', context: 'Addition et soustraction de décimaux posées, multiplication d\'un décimal par un entier posée, division décimale posée (dividende entier ou décimal, diviseur à un chiffre) ; calculs avec une ou deux paires de parenthèses ; estimation du résultat.' },
      { label: 'Résolution de problèmes arithmétiques', context: 'Problèmes additifs et multiplicatifs (parties-tout, comparaison multiplicative) en une ou plusieurs étapes, problèmes mixtes, de dénombrement, d\'optimisation ; démarche en 4 phases (comprendre, modéliser, calculer, répondre).' },
      { label: 'Initiation à la pensée algébrique', context: 'Nombre manquant dans une égalité à trous, désignation d\'un nombre inconnu par un symbole ou une lettre, résolution de problèmes algébriques, exécution/production de programmes de calcul, poursuite de suites de nombres ou de motifs évolutifs.' },
      { label: 'Longueurs, masses et contenances', context: 'Unités et conversions (du milligramme au kilogramme et à la tonne, du millilitre à l\'hectolitre, du millimètre au kilomètre), comparaison et estimation de grandeurs, calcul du périmètre d\'un polygone.' },
      { label: 'Aires', context: 'Comparaison et détermination d\'aires, unités cm², dm², m² et conversions entre elles, calcul de l\'aire d\'un carré ou d\'un rectangle.' },
      { label: 'Angles', context: 'Comparaison d\'angles, construction d\'un angle somme ou multiple d\'un angle donné, bissection par pliage, angle droit = 90°, introduction de l\'unité degré.' },
      { label: 'Repérage dans le temps et durées', context: 'Lecture de l\'heure, système sexagésimal étendu aux secondes, calculs et comparaisons de durées, problèmes à une ou plusieurs étapes impliquant des horaires.' },
      { label: 'Géométrie plane', context: 'Figures usuelles (triangle, quadrilatère, carré, rectangle, losange, trapèze, pentagone, hexagone), perpendicularité, parallélisme, construction aux instruments, élaboration d\'un programme de construction, symétrie axiale par rapport à une droite verticale, horizontale ou diagonale du quadrillage.' },
      { label: 'Solides et repérage dans l\'espace', context: 'Description et construction de cube, pavé, pyramide, prisme droit, cylindre, cône, boule ; patrons (cube, pavé) ; vocabulaire des déplacements et suites d\'instructions décrivant un déplacement ; problèmes sur assemblages de cubes.' },
      { label: 'Proportionnalité', context: 'Identification et résolution de problèmes de proportionnalité dans le cadre des grandeurs, par raisonnement de linéarité (multiplicative ou additive) formulé en langage naturel — sans tableau de proportionnalité ni produit en croix.' },
      { label: 'Organisation et gestion de données', context: 'Recueil de données qualitatives ou quantitatives, production et lecture de tableaux, diagrammes en barres, diagrammes circulaires et courbes, résolution de problèmes en une ou deux étapes à partir de ces représentations.' },
      { label: 'Probabilités', context: 'Expériences aléatoires, recensement des issues possibles, équiprobabilité, quantification d\'une probabilité sous la forme « a chances sur b », notion d\'indépendance lors de répétitions, tableau à double entrée ou arbre.' },
      { label: 'Initiation à la pensée informatique', context: 'Codage et production de suites d\'instructions décrivant un déplacement (avec ou sans robot), programmes de calcul à plusieurs étapes, programmes de construction géométrique, logiciel de programmation par blocs (type Scratch) ou tableur pour étudier des suites évolutives.' },
    ],
    'Français': [
      { label: 'Nature et classes de mots', context: "Identifier et manipuler les classes de mots (nom, déterminant, adjectif, verbe, pronom, préposition, conjonction de coordination et de subordination, adverbe) dans des phrases de plus en plus complexes." },
      { label: 'Types et formes de phrases', context: "Distinguer les trois types de phrases (déclarative, interrogative, impérative/injonctive) et leurs formes (négative, exclamative), et transformer une phrase d'un type ou d'une forme à l'autre." },
      { label: 'Fonctions dans la phrase', context: "Identifier le sujet (y compris inversé), le complément d'objet direct et indirect, l'attribut du sujet, les compléments circonstanciels de temps, lieu et cause, à l'aide de manipulations syntaxiques (déplacement, suppression, remplacement)." },
      { label: 'Groupe nominal et expansions', context: "Analyser le groupe nominal (déterminant, nom noyau, adjectif épithète) et ses expansions (complément du nom, groupe nominal prépositionnel)." },
      { label: 'Phrase simple et phrase complexe', context: "Distinguer phrase simple et phrase complexe en repérant les verbes conjugués et les propositions, et reconnaître la juxtaposition, la coordination et la subordination." },
      { label: 'Conjugaison : temps usuels de l\'indicatif', context: "Conjuguer et employer le présent, l'imparfait, le futur simple et le passé composé de l'indicatif (être, avoir, verbes des 1er et 2e groupes et principaux verbes irréguliers du 3e groupe), en identifiant radical et terminaison." },
      { label: 'Conjugaison : passé simple et temps du récit', context: "Conjuguer le passé simple et le plus-que-parfait pour raconter, et commencer à distinguer les temps du discours et les temps du récit dans un texte narratif." },
      { label: 'Accords dans le groupe nominal', context: "Appliquer les chaînes d'accord en genre et en nombre entre le déterminant, le nom et l'adjectif, y compris pour des formes irrégulières." },
      { label: 'Accord sujet-verbe et participe passé', context: "Accorder le verbe avec son sujet, même inversé ou séparé par un complément, et accorder le participe passé employé avec être et avec avoir (notamment avec un complément d'objet direct placé avant le verbe)." },
      { label: 'Vocabulaire : sens et relations entre les mots', context: "Utiliser synonymes, antonymes et mots polysémiques, organiser des mots en familles et en réseaux (préfixe, radical, suffixe), et choisir le registre de langue adapté à la situation." },
      { label: 'Orthographe lexicale', context: "Mémoriser l'orthographe des mots fréquents en s'appuyant sur les régularités et la formation des mots (dérivation, éléments morphologiques)." },
      { label: 'Découvrir des héroïnes et des héros', context: "Lire des récits patrimoniaux et de littérature de jeunesse (épopée, roman, fable, conte, théâtre) mettant en scène des héroïnes et des héros, pour comprendre leurs motivations, leurs fragilités et les valeurs qu'ils incarnent." },
      { label: 'Se confronter au merveilleux et à l\'étrange', context: "Explorer des mondes imaginaires et des phénomènes étranges (peur, évasion, inexplicable) à travers des textes variés, pour développer l'esprit critique et la créativité." },
      { label: 'Imaginer et vivre d\'autres vies', context: "Lire des œuvres intégrales ou des extraits qui font vivre des existences nouvelles (récits de vie, littérature de jeunesse), pour développer sensibilité, empathie et créativité." },
      { label: 'Comprendre et interroger la morale', context: "Lire des œuvres patrimoniales ou de jeunesse portant sur des valeurs de vie en commun (justice, tolérance, liberté, respect des différences), pour interroger les conséquences des actions des personnages." },
      { label: 'Savourer le goût des mots en poésie', context: "Écouter et lire des recueils et textes poétiques de siècles différents, pour développer la sensibilité à la langue, aux sonorités et aux images, et jouer avec les mots." },
      { label: 'Se découvrir, s\'affirmer face aux autres', context: "Lire des récits, romans, bandes dessinées et pièces de théâtre où des personnages se construisent au fil de leurs rencontres, pour s'ouvrir à la complexité des relations humaines." },
      { label: 'Écrire un récit structuré', context: "Planifier, rédiger, réviser et améliorer un récit d'une longueur adaptée au CM2 (plusieurs paragraphes), en veillant à la cohérence temporelle, à l'emploi des temps du récit et à la ponctuation du dialogue." },
    ],
    'Histoire-Géographie': [
      { label: "De la République à l'Empire (1792-1815)", context: "La chute de la royauté, la naissance de la Première République dans un contexte de guerre, puis l'ascension de Napoléon Bonaparte devenu empereur en 1804 ; réformes napoléoniennes (Code civil, lycées) et rétablissement de l'esclavage en 1802." },
      { label: 'La France devient une République (1848-1914)', context: "Le suffrage universel masculin et l'abolition définitive de l'esclavage en 1848, les lois Ferry sur l'école (1882-1886), la séparation des Églises et de l'État (1905), les symboles de la République et la constitution de l'empire colonial français." },
      { label: "L'âge industriel en France au XIXe siècle", context: "Les progrès techniques et scientifiques (chemin de fer, usines, médecine) transforment les modes de vie ; essor du monde ouvrier et bourgeois, conditions de travail et luttes sociales (droit de grève, syndicats)." },
      { label: 'La France dans la Première Guerre mondiale', context: "1914-1918 : le front occidental dans le nord et l'est de la France, la vie des soldats (poilus), la mobilisation totale de la population et de l'économie, le lourd bilan humain et l'armistice du 11 novembre 1918." },
      { label: 'La France pendant la Seconde Guerre mondiale', context: "1939-1945 : la défaite de juin 1940, l'Occupation et le régime de Vichy, la collaboration, la Résistance (de Gaulle, Jean Moulin), la persécution des Juifs (rafle du Vel d'Hiv') et la Libération." },
      { label: 'La France depuis 1945, 80 ans de transformations', context: "Le droit de vote des femmes (1944), la Sécurité sociale, la fondation de la Ve République (1958), la société de consommation et les grandes étapes de la construction européenne (traité de Rome 1957, euro 2000)." },
      { label: "L'organisation du territoire français", context: 'Les grandes agglomérations, les axes de transport, le découpage administratif de la France (communes, départements, régions) et les caractéristiques de quelques régions.' },
      { label: "Les usages de l'eau douce en France", context: "L'eau, ressource limitée aux usages multiples (agriculture, industrie, loisirs) ; les grands fleuves et massifs français et les conflits d'usage autour de cette ressource." },
      { label: "L'Union européenne", context: "La différence entre le continent européen et la construction politique de l'Union européenne, ses pays membres et un exemple d'aménagement financé par l'UE dans un territoire." },
    ],
    'Anglais': [
      { label: 'Se présenter et sa famille', context: 'Se présenter (nom, âge, nationalité) et présenter sa famille avec be / have got, les adjectifs et pronoms possessifs, le génitif en \'s ; poser et répondre à des questions simples (What\'s your name? How old are you?).' },
      { label: 'La routine quotidienne', context: 'Décrire ses habitudes et sa journée type au present simple (verbes d\'action, -s à la 3e personne, adverbes de fréquence always/usually/never) ; introduire le present continuous pour une action en train de se dérouler (he is eating).' },
      { label: 'Corps, vêtements et apparence', context: 'Décrire le corps, les vêtements et l\'apparence physique avec have got et les adjectifs qualificatifs placés avant le nom ; lexique des couleurs, des matières et des tailles.' },
      { label: 'Animaux et préférences', context: 'Exprimer ses goûts sur les animaux avec like/love/hate + -ing et le lexique des animaux ; introduire les comparatifs simples (bigger than, as fast as).' },
      { label: 'École, sports et loisirs', context: 'Nommer matières scolaires, sports et loisirs ; exprimer une capacité avec can/can\'t (I can swim) et comprendre des consignes de classe à l\'impératif.' },
      { label: 'Repères du monde anglophone', context: 'Identifier des repères géographiques et culturels des pays anglophones (Royaume-Uni, États-Unis) : symboles, drapeaux, capitales, fêtes et traditions (Halloween, Christmas, Thanksgiving).' },
      { label: 'Se repérer dans le temps et l\'espace', context: 'Utiliser les prépositions de lieu et de temps (in, on, at, next to, behind) et les mots interrogatifs (where, when) pour se situer, donner un itinéraire ou une position simples.' },
      { label: 'Nombres, heure et dates', context: 'Compter, dire et écrire l\'heure (What time is it? It\'s...), les jours de la semaine, les mois et les dates avec les nombres ordinaux (the first, the second) : lexique indispensable aux échanges quotidiens.' },
      { label: 'Poser des questions et des consignes', context: 'Former des questions avec l\'auxiliaire do/does (Do you like...? Does he play...?) et des questions en Wh- (who, what, where) ; donner et suivre des consignes simples à l\'impératif.' },
      { label: 'Capacités et interdictions (modaux)', context: 'Exprimer capacité, permission et interdiction avec les modaux can/can\'t et must/mustn\'t, dans des règles de classe, de jeu ou de sécurité.' },
      { label: 'Comparer : comparatifs et superlatifs', context: 'Comparer des objets, des personnes ou des animaux avec les comparatifs et superlatifs réguliers (bigger, the biggest) et irréguliers courants (good/better/best).' },
      { label: 'Raconter un événement passé', context: 'Relater brièvement un événement ou une activité passée avec le prétérit de be (was/were) et des verbes réguliers/irréguliers fréquents (played, went, saw), à l\'aide de repères temporels (yesterday, last week).' },
      { label: 'Environnement et écoresponsabilité', context: 'Aborder le développement durable au quotidien : tri des déchets, recyclage, transports écoresponsables, économies d\'énergie, avec le lexique simple associé (recycle, bike, save energy).' },
      { label: 'Contes, légendes et héros imaginaires', context: 'Découvrir des contes, légendes et héros de fiction du monde anglophone (structure narrative simple, personnages, lieux) pour développer l\'imaginaire et la compréhension de récits courts illustrés.' },
    ],
  },
  '5ème': {
    'Mathématiques': [
      { label: 'Priorités opératoires et calculs', context: "Enchaînement d'opérations avec ou sans parenthèses, connaissance et utilisation des priorités opératoires, distributivité simple sur des exemples numériques, traduction d'un programme de calcul en une expression unique." },
      { label: 'Multiples, diviseurs et nombres premiers', context: 'Notions de multiples et diviseurs, critères de divisibilité par 3 et par 9, initiation à la notion de nombre premier (existence d\'une infinité de nombres premiers, crible d\'Ératosthène en prolongement culturel).' },
      { label: 'Nombres relatifs', context: "Définition d'un nombre relatif, de l'opposé et de la valeur absolue ; repérage sur une droite graduée ; comparaison et rangement ; addition et soustraction de nombres décimaux relatifs, y compris avec parenthèses ; usage pour représenter des grandeurs (température, altitude)." },
      { label: 'Fractions et nombres rationnels', context: 'Comparaison de fractions de dénominateurs quelconques, addition et soustraction de fractions de dénominateurs quelconques (non nécessairement multiples l\'un de l\'autre), résolution de problèmes associés.' },
      { label: 'Puissances d\'un nombre', context: "Notion et notation de puissance d'un nombre dans le cas du carré et du cube, carrés des entiers de 0 à 12, cube de 10, calcul de la valeur numérique d'expressions contenant des puissances simples, y compris dans une expression littérale." },
      { label: 'Introduction au calcul littéral', context: "Production de formules (aire, périmètre, double, triple...), calcul de la valeur d'une expression littérale par substitution, distinction somme/produit, développement et factorisation avec un facteur k(a+b)=ka+kb, réduction d'une expression du type ax+b, résolution d'équations simples du type ax=c ou x+b=c." },
      { label: 'Repérage sur une droite et dans le plan', context: "Lecture et placement de l'abscisse d'un point sur une droite graduée, lecture et placement des coordonnées d'un point dans un plan muni d'un repère orthogonal." },
      { label: 'Représentation de l\'espace et volumes', context: 'Perspective cavalière et patrons du pavé droit, du prisme droit et du cylindre de révolution ; volume du cube, du pavé droit et du prisme droit ; aire du disque et volume du cylindre de révolution ; conversions d\'unités de volume et de capacité.' },
      { label: 'Symétrie centrale', context: 'Définition du demi-tour (symétrie centrale) et de ses propriétés de conservation, construction du symétrique d\'un point ou d\'une figure par symétrie centrale.' },
      { label: 'Angles et parallélisme', context: 'Caractérisation du parallélisme de deux droites à l\'aide des angles alternes-internes et des angles correspondants formés par une sécante.' },
      { label: 'Triangles', context: 'Somme des angles d\'un triangle et sa démonstration, construction de triangles à partir de données partielles, médiatrices et cercle circonscrit, hauteurs et médianes, calcul d\'aire d\'un triangle.' },
      { label: 'Parallélogrammes', context: 'Définition et construction du parallélogramme, propriétés caractéristiques des côtés opposés et des diagonales, cas particuliers (rectangle, losange, carré), calcul d\'aire d\'un parallélogramme et de figures complexes avec conversions d\'unités.' },
      { label: 'Proportionnalité', context: 'Identification de situations de proportionnalité dans des contextes concrets, coefficient de proportionnalité, représentation par un tableau ou un graphique, calculs de proportions et de pourcentages, reconnaissance graphique d\'une situation de proportionnalité.' },
      { label: 'Notion de fonction', context: 'Introduction de l\'expression « en fonction de », production et lecture de tableaux de valeurs, placement de points dans un repère orthogonal, lecture d\'un graphique cartésien, production d\'une formule simple traduisant une dépendance entre deux grandeurs.' },
      { label: 'Statistiques', context: 'Recueil et organisation de données, calcul d\'effectifs et de fréquences (décimale, fractionnaire, pourcentage), tableaux, diagrammes en barres, diagrammes circulaires et graphiques cartésiens, calcul et interprétation de la moyenne simple.' },
      { label: 'Probabilités', context: 'Vocabulaire des probabilités (expérience aléatoire, issue, évènement), attribution de probabilités dans des cas simples d\'équiprobabilité, répétition matérielle d\'une expérience aléatoire avec enregistrement des résultats dans un tableau d\'effectifs et de fréquences.' },
      { label: 'Algorithmique et programmation', context: 'Manipulation et séquencement d\'instructions simples, identification des entrées et sorties d\'un programme, représentation de formules sous forme d\'expression informatique dans un langage de programmation par blocs, boucle inconditionnelle simple.' },
    ],
    'Français': [
      { label: 'Grammaire : phrase et ponctuation', context: "Analyser la phrase simple et la phrase complexe (types, formes, juxtaposition, coordination, subordination), et employer la ponctuation pour assurer la cohérence d'un texte." },
      { label: 'Groupe nominal et fonctions dans la phrase', context: "Analyser le groupe nominal minimal et étendu, et identifier le sujet, les compléments d'objet direct et indirect, l'attribut du sujet et les compléments circonstanciels de lieu, cause, temps et manière." },
      { label: 'Déterminants, pronoms et mots invariables', context: "Distinguer déterminants et pronoms (personnels, démonstratifs, indéfinis), et identifier prépositions, adverbes et mots subordonnants dans une phrase." },
      { label: 'Discours rapporté et registres de langue', context: "Identifier et employer le discours direct et indirect, et distinguer grammaire de l'écrit et grammaire de l'oral selon les registres de langue et le contexte." },
      { label: 'Conjugaison : temps simples de l\'indicatif', context: "Conjuguer et employer le présent, le futur simple, l'imparfait, le passé simple, le conditionnel et l'impératif présent, en identifiant radical et terminaison." },
      { label: 'Conjugaison : temps composés', context: "Conjuguer le passé composé, le plus-que-parfait, le passé antérieur et le futur antérieur, et maîtriser leurs valeurs temporelles et aspectuelles dans un récit." },
      { label: 'Accords complexes dans le groupe nominal', context: "Maîtriser les chaînes d'accord du groupe nominal et de l'attribut du sujet, ainsi que les cas complexes de l'accord sujet-verbe (sujet séparé du verbe, sujet composé de plusieurs noms)." },
      { label: 'Accord du participe passé', context: "Justifier l'accord du participe passé employé avec être et avec avoir (notamment avec un complément d'objet direct antéposé, y compris un pronom personnel)." },
      { label: 'Vocabulaire : sens et relations entre les mots', context: "Analyser en contexte le sens des mots (synonymie, antonymie, polysémie), distinguer les registres de langue et jouer avec les mots (néologisme, matériau sonore)." },
      { label: 'Formation des mots et étymologie', context: "Analyser la formation des mots (préfixe, radical, suffixe, dérivation) et leur dimension historique (étymologie latine, grecque ou empruntée à des langues étrangères)." },
      { label: 'Orthographe lexicale', context: "Mémoriser l'orthographe du vocabulaire rencontré en s'appuyant sur l'étymologie et les régularités orthographiques (même radical, homophones)." },
      { label: 'Devenir héros : destins romanesques', context: "Étudier des figures héroïques de l'Antiquité à nos jours (récits mythologiques, bibliques, superhéros modernes) pour interroger leurs représentations, leurs stéréotypes et la transmission des valeurs héroïques." },
      { label: 'Voyager en poésie', context: "Lire et dire des poèmes explorant des horizons réels ou imaginaires, de traditions et cultures variées y compris francophones, en étudiant la force des mots, des sonorités, des rythmes et des images." },
      { label: 'Théâtre : une société sens dessus dessous', context: "Lire et mettre en voix une pièce ou un groupement de textes théâtraux mettant en scène des relations entre dominants et dominés, en étudiant les ressorts du comique et de la représentation." },
      { label: 'Contes et fables : plaire et instruire', context: "Lire des contes et des fables alliant narration et réflexion morale, pour interroger la conduite des personnages et le fonctionnement social qu'ils dévoilent." },
      { label: 'Écriture d\'invention et de réflexion', context: "Planifier, rédiger et réviser des textes narratifs, descriptifs et à visée argumentative simple (un argument et un exemple), en mobilisant le vocabulaire et les connaissances grammaticales étudiés." },
    ],
    'Histoire-Géographie': [
      { label: "Byzance et l'Europe carolingienne", context: "Du VIe au IXe siècle, l'Empire byzantin (basileus, orthodoxie) et l'Empire carolingien de Charlemagne, deux héritiers de l'Empire romain qui affirment un pouvoir impérial et religieux en Europe." },
      { label: 'Naissance et expansion du monde musulman', context: "De la naissance de l'islam au VIIe siècle à la prise de Bagdad par les Mongols en 1258 : le calife, les conquêtes, l'organisation des sociétés et le rayonnement culturel du monde musulman." },
      { label: "L'ordre seigneurial et la société féodale", context: "XIe-XVe siècles : la formation de la seigneurie, la domination des campagnes par les seigneurs laïques et ecclésiastiques, et la vie des paysans dans la société féodale." },
      { label: 'L\'émergence de la société urbaine médiévale', context: "À partir du XIIe siècle, l'essor des villes fait apparaître de nouveaux modes de vie (bourgeoisie marchande, artisanat, communes urbaines) et stimule l'économie marchande." },
      { label: "L'affirmation de l'État monarchique en France", context: "Le gouvernement royal capétien puis valois pose les bases d'un État moderne en s'imposant face aux pouvoirs féodaux, en étendant son domaine et en développant une administration royale." },
      { label: 'Charles Quint et Soliman le Magnifique', context: "XVIe siècle : les empires rivaux de Charles Quint (Habsbourg) et Soliman le Magnifique (Ottomans) et les recompositions de l'espace méditerranéen dans le contexte des grandes découvertes." },
      { label: 'Humanisme, Réforme protestante et conflits religieux', context: "XVIe siècle : les bouleversements intellectuels, artistiques et religieux de la Renaissance humaniste, la Réforme protestante (Luther, Calvin) et les guerres de religion en Europe et en France." },
      { label: 'Du prince de la Renaissance au roi absolu', context: "L'évolution de la figure royale en France du XVIe au XVIIe siècle, de François Ier mécène de la Renaissance à Henri IV pacificateur, jusqu'à Louis XIV et la monarchie absolue de droit divin." },
      { label: 'Croissance démographique et effets', context: "L'évolution de la population mondiale et ses effets sur l'accès aux biens et services de base, à travers l'exemple d'une puissance émergente (Chine ou Inde) et d'un pays africain." },
      { label: 'Répartition de la richesse et de la pauvreté', context: "L'inégale répartition des richesses à l'échelle mondiale, et les inégalités sociales observables dans tous les pays, riches comme pauvres." },
      { label: 'Énergie et eau, des ressources à ménager', context: "L'énergie et l'eau sont des ressources essentielles mais limitées : enjeux de leur exploitation, de leur gestion durable et de l'accès pour tous." },
      { label: 'Nourrir une humanité en croissance', context: "Comment l'agriculture mondiale peut répondre aux besoins alimentaires d'une population croissante sans compromettre les ressources, alors qu'une partie de l'humanité reste sous-alimentée." },
      { label: 'Le changement climatique et ses effets', context: "Les causes et les principaux effets géographiques régionaux du changement climatique, et les politiques mises en œuvre pour les limiter ou s'y adapter." },
      { label: 'Prévenir et s\'adapter aux risques', context: "Les risques industriels, technologiques, sanitaires et climatiques auxquels les sociétés sont exposées, et les stratégies de prévention, de gestion et d'atténuation." },
    ],
    'Anglais': [
      { label: 'Portrait et autoportrait', context: 'Décrire une personne (physique, caractère, personnalité) avec be/have got, l\'ordre des adjectifs qualificatifs, et les pronoms personnels compléments et réfléchis (him, herself).' },
      { label: 'Vie quotidienne, rythmes et saisons', context: 'Décrire habitudes, météo et saisons en combinant present simple (habitudes) et present continuous (action en cours), avec les quantifieurs some/any/much/many/a lot of.' },
      { label: 'Récits au passé', context: 'Raconter des événements passés au prétérit (verbes réguliers en -ed et irréguliers fréquents), avec les marqueurs temporels (yesterday, last year, ago, when) et le past continuous pour le contexte (was/were + -ing).' },
      { label: 'École et loisirs dans le monde anglophone', context: 'Comparer systèmes scolaires et loisirs des pays anglophones (subjects, clubs, exams) ; lexique de la vie extrascolaire et découverte de quelques métiers.' },
      { label: 'Le Royaume-Uni : patrimoine et institutions', context: 'Découvrir géographie, histoire et institutions du Royaume-Uni (monarchie, Parlement) avec quelques repères chronologiques et figures historiques.' },
      { label: 'Comparaisons, goûts et opinions', context: 'Exprimer et justifier une préférence ou une opinion (I think.../In my opinion...) à l\'aide des comparatifs et superlatifs réguliers et irréguliers.' },
      { label: 'Projets, souhaits et hypothèses', context: 'Exprimer projets et intentions avec going to et will, formuler des souhaits (I\'d like to / I wish) et des hypothèses simples au conditionnel de type 1 (if + present, will).' },
      { label: 'Modaux : capacités, conseils, obligations', context: 'Nuancer capacité, obligation, interdiction et conseil avec les modaux can/could, must/mustn\'t, have to, should, dans des situations de vie quotidienne ou scolaire.' },
      { label: 'Poser des questions, directes et indirectes', context: 'Former des questions avec do/does/did et les mots interrogatifs ; introduire l\'interrogation indirecte (Can you tell me where...?) et le discours rapporté simple (He said that...).' },
      { label: 'Voyages et rencontres interculturelles', context: 'Vocabulaire du voyage, des migrations et de la découverte d\'autres cultures (transport, hébergement, coutumes) pour comparer les points de vue et dépasser les stéréotypes.' },
      { label: 'Environnement et développement durable', context: 'Traiter les enjeux environnementaux (pollution, recyclage, énergies renouvelables, changement climatique) avec le lexique dédié et des structures pour lister avantages/inconvénients et donner son avis.' },
    ],
  },
};

export function getTopics(level: string, subject: string): CurriculumTopic[] {
  return CURRICULUM[level]?.[subject] ?? [];
}

export function getTopicContext(level: string, subject: string, topicLabel: string): string | null {
  const topic = getTopics(level, subject).find(t => t.label === topicLabel);
  return topic?.context ?? null;
}

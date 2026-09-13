/**
 * Suggestions de thèmes alignés sur les programmes officiels de l'Éducation nationale
 * (cycle 3 pour le CM2, cycle 4 pour la 5ème), avec un contexte injecté dans le prompt
 * de génération pour orienter le LLM. Couverture volontairement limitée à CM2 et 5ème
 * pour Mathématiques, Français, Histoire-Géographie et Anglais (LV1) : c'est un MVP,
 * à étendre à d'autres niveaux/matières au besoin.
 *
 * Contenu vérifié sur les programmes officiels (Éduscol / education.gouv.fr, BO) — le
 * programme de Français reflète la réforme 2026 (BO n°16 du 17/04/2025 pour le cycle 3,
 * BO du 05/03/2026 pour le cycle 4).
 */

export interface CurriculumTopic {
  label: string;
  context: string;
}

type CurriculumBySubject = Record<string, CurriculumTopic[]>;

export const CURRICULUM: Record<string, CurriculumBySubject> = {
  'CM2': {
    'Mathématiques': [
      { label: 'Nombres entiers et multiples', context: "Numération décimale jusqu'à 999 999 999 (neuf chiffres) : comparaison, encadrement et repérage sur une demi-droite graduée, ainsi que recherche des diviseurs (jusqu'à 100) et des diviseurs ou multiples communs à deux nombres entiers inférieurs à 30." },
      { label: 'Fractions et opérations simples', context: "Fractions de dénominateur inférieur ou égal à 60 (jusqu'à 1000 pour les fractions décimales) : lecture, écriture, comparaison, addition et soustraction de fractions, et calcul d'une fraction d'une quantité ou d'une grandeur (par exemple deux tiers de 12 €)." },
      { label: 'Nombres décimaux jusqu\'aux millièmes', context: 'Nombres décimaux étendus aux millièmes, écrits sous forme de fraction décimale ou à virgule : comparaison, encadrement, intercalation, placement sur une demi-droite graduée et passage d\'une écriture à l\'autre.' },
      { label: 'Calcul posé et calcul mental', context: 'Techniques opératoires posées : multiplication d\'un nombre décimal par un entier, division décimale (dividende entier ou décimal, diviseur à un chiffre), et procédures de calcul mental sur les décimaux (multiplier/diviser par 10, 100 ou 1000, distributivité).' },
      { label: 'Résolution de problèmes arithmétiques', context: 'Problèmes en une ou plusieurs étapes (additifs, multiplicatifs de type parties-tout, comparaison multiplicative, dénombrement, optimisation) portant sur des entiers jusqu\'à 999 999 999, des décimaux et des fractions, suivant la démarche comprendre-modéliser-calculer-répondre.' },
      { label: 'Grandeurs, mesures et conversions', context: 'Longueurs, masses, contenances, aires (cm², dm², m² avec conversions, aire du carré et du rectangle), angles (mesure en degrés, comparaison, construction) et durées en heure/minute/seconde (système sexagésimal).' },
      { label: 'Géométrie plane et solides', context: 'Figures planes usuelles (triangles, quadrilatères dont trapèze, losange, pentagone, hexagone), symétrie axiale par rapport à une droite horizontale, verticale ou une diagonale du quadrillage, et solides (cube, pavé, pyramide, prisme droit, patrons).' },
      { label: 'Proportionnalité, données et probabilités', context: 'Résolution de problèmes de proportionnalité par raisonnement de linéarité (sans tableau de proportionnalité ni produit en croix), lecture de données dans des tableaux ou diagrammes, et calcul de probabilités simples en situation d\'équiprobabilité.' },
    ],
    'Français': [
      { label: 'Classes de mots et nature', context: 'Distinguer et manipuler les classes de mots (nom, déterminant, adjectif, verbe, pronom, préposition, conjonction de subordination) dans des phrases de plus en plus complexes.' },
      { label: 'Fonctions dans la phrase', context: "Identifier le sujet (y compris inversé), le complément d'objet direct et indirect, l'attribut du sujet, les compléments circonstanciels de temps, lieu et cause, ainsi que le complément du nom." },
      { label: 'Conjugaison : temps du récit', context: "Conjuguer et employer à bon escient le présent, l'imparfait, le futur simple, le passé composé, le passé simple et le plus-que-parfait de l'indicatif, ainsi que l'impératif, dans des textes narratifs." },
      { label: 'Accords et participe passé', context: "Appliquer les règles d'accord dans le groupe nominal et entre le sujet et le verbe y compris en cas d'inversion, et accorder le participe passé employé avec être et avec avoir." },
      { label: 'Vocabulaire et sens des mots', context: 'Utiliser synonymes, antonymes, familles de mots et relations de sens (sens propre/figuré, polysémie) pour enrichir un texte, et repérer les registres de langue selon la situation de communication.' },
      { label: 'Récits de héros et du merveilleux', context: 'Lire et comprendre des récits mettant en scène des héroïnes et des héros confrontés au merveilleux ou à l\'étrange (contes, romans d\'aventures), en identifiant les caractéristiques du genre et le parcours du personnage.' },
      { label: 'Poésie et fables : la morale', context: "Lire, dire et interpréter des poèmes et des fables portant une visée morale, en repérant les jeux sur les sonorités, les images et la construction d'un enseignement ou d'une leçon de vie." },
      { label: 'Écrire un récit structuré', context: "Planifier, rédiger, réviser et améliorer un récit d'une longueur adaptée au CM2 (plusieurs paragraphes), en veillant à la cohérence temporelle, à l'emploi des temps du récit et à la ponctuation du dialogue." },
    ],
    'Histoire-Géographie': [
      { label: "L'âge industriel en France", context: "XIXe et début du XXe siècle : essor des usines, des mines et des chemins de fer, transformation du monde du travail (ouvriers, machinisme) et exode rural qui bouleversent la société française." },
      { label: "1848 : suffrage universel et abolition de l'esclavage", context: "Sous la IIe République proclamée en 1848, la France instaure le suffrage universel masculin et abolit l'esclavage dans les colonies (décret du 27 avril 1848, sous l'impulsion de Victor Schœlcher)." },
      { label: "Les lois de Jules Ferry et l'école de la République", context: "Dans les années 1880, sous la IIIe République, les lois de Jules Ferry (1881-1882) rendent l'école primaire gratuite, laïque et obligatoire ; ce thème aborde aussi les symboles de la République (Marianne, devise, drapeau, Marseillaise)." },
      { label: 'La France dans les deux guerres mondiales', context: 'La Première Guerre mondiale (1914-1918, la vie des soldats et des civils) puis la Seconde Guerre mondiale (1939-1945, défaite, occupation, collaboration, résistance) bouleversent profondément la société et le territoire français.' },
      { label: 'De la Libération à la construction européenne', context: "Après 1945, la France se reconstruit et connaît de profondes transformations économiques et sociales, puis s'engage dans la construction européenne, marquée par le traité de Rome de 1957." },
      { label: 'Se déplacer en France et dans le monde', context: "Réseaux et moyens de transport utilisés au quotidien en France (voiture, train, transports en commun), comparaison des mobilités selon les territoires, impact sur l'environnement et le développement durable." },
      { label: 'Communiquer grâce à Internet', context: 'Fonctionnement du réseau Internet à l\'échelle mondiale (câbles, satellites, data centers), inégalités d\'accès entre territoires connectés et mal connectés, et citoyenneté numérique.' },
      { label: 'Mieux habiter son territoire', context: 'Territoires de proximité (quartier, ville, campagne) questionnés sous l\'angle du cadre de vie et de la durabilité : écoquartiers, espaces verts, mobilités douces, gestion des déchets, vivre-ensemble.' },
    ],
    'Anglais': [
      { label: 'Se présenter et sa famille', context: 'L\'élève se présente et présente sa famille (nom, âge, nationalité, lieu de vie, fratrie) à l\'aide de be et have got au présent simple, des adjectifs possessifs (my/his/her) et du lexique de la famille.' },
      { label: 'La routine quotidienne', context: 'Décrire les habitudes de la journée (se lever, aller à l\'école, manger, se coucher) avec le présent simple à la 3e personne du singulier, des prépositions temporelles (at, on, in) et des marqueurs comme every day, in the morning.' },
      { label: 'Corps, vêtements et apparence', context: 'Décrire l\'apparence physique d\'une personne ou d\'un personnage et ses vêtements en utilisant have got, quelques adjectifs qualificatifs, et le lexique du corps humain et des vêtements de base.' },
      { label: 'Animaux et préférences', context: 'Nommer des animaux familiers ou sauvages et exprimer ses goûts avec I like/I don\'t like/I love/I hate suivi d\'un nom ou d\'un verbe en -ing, en mobilisant le lexique des animaux domestiques et de la nourriture de base.' },
      { label: 'École, sports et loisirs', context: 'Parler des matières scolaires, des activités sportives et de loisirs pratiquées avec le modal can/can\'t (capacité), le présent simple, et des expressions de fréquence (at the weekend, once a week).' },
      { label: 'Repères du monde anglophone', context: 'Situer quelques repères culturels du monde anglophone (nationalités comme British, American, Australian, fêtes calendaires comme Christmas, Halloween, Thanksgiving).' },
      { label: 'Se repérer dans le temps et l\'espace', context: 'Donner l\'heure, les jours de la semaine et des indications spatiales simples avec des prépositions de lieu (in, on, under, next to, behind) et l\'impératif pour donner des directions ou des consignes.' },
    ],
  },
  '5ème': {
    'Mathématiques': [
      { label: 'Nombres relatifs et repérage', context: "Introduction des nombres relatifs dès le début du cycle 4 pour rendre possible toute soustraction : addition, soustraction et notion d'opposé, avec repérage sur une droite graduée (températures, altitudes)." },
      { label: 'Fractions et nombres rationnels', context: 'La fraction acquiert le statut de nombre qui rend toutes les divisions possibles : calcul et comparaison de proportions et de fréquences, justification par le raisonnement de l\'égalité de deux quotients. Privilégier comparaison et justification plutôt que des opérations complexes (relevant de la 4e).' },
      { label: 'Initiation au calcul littéral', context: "Comprendre l'intérêt d'une lettre pour représenter un nombre, tester une égalité en substituant des valeurs numériques, et produire des formules simples liées à des grandeurs mesurables — niveau d'initiation, sans développement ni factorisation complexes." },
      { label: 'Proportionnalité et notion de fonction', context: 'Résolution de problèmes de proportionnalité (quatrième proportionnelle, pourcentages, coefficient) et première rencontre avec la notion de fonction à travers des relations de dépendance entre deux grandeurs et leurs représentations graphiques.' },
      { label: 'Parallélisme, perpendicularité et triangles', context: "Parallélisme, perpendicularité, médiatrice d'un segment, somme des angles d'un triangle et inégalité triangulaire — construction géométrique et initiation à la démonstration simple, sans Pythagore (4e) ni Thalès (3e)." },
      { label: 'Symétrie centrale et parallélogrammes', context: 'Construction du symétrique d\'une figure par rapport à un point et identification des propriétés des côtés et diagonales des parallélogrammes, rectangles, losanges et carrés.' },
      { label: 'Statistiques et probabilités simples', context: "Lecture, interprétation et production de tableaux et de représentations graphiques (diagrammes en bâtons, circulaires), et initiation aux probabilités à partir de situations simples d'équiprobabilité." },
      { label: 'Grandeurs, périmètres et aires', context: 'Calculs impliquant des grandeurs mesurables et leurs unités, périmètres et aires des figures usuelles (dont le disque), en veillant à la cohérence des unités dans les résultats.' },
    ],
    'Français': [
      { label: 'Grammaire : phrase et groupe nominal', context: 'Analyser la phrase simple et la phrase complexe (coordination, juxtaposition, subordination), la ponctuation, et le groupe nominal avec ses expansions (déterminants, adjectifs, compléments du nom, pronoms).' },
      { label: 'Fonctions syntaxiques et discours rapporté', context: 'Identifier les fonctions grammaticales (COD, COI, attribut du sujet, compléments circonstanciels) et distinguer discours direct et discours indirect dans un texte narratif ou théâtral.' },
      { label: 'Conjugaison : le passé simple et les temps du récit', context: "Maîtriser les valeurs et l'emploi du présent, de l'imparfait, du passé simple ainsi que des temps composés pour construire un récit cohérent, et accorder correctement le participe passé." },
      { label: 'Accords orthographiques complexes', context: "Consolider les accords sujet-verbe dans des constructions complexes ainsi que l'accord de l'attribut du sujet et du participe passé." },
      { label: 'Vocabulaire : sens et formation des mots', context: 'Étudier la synonymie, l\'antonymie et la polysémie, la formation des mots par dérivation (préfixes, suffixes) et famille de mots, ainsi que l\'étymologie et les registres de langue.' },
      { label: 'Devenir héros : récits et romans', context: 'Étudier la figure héroïque de l\'Antiquité à nos jours à travers des récits et des romans d\'aventures, en observant comment le personnage se construit, agit et se transforme.' },
      { label: 'Théâtre et société : comique et pouvoir', context: 'Lire et mettre en voix des scènes de théâtre mettant en jeu des rapports de force entre dominants et dominés, en identifiant les procédés du comique et les codes du texte théâtral.' },
      { label: 'Contes, fables et poésie : instruire et voyager', context: 'Lire des contes, fables et apologues à visée morale ainsi que des poèmes explorant des horizons réels ou imaginaires, en repérant la portée didactique des récits courts et les procédés de l\'écriture poétique.' },
    ],
    'Histoire-Géographie': [
      { label: "Byzance et l'Europe carolingienne", context: "Du VIe au XIIIe siècle, comparaison de l'Empire byzantin (chrétienté orientale, Constantinople, Justinien) et de l'Empire carolingien (chrétienté occidentale, Charlemagne, sacre de l'an 800)." },
      { label: 'Naissance et expansion du monde musulman', context: "Naissance de l'islam au VIIe siècle en Arabie autour de Mahomet, expansion des conquêtes arabo-musulmanes et grands empires (Omeyyades, Abbassides), et contacts (commerce, croisades, échanges) entre chrétiens et musulmans." },
      { label: 'La seigneurie et la société féodale', context: 'Du XIe au XVe siècle, la société féodale de l\'Occident chrétien organisée autour de la seigneurie et des trois ordres (ceux qui prient, combattent, travaillent), et rôle de l\'Église.' },
      { label: "L'affirmation de l'État monarchique en France", context: "Entre le Xe et le XVe siècle, affirmation progressive du pouvoir royal capétien face aux seigneurs et construction d'un État plus centralisé (symboles, administration, ressources)." },
      { label: 'Charles Quint et Soliman le Magnifique', context: "Au XVIe siècle, comparaison de l'Empire de Charles Quint (Habsbourg, chrétienté catholique) et de l'Empire ottoman de Soliman le Magnifique, deux puissances rivales autour de la Méditerranée." },
      { label: 'Humanisme, Réforme protestante et monarchie absolue', context: "Humanisme (mouvement intellectuel inspiré de l'Antiquité), Réforme protestante (Luther, Calvin) et conflits religieux en Europe, puis affirmation de la monarchie absolue de droit divin de François Ier à Louis XIV." },
      { label: 'Croissance démographique et inégal développement', context: "Croissance de la population mondiale (transition démographique, répartition inégale) et inégalités de développement entre régions du monde, mesurées notamment par l'IDH." },
      { label: 'Répartition de la richesse et de la pauvreté', context: 'Inégalités de richesse à l\'échelle mondiale entre pays du Nord et du Sud, et au sein même des territoires (villes, campagnes), causes et conséquences de ces écarts de développement.' },
      { label: 'Énergie et eau, des ressources à ménager', context: 'Eau douce, ressource renouvelable mais inégalement répartie et parfois source de tensions, et énergie, entre énergies fossiles limitées et énergies renouvelables à développer.' },
      { label: 'Nourrir une humanité en croissance', context: 'Capacité des sociétés à nourrir une population mondiale en forte croissance, différents systèmes agricoles et enjeux de sécurité alimentaire à l\'échelle de territoires choisis et du monde.' },
      { label: 'Prévenir les risques et s\'adapter au changement climatique', context: 'Changement climatique global et ses effets géographiques régionaux (montée des eaux, événements extrêmes), risques industriels et technologiques, et politiques de prévention et d\'adaptation.' },
    ],
    'Anglais': [
      { label: 'Portrait et autoportrait', context: 'Décrire de manière détaillée une personne ou un personnage (traits physiques et de caractère) et se présenter avec assurance, en mobilisant un lexique élargi (shy, outgoing, friendly, proud, slim...) et la place de l\'adjectif épithète.' },
      { label: 'Vie quotidienne, rythmes et saisons', context: 'Décrire les modes de vie, les rythmes scolaires et les saisons dans les pays anglophones en choisissant entre présent simple et présent en be+ing, avec le lexique des saisons, du climat et des habitudes alimentaires.' },
      { label: 'Récits au passé', context: 'Raconter un évènement, une expérience personnelle ou l\'histoire d\'un personnage en utilisant le prétérit des verbes réguliers et irréguliers, des connecteurs chronologiques (first, then, finally) et logiques (because, so, however).' },
      { label: 'École et loisirs dans le monde anglophone', context: 'Comparer l\'organisation scolaire, les clubs et les loisirs des jeunes anglophones (yearbooks, school clubs) avec ceux des élèves français, en utilisant le lexique de la scolarité et des expressions de comparaison simples.' },
      { label: 'Le Royaume-Uni, patrimoine et institutions', context: 'Découvrir des repères géographiques, historiques et culturels du Royaume-Uni (famille royale, National Trust, BBC, diversité des nations et régions) en mobilisant le lexique des lieux et institutions.' },
      { label: 'Comparaisons, goûts et opinions', context: 'Exprimer une préférence, comparer deux éléments et justifier une opinion à l\'aide de comparatifs et superlatifs (more...than, the most...), et d\'expressions d\'opinion telles que I think, in my opinion.' },
      { label: 'Projets, souhaits et hypothèses', context: 'Parler de projets futurs et formuler des hypothèses simples en utilisant will et be going to pour le futur, les modaux should/could, et des marqueurs de l\'hypothèse (perhaps, maybe, I suppose).' },
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

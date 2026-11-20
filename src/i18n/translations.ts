import { Language } from '../engine/types';

export interface Translations {
  appTitle: string;
  appSubtitle: string;
  modePassAndPlay: string;
  modePassDesc: string;
  modeLan: string;
  modeLanDesc: string;
  grimoireBtn: string;
  soundOn: string;
  soundOff: string;
  playersSection: string;
  addPlayerPlaceholder: string;
  addBtn: string;
  minPlayersWarning: string;
  rolesSection: string;
  autoBalanceBtn: string;
  includeMayorLabel: string;
  mayorDesc: string;
  discussionTimerLabel: string;
  startMatchBtn: string;
  cardsMatchInfo: (cards: number, players: number, hasThief: boolean) => string;
  passDeviceTo: string;
  tapToRevealRole: string;
  holdSecretWarning: string;
  memorizeAndHideBtn: string;
  nextPlayerBtn: string;
  enterTheNightBtn: string;
  campVillage: string;
  campWerewolves: string;
  campWhiteWolf: string;
  campLovers: string;
  nightTitle: (turn: number) => string;
  dayTitle: (turn: number) => string;
  villageSleepsTitle: string;
  villageSleepsSub: string;
  awakenNextRoleBtn: string;
  wakeUpCall: (roleName: string) => string;
  confirmActionBtn: string;
  skipActionBtn: string;
  thiefPrompt: string;
  thiefForcedWolf: string;
  thiefKeepCurrent: string;
  cupidPrompt: string;
  loversWakeTitle: string;
  loversWakeSub: string;
  twoSistersWakeTitle: string;
  twoSistersWakeSub: string;
  bodyguardPrompt: string;
  bodyguardCannotRepeat: string;
  ravenPrompt: string;
  seerPrompt: string;
  seerVisionRevealed: string;
  werewolvesPrompt: string;
  packMembersLabel: string;
  littleGirlPeekBtn: string;
  littleGirlPeekResult: (clue: string) => string;
  whiteWolfPrompt: string;
  infectFatherPrompt: string;
  infectFatherVictimLabel: string;
  infectFatherUseBtn: string;
  infectFatherSkipBtn: string;
  extensionBadge: string;
  witchVictimLabel: string;
  witchNoVictim: string;
  witchUseHealBtn: string;
  witchHealUsed: string;
  witchUsePoisonLabel: string;
  witchPoisonUsed: string;
  dawnBreaksBtn: string;
  dawnTitle: (turn: number) => string;
  peacefulNightMsg: string;
  tragicNightMsg: string;
  hunterRevengeTitle: string;
  hunterRevengeSub: (hunterName: string) => string;
  mayorSuccessionTitle: string;
  mayorSuccessionSub: (mayorName: string) => string;
  mayorElectionTitle: string;
  mayorElectionSub: string;
  electMayorBtn: string;
  skipMayorBtn: string;
  dayDiscussionTitle: string;
  dayDiscussionSub: string;
  openCouncilVoteBtn: string;
  addTimeBtn: string;
  councilVoteTitle: string;
  councilVoteSub: string;
  executeSuspectBtn: string;
  noExecutionTieBtn: string;
  ravenPenaltyBadge: string;
  mayorDoubleBadge: string;
  loverBadge: string;
  idiotPardonedBadge: string;
  chroniclesTitle: string;
  aliveTab: string;
  fallenTab: string;
  victoryVillageTitle: string;
  victoryVillageSub: string;
  victoryWolvesTitle: string;
  victoryWolvesSub: string;
  victoryWhiteWolfTitle: string;
  victoryWhiteWolfSub: string;
  victoryLoversTitle: string;
  victoryLoversSub: string;
  playAgainSamePlayersBtn: string;
  backToLobbyBtn: string;
  lanHostTitle: string;
  lanJoinTitle: string;
  lanRoomCodeLabel: string;
  lanYourNameLabel: string;
  lanServerUrlLabel: string;
  lanCreateRoomBtn: string;
  lanJoinRoomBtn: string;
  lanWaitingForHost: string;
  lanConnectedPlayers: string;
  lanYourSecretCard: string;
  backBtn: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  fr: {
    appTitle: 'LES LOUPS-GAROUS',
    appSubtitle: 'DE THIERCELIEUX • ÉDITION LOCALE',
    modePassAndPlay: 'Pass & Play (1 Appareil)',
    modePassDesc: 'Faites circuler le téléphone autour de la table avec Maître du Jeu intégré.',
    modeLan: 'Salon Wi-Fi Local (Multi-Appareils)',
    modeLanDesc: 'Chaque joueur rejoint le village sur son propre smartphone en Wi-Fi / Hotspot.',
    grimoireBtn: 'Grimoire des Rôles',
    soundOn: 'Audio & Ambiance : ON',
    soundOff: 'Audio & Ambiance : OFF',
    playersSection: 'Habitants du Village',
    addPlayerPlaceholder: 'Nom du villageois...',
    addBtn: 'Ajouter',
    minPlayersWarning: 'Il faut au moins 4 joueurs pour lancer une partie.',
    rolesSection: 'Composition du Deck',
    autoBalanceBtn: 'Équilibrage Auto',
    includeMayorLabel: 'Élection du Capitaine (Maire)',
    mayorDesc: 'Le village élit un Capitaine dont la voix compte double et qui tranche les égalités.',
    discussionTimerLabel: 'Durée du Conseil du Village',
    startMatchBtn: 'ENTRER À THIERCELIEUX',
    cardsMatchInfo: (cards, players, hasThief) =>
      hasThief
        ? `${cards} cartes pour ${players} joueurs (+2 cartes cachées pour le Voleur)`
        : `${cards} cartes pour ${players} joueurs`,
    passDeviceTo: 'Passez discrètement l’appareil à',
    tapToRevealRole: 'TOUCHEZ LA CARTE POUR DÉCOUVRIR VOTRE RÔLE',
    holdSecretWarning: 'Assurez-vous que personne ne regarde votre écran.',
    memorizeAndHideBtn: 'J’AI MÉMORISÉ MON RÔLE (CACHER)',
    nextPlayerBtn: 'JOUEUR SUIVANT',
    enterTheNightBtn: 'FERMER LES YEUX • LA NUIT TOMBE',
    campVillage: 'Camp du Village',
    campWerewolves: 'Meute des Loups-Garous',
    campWhiteWolf: 'Loup-Garou Blanc (Solitaire)',
    campLovers: 'Les Amoureux Maudits',
    nightTitle: (turn) => `NUIT ${turn}`,
    dayTitle: (turn) => `JOUR ${turn}`,
    villageSleepsTitle: 'Le Village s’endort...',
    villageSleepsSub: 'Tous les joueurs ferment les yeux. Passez l’appareil à l’appel de votre rôle.',
    awakenNextRoleBtn: 'RÉVEILLER LE RÔLE SUIVANT',
    wakeUpCall: (roleName) => `${roleName} se réveille...`,
    confirmActionBtn: 'VALIDER MON CHOIX',
    skipActionBtn: 'PASSER MON TOUR',
    thiefPrompt: 'Choisissez l’une des 2 cartes supplémentaires ou conservez votre rôle :',
    thiefForcedWolf: 'Les deux cartes sont des Loups-Garous ! Vous devez rejoindre la meute.',
    thiefKeepCurrent: 'Garder ma carte de Voleur',
    cupidPrompt: 'Sélectionnez 2 joueurs pour les unir par les flèches de l’Amour :',
    loversWakeTitle: 'Les Amoureux se reconnaissent',
    loversWakeSub: 'Vos destins sont liés : si l’un de vous meurt, l’autre meurt aussitôt de chagrin.',
    twoSistersWakeTitle: 'Les Deux Sœurs se reconnaissent',
    twoSistersWakeSub: 'Vous êtes sœurs et toutes deux du camp du Village. Vous pouvez vous faire confiance !',
    bodyguardPrompt: 'Choisissez un joueur à protéger contre les Loups cette nuit :',
    bodyguardCannotRepeat: 'Protégé la nuit dernière (indisponible)',
    ravenPrompt: 'Désignez un suspect qui recevra +2 voix contre lui au vote de demain :',
    seerPrompt: 'Touchez un joueur pour contempler sa véritable identité dans votre boule de cristal :',
    seerVisionRevealed: 'La Boule de Cristal révèle :',
    werewolvesPrompt: 'La meute s’accorde en silence : quelle victime dévorer cette nuit ?',
    packMembersLabel: 'Membres de la Meute :',
    littleGirlPeekBtn: '👧 Espionner la meute (Petite Fille)',
    littleGirlPeekResult: (clue) => `Murmure dans l’ombre : ${clue}`,
    whiteWolfPrompt: 'Nuit du Loup Blanc : voulez-vous dévorer un Loup-Garou en secret ?',
    infectFatherPrompt: 'Pouvoir unique de l’Infect Père des Loups : voulez-vous infecter la victime des Loups pour la rallier à la meute ?',
    infectFatherVictimLabel: 'Proie choisie par les Loups :',
    infectFatherUseBtn: '🦠 Infecter (Devient Loup-Garou)',
    infectFatherSkipBtn: 'Dévorer normalement',
    extensionBadge: 'Extension',
    witchVictimLabel: 'Cible des Loups-Garous cette nuit :',
    witchNoVictim: 'Personne n’a été mordu par les Loups.',
    witchUseHealBtn: '🧪 Utiliser l’Élixir de Vie (Sauver)',
    witchHealUsed: 'Élixir de Vie déjà utilisé',
    witchUsePoisonLabel: '☠️ Utiliser le Poison Mortel sur :',
    witchPoisonUsed: 'Poison Mortel déjà utilisé',
    dawnBreaksBtn: 'LE JOUR SE LÈVE SUR LE VILLAGE',
    dawnTitle: (turn) => `L’Aube du Jour ${turn}`,
    peacefulNightMsg: 'Miracle à Thiercelieux ! Aucun habitant n’a péri durant la nuit.',
    tragicNightMsg: 'Des hurlements ont déchiré la nuit... Voici les victimes découvertes à l’aube :',
    hunterRevengeTitle: 'Dernier Souffle du Chasseur !',
    hunterRevengeSub: (name) => `${name} épaule son fusil avant de s’effondrer. Qui abattre ?`,
    mayorSuccessionTitle: 'Succession du Capitaine',
    mayorSuccessionSub: (name) => `${name} doit désigner son successeur au titre de Capitaine :`,
    mayorElectionTitle: 'Élection du Capitaine',
    mayorElectionSub: 'Le village vote à main levée : qui portera l’écharpe de Capitaine (voix double) ?',
    electMayorBtn: 'COURONNER LE CAPITAINE',
    skipMayorBtn: 'Jouer sans Capitaine',
    dayDiscussionTitle: 'Conseil du Village',
    dayDiscussionSub: 'Débattez, confrontez les témoignages et démasquez les Loups-Garous !',
    openCouncilVoteBtn: 'PASSER AU VOTE DU VILLAGE',
    addTimeBtn: '+60s',
    councilVoteTitle: 'Sentence du Village',
    councilVoteSub: 'Désignez le suspect condamné par la majorité des villageois :',
    executeSuspectBtn: 'EXÉCUTER LE SUSPECT',
    noExecutionTieBtn: 'Égalité / Aucune Exécution',
    ravenPenaltyBadge: '🪶 Corbeau (+2 voix)',
    mayorDoubleBadge: '👑 Capitaine (x2)',
    loverBadge: '💘 Amoureux',
    idiotPardonedBadge: '🃏 Gracié (Sans vote)',
    chroniclesTitle: 'Chroniques du Village',
    aliveTab: 'Survivants',
    fallenTab: 'Cimetière',
    victoryVillageTitle: 'VICTOIRE DU VILLAGE !',
    victoryVillageSub: 'Tous les Loups-Garous ont été éradiqués. Thiercelieux retrouve la paix !',
    victoryWolvesTitle: 'VICTOIRE DES LOUPS-GAROUS !',
    victoryWolvesSub: 'La meute a dévoré le village. Les ténèbres règnent sur Thiercelieux !',
    victoryWhiteWolfTitle: 'TRIOMPHE DU LOUP BLANC !',
    victoryWhiteWolfSub: 'Il a trahi la meute et éliminé le village : il est l’unique survivant !',
    victoryLoversTitle: 'TRIOMPHE DES AMOUREUX !',
    victoryLoversSub: 'Leur amour interdit a survécu à la meute comme au village !',
    playAgainSamePlayersBtn: 'REJOUER AVEC CE VILLAGE',
    backToLobbyBtn: 'RETOUR AU SALON',
    lanHostTitle: 'Héberger un Salon Local',
    lanJoinTitle: 'Rejoindre un Salon Local',
    lanRoomCodeLabel: 'Code du Salon (4 lettres)',
    lanYourNameLabel: 'Votre Prénom / Pseudo',
    lanServerUrlLabel: 'Relais Wi-Fi (ws://IP:4567)',
    lanCreateRoomBtn: 'CRÉER LE SALON',
    lanJoinRoomBtn: 'REJOINDRE LE VILLAGE',
    lanWaitingForHost: 'En attente du lancement par l’hôte du salon...',
    lanConnectedPlayers: 'Villageois connectés au salon',
    lanYourSecretCard: 'Votre Carte Secrète',
    backBtn: 'Retour',
  },
  en: {
    appTitle: 'THE WEREWOLVES',
    appSubtitle: 'OF MILLER’S HOLLOW • LOCAL EDITION',
    modePassAndPlay: 'Pass & Play (Single Device)',
    modePassDesc: 'Pass one phone or tablet around the table with an automated Narrator.',
    modeLan: 'Local Wi-Fi Room (Multi-Device)',
    modeLanDesc: 'Each player joins the village from their own smartphone over Local Wi-Fi / Hotspot.',
    grimoireBtn: 'Role Grimoire',
    soundOn: 'Audio & Ambience: ON',
    soundOff: 'Audio & Ambience: OFF',
    playersSection: 'Village Townsfolk',
    addPlayerPlaceholder: 'Villager name...',
    addBtn: 'Add',
    minPlayersWarning: 'At least 4 players are required to start a game.',
    rolesSection: 'Role Deck Composition',
    autoBalanceBtn: 'Auto-Balance',
    includeMayorLabel: 'Captain (Mayor) Election',
    mayorDesc: 'The village elects a Captain whose vote counts double and breaks ties.',
    discussionTimerLabel: 'Village Council Timer',
    startMatchBtn: 'ENTER MILLER’S HOLLOW',
    cardsMatchInfo: (cards, players, hasThief) =>
      hasThief
        ? `${cards} cards for ${players} players (+2 spare cards for the Thief)`
        : `${cards} cards for ${players} players`,
    passDeviceTo: 'Pass the device privately to',
    tapToRevealRole: 'TAP THE CARD TO REVEAL YOUR SECRET ROLE',
    holdSecretWarning: 'Make sure nobody else is peeking at your screen.',
    memorizeAndHideBtn: 'I MEMORIZED MY ROLE (HIDE)',
    nextPlayerBtn: 'NEXT PLAYER',
    enterTheNightBtn: 'CLOSE YOUR EYES • NIGHT FALLS',
    campVillage: 'Village Faction',
    campWerewolves: 'Werewolf Pack',
    campWhiteWolf: 'White Werewolf (Solo)',
    campLovers: 'Star-Crossed Lovers',
    nightTitle: (turn) => `NIGHT ${turn}`,
    dayTitle: (turn) => `DAY ${turn}`,
    villageSleepsTitle: 'The Village Falls Asleep...',
    villageSleepsSub: 'Everyone closes their eyes. Pass the device when your role is called.',
    awakenNextRoleBtn: 'AWAKEN NEXT ROLE',
    wakeUpCall: (roleName) => `${roleName} awakens...`,
    confirmActionBtn: 'CONFIRM CHOICE',
    skipActionBtn: 'SKIP TURN',
    thiefPrompt: 'Choose one of the 2 undealt cards or keep your Thief role:',
    thiefForcedWolf: 'Both cards are Werewolves! You must join the pack.',
    thiefKeepCurrent: 'Keep my Thief card',
    cupidPrompt: 'Select 2 players to bind together with Cupid’s golden arrows:',
    loversWakeTitle: 'The Lovers Recognize Each Other',
    loversWakeSub: 'Your fates are intertwined: if one of you dies, the other dies of heartbreak.',
    twoSistersWakeTitle: 'The Two Sisters Recognize Each Other',
    twoSistersWakeSub: 'You are sisters and both belong to the Village. You can trust each other!',
    bodyguardPrompt: 'Choose one player to shield from Werewolf attacks tonight:',
    bodyguardCannotRepeat: 'Protected last night (unavailable)',
    ravenPrompt: 'Select a suspect to curse with +2 penalty votes tomorrow:',
    seerPrompt: 'Tap a player to peer into their soul and reveal their true identity:',
    seerVisionRevealed: 'The Crystal Ball reveals:',
    werewolvesPrompt: 'The pack agrees in silence: which victim will you devour tonight?',
    packMembersLabel: 'Werewolf Pack Members:',
    littleGirlPeekBtn: '👧 Peek from the shadows (Little Girl)',
    littleGirlPeekResult: (clue) => `Whisper in the dark: ${clue}`,
    whiteWolfPrompt: 'White Wolf’s Ambush: will you secretly devour a fellow Werewolf?',
    infectFatherPrompt: 'Accursed Wolf-Father’s one-time power: infect the Wolves’ victim to turn them into a Werewolf?',
    infectFatherVictimLabel: 'Prey chosen by the pack:',
    infectFatherUseBtn: '🦠 Infect (Turn into Werewolf)',
    infectFatherSkipBtn: 'Devour Normally',
    extensionBadge: 'Expansion',
    witchVictimLabel: 'Werewolves’ target tonight:',
    witchNoVictim: 'Nobody was bitten by the Werewolves.',
    witchUseHealBtn: '🧪 Use Elixir of Life (Save Victim)',
    witchHealUsed: 'Elixir of Life already used',
    witchUsePoisonLabel: '☠️ Use Deadly Poison on:',
    witchPoisonUsed: 'Deadly Poison already used',
    dawnBreaksBtn: 'DAWN BREAKS OVER THE VILLAGE',
    dawnTitle: (turn) => `Dawn of Day ${turn}`,
    peacefulNightMsg: 'A miracle in Miller’s Hollow! Every villager survived the night.',
    tragicNightMsg: 'Howls echoed through the night... Here are the victims found at dawn:',
    hunterRevengeTitle: 'The Hunter’s Dying Shot!',
    hunterRevengeSub: (name) => `${name} aims their musket before falling. Who will they shoot?`,
    mayorSuccessionTitle: 'Captain’s Succession',
    mayorSuccessionSub: (name) => `${name} must name a living villager to inherit the Captain’s badge:`,
    mayorElectionTitle: 'Captain Election',
    mayorElectionSub: 'The village votes: who shall wear the Captain’s badge (double vote)?',
    electMayorBtn: 'CROWN THE CAPTAIN',
    skipMayorBtn: 'Play without Captain',
    dayDiscussionTitle: 'Village Council Debate',
    dayDiscussionSub: 'Debate, question alibis, and unmask the Werewolves hiding among you!',
    openCouncilVoteBtn: 'PROCEED TO VILLAGE VOTE',
    addTimeBtn: '+60s',
    councilVoteTitle: 'Village Verdict',
    councilVoteSub: 'Select the suspect condemned by the village majority:',
    executeSuspectBtn: 'EXECUTE SUSPECT',
    noExecutionTieBtn: 'Tie Vote / No Execution',
    ravenPenaltyBadge: '🪶 Raven (+2 votes)',
    mayorDoubleBadge: '👑 Captain (x2)',
    loverBadge: '💘 Lover',
    idiotPardonedBadge: '🃏 Pardoned (No vote)',
    chroniclesTitle: 'Village Chronicles',
    aliveTab: 'Survivors',
    fallenTab: 'Graveyard',
    victoryVillageTitle: 'VILLAGE VICTORY!',
    victoryVillageSub: 'All Werewolves have been vanquished. Peace returns to Miller’s Hollow!',
    victoryWolvesTitle: 'WEREWOLVES VICTORY!',
    victoryWolvesSub: 'The pack devoured the village. Darkness reigns over Miller’s Hollow!',
    victoryWhiteWolfTitle: 'WHITE WEREWOLF TRIUMPH!',
    victoryWhiteWolfSub: 'He betrayed the pack and outlasted the village as the sole survivor!',
    victoryLoversTitle: 'LOVERS TRIUMPH!',
    victoryLoversSub: 'Their forbidden love outlasted both the Werewolf pack and the village!',
    playAgainSamePlayersBtn: 'PLAY AGAIN WITH THIS VILLAGE',
    backToLobbyBtn: 'BACK TO LOBBY',
    lanHostTitle: 'Host a Local Wi-Fi Room',
    lanJoinTitle: 'Join a Local Wi-Fi Room',
    lanRoomCodeLabel: 'Room Code (4 letters)',
    lanYourNameLabel: 'Your Villager Name',
    lanServerUrlLabel: 'Wi-Fi Relay (ws://IP:4567)',
    lanCreateRoomBtn: 'CREATE ROOM',
    lanJoinRoomBtn: 'JOIN VILLAGE',
    lanWaitingForHost: 'Waiting for the room host to start the match...',
    lanConnectedPlayers: 'Villagers Connected in Room',
    lanYourSecretCard: 'Your Secret Role Card',
    backBtn: 'Back',
  },
};

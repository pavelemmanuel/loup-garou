import { RoleDefinition, RoleId } from '../engine/types';

export const ROLE_ORDER: RoleId[] = [
  'werewolf',
  'villager',
  'seer',
  'witch',
  'hunter',
  'cupid',
  'bodyguard',
  'little_girl',
  'white_wolf',
  'elder',
  'idiot',
  'raven',
  'thief',
];

export const ROLES: Record<RoleId, RoleDefinition> = {
  villager: {
    id: 'villager',
    camp: 'village',
    accentColor: '#38BDF8',
    secondaryColor: '#0369A1',
    nightOrder: null,
    name: {
      fr: 'Simple Villageois',
      en: 'Villager',
    },
    tagline: {
      fr: 'La force du nombre et de la déduction',
      en: 'Strength in numbers and keen deduction',
    },
    description: {
      fr: "Il n'a aucune compétence particulière. Ses seules armes sont sa capacité d'analyse des comportements pour identifier les Loups-Garous, et la force de son vote au conseil du village.",
      en: 'Has no supernatural power. Their only weapons are sharp intuition to unmask the Werewolves and their vote during the daily village council.',
    },
    powerPrompt: {
      fr: 'Observez les débats le jour et votez pour éliminer les Loups-Garous.',
      en: 'Observe the daytime debates and vote to eliminate the Werewolves.',
    },
  },

  werewolf: {
    id: 'werewolf',
    camp: 'werewolves',
    accentColor: '#E11D48',
    secondaryColor: '#881337',
    nightOrder: 7,
    name: {
      fr: 'Loup-Garou',
      en: 'Werewolf',
    },
    tagline: {
      fr: 'Prédateur nocturne de Thiercelieux',
      en: 'Nocturnal predator of Miller’s Hollow',
    },
    description: {
      fr: 'Chaque nuit, les Loups-Garous se réveillent ensemble et s’accordent pour dévorer un habitant du village. Le jour, ils se font passer pour d’innocents villageois.',
      en: 'Each night, the Werewolves awaken together and choose one villager to devour. By day, they blend in as innocent townsfolk.',
    },
    powerPrompt: {
      fr: 'Désignez ensemble la victime que la meute dévorera cette nuit.',
      en: 'Choose together the victim that the pack will devour tonight.',
    },
  },

  white_wolf: {
    id: 'white_wolf',
    camp: 'white_wolf',
    accentColor: '#F8FAFC',
    secondaryColor: '#991B1B',
    nightOrder: 8,
    everyOtherNight: true,
    name: {
      fr: 'Loup-Garou Blanc',
      en: 'White Werewolf',
    },
    tagline: {
      fr: 'Traître solitaire parmi la meute',
      en: 'Lone traitor hidden within the pack',
    },
    description: {
      fr: 'Il se réveille chaque nuit avec les autres Loups-Garous. Mais une nuit sur deux, il se réveille seul pour dévorer un Loup-Garou. Son unique objectif : être le tout dernier survivant du village !',
      en: 'Wakes up every night with the Werewolf pack. However, every other night, he wakes up alone and may devour a fellow Werewolf. His sole goal: be the last survivor alive!',
    },
    powerPrompt: {
      fr: 'Vous pouvez dévorer un Loup-Garou en secret ou épargner la meute cette nuit.',
      en: 'You may secretly devour a fellow Werewolf tonight, or spare the pack.',
    },
  },

  seer: {
    id: 'seer',
    camp: 'village',
    accentColor: '#A855F7',
    secondaryColor: '#581C87',
    nightOrder: 6,
    name: {
      fr: 'La Voyante',
      en: 'The Seer',
    },
    tagline: {
      fr: 'L’œil mystique qui perce les ténèbres',
      en: 'The mystic eye that pierces the dark',
    },
    description: {
      fr: 'Chaque nuit, sa boule de cristal lui révèle la véritable identité d’un joueur de son choix. Elle doit aider les villageois sans se faire repérer par les Loups-Garous.',
      en: 'Each night, her crystal ball reveals the true secret role of one player of her choice. She must guide the village without exposing herself to the Werewolves.',
    },
    powerPrompt: {
      fr: 'Choisissez un joueur pour sonder son âme et découvrir son rôle secret.',
      en: 'Select a player to peer into their soul and uncover their true role.',
    },
  },

  witch: {
    id: 'witch',
    camp: 'village',
    accentColor: '#10B981',
    secondaryColor: '#065F46',
    nightOrder: 9,
    name: {
      fr: 'La Sorcière',
      en: 'The Witch',
    },
    tagline: {
      fr: 'Maîtresse de la vie et du trépas',
      en: 'Mistress of life and deadly brew',
    },
    description: {
      fr: 'Elle possède deux potions uniques par partie : l’Élixir de Vie pour ressusciter la victime des Loups-Garous (y compris elle-même), et le Poison Mortel pour éliminer un joueur la nuit.',
      en: 'Possesses two single-use potions per game: the Elixir of Life to revive the Werewolves’ victim (including herself), and the Deadly Poison to eliminate any player at night.',
    },
    powerPrompt: {
      fr: 'Voyez la victime des Loups. Utilisez votre Élixir de Vie, votre Poison, ou passez.',
      en: 'Behold the Wolves’ victim. Use your Elixir of Life, Deadly Poison, or pass.',
    },
  },

  hunter: {
    id: 'hunter',
    camp: 'village',
    accentColor: '#F59E0B',
    secondaryColor: '#92400E',
    nightOrder: null,
    name: {
      fr: 'Le Chasseur',
      en: 'The Hunter',
    },
    tagline: {
      fr: 'Son dernier souffle est une balle fatale',
      en: 'His dying breath fires a fatal shot',
    },
    description: {
      fr: 'S’il est dévoré par les Loups-Garous ou exécuté par le village, le Chasseur doit immédiatement répliquer avant de mourir en abattant n’importe quel autre joueur vivant.',
      en: 'When devoured by Werewolves or executed by the village, the Hunter immediately fires his musket with his dying breath, eliminating any living player of his choice.',
    },
    powerPrompt: {
      fr: 'Dans votre dernier souffle, épaulez votre fusil et abattez un joueur !',
      en: 'With your dying breath, aim your musket and shoot one living player!',
    },
  },

  cupid: {
    id: 'cupid',
    camp: 'village',
    accentColor: '#EC4899',
    secondaryColor: '#9D174D',
    nightOrder: 2,
    firstNightOnly: true,
    name: {
      fr: 'Cupidon',
      en: 'Cupid',
    },
    tagline: {
      fr: 'Les flèches d’un amour interdit',
      en: 'Golden arrows of forbidden love',
    },
    description: {
      fr: 'Durant la première nuit, il décoche ses flèches sur deux joueurs qui deviennent Amoureux. Si l’un meurt, l’autre meurt aussitôt de chagrin. S’ils sont de camps opposés, ils doivent survivre seuls !',
      en: 'On the first night, Cupid shoots two players to make them Lovers. If one dies, the other immediately dies of heartbreak. If from opposing camps, they must survive together alone!',
    },
    powerPrompt: {
      fr: 'Choisissez deux joueurs (vous pouvez vous inclure) pour les unir par l’Amour.',
      en: 'Select two players (you may include yourself) to bind them in eternal Love.',
    },
  },

  bodyguard: {
    id: 'bodyguard',
    camp: 'village',
    accentColor: '#06B6D4',
    secondaryColor: '#155E75',
    nightOrder: 4,
    name: {
      fr: 'Le Salvateur',
      en: 'The Bodyguard',
    },
    tagline: {
      fr: 'Le bouclier sacré dans l’ombre',
      en: 'The sacred shield in the shadows',
    },
    description: {
      fr: 'Chaque nuit, il protège un joueur contre l’attaque des Loups-Garous (il peut se protéger lui-même). Il ne peut jamais protéger la même personne deux nuits de suite.',
      en: 'Each night, he protects one player from Werewolf attacks (he may protect himself). He cannot protect the exact same player two nights in a row.',
    },
    powerPrompt: {
      fr: 'Placez votre bouclier sur un villageois (différent de la nuit précédente).',
      en: 'Place your shield over a villager (must be different from last night).',
    },
  },

  little_girl: {
    id: 'little_girl',
    camp: 'village',
    accentColor: '#F472B6',
    secondaryColor: '#831843',
    nightOrder: null,
    name: {
      fr: 'La Petite Fille',
      en: 'The Little Girl',
    },
    tagline: {
      fr: 'Des yeux entrouverts dans la nuit noire',
      en: 'Peeking through fingers in the dark',
    },
    description: {
      fr: 'Elle peut entrouvrir les yeux pendant le réveil des Loups-Garous pour les espionner. En mode numérique, elle peut tenter d’épier la nuit : elle découvre un indice mais risque d’être repérée !',
      en: 'Can peek during the Werewolves’ turn to spy on them. In digital mode, her keen senses pick up nocturnal clues about the pack while hiding in the shadows.',
    },
    powerPrompt: {
      fr: 'Écoutez les murmures de la nuit et aidez le village à débusquer la meute.',
      en: 'Listen closely to the whispers of the night to help unmask the pack.',
    },
  },

  thief: {
    id: 'thief',
    camp: 'village',
    accentColor: '#8B5CF6',
    secondaryColor: '#4C1D95',
    nightOrder: 1,
    firstNightOnly: true,
    name: {
      fr: 'Le Voleur',
      en: 'The Thief',
    },
    tagline: {
      fr: 'Un destin volé à la croisée des chemins',
      en: 'A stolen fate at the crossroads',
    },
    description: {
      fr: 'La première nuit, il consulte deux cartes supplémentaires non distribuées et peut échanger son rôle contre l’une d’elles. Si les deux cartes sont des Loups-Garous, il est obligé d’en prendre une.',
      en: 'On the first night, he inspects two extra undealt role cards and may swap his role for one of them. If both cards are Werewolves, he is forced to become a Werewolf.',
    },
    powerPrompt: {
      fr: 'Examinez les deux cartes cachées : choisissez votre nouveau destin ou gardez le vôtre.',
      en: 'Inspect the two hidden cards: claim a new destiny or keep your current role.',
    },
  },

  elder: {
    id: 'elder',
    camp: 'village',
    accentColor: '#D97706',
    secondaryColor: '#78350F',
    nightOrder: null,
    name: {
      fr: 'L’Ancien',
      en: 'The Village Elder',
    },
    tagline: {
      fr: 'La sagesse millénaire du village',
      en: 'Ancient wisdom of Miller’s Hollow',
    },
    description: {
      fr: 'Il survit à la première attaque des Loups-Garous ! Mais attention : si l’Ancien est éliminé par le vote du village, le poison de la Sorcière ou le tir du Chasseur, tous les villageois perdent leurs pouvoirs !',
      en: 'Survives the first Werewolf attack! However, if the Elder is killed by the village vote, Witch’s poison, or Hunter’s shot, all villagers permanently lose their special powers!',
    },
    powerPrompt: {
      fr: 'Vous résistez à la première morsure des Loups. Ne vous faites pas voter par le village !',
      en: 'You survive the first Werewolf bite. Do not let the village vote you out!',
    },
  },

  idiot: {
    id: 'idiot',
    camp: 'village',
    accentColor: '#FACC15',
    secondaryColor: '#854D0E',
    nightOrder: null,
    name: {
      fr: 'L’Idiot du Village',
      en: 'The Village Idiot',
    },
    tagline: {
      fr: 'Trop innocent pour la potence',
      en: 'Too innocent for the gallows',
    },
    description: {
      fr: 'Si le village vote contre lui, il retourne sa carte : les villageois comprennent leur erreur et le gracient immédiatement ! Il reste en vie, mais perd son droit de vote pour le reste de la partie.',
      en: 'If the village votes to execute him, he reveals his card: the townsfolk realize their mistake and spare his life! He stays alive but loses his right to vote for the rest of the game.',
    },
    powerPrompt: {
      fr: 'Gracié en cas de vote du village contre vous, mais vous perdrez votre droit de vote.',
      en: 'Pardoned if voted out by the village, though you lose your voting right afterward.',
    },
  },

  raven: {
    id: 'raven',
    camp: 'village',
    accentColor: '#6366F1',
    secondaryColor: '#312E81',
    nightOrder: 5,
    name: {
      fr: 'Le Corbeau',
      en: 'The Raven',
    },
    tagline: {
      fr: 'Une lettre anonyme clouée à l’aube',
      en: 'An anonymous curse nailed at dawn',
    },
    description: {
      fr: 'Chaque nuit, il peut désigner un joueur qu’il soupçonne. Au matin, une affiche anonyme accuse ce joueur, qui démarre automatiquement le vote du village avec 2 voix supplémentaires contre lui.',
      en: 'Each night, he may curse a suspected player. At dawn, an anonymous poster accuses that player, automatically adding 2 penalty votes against them during the day’s council.',
    },
    powerPrompt: {
      fr: 'Clouez votre affiche anonyme sur la porte d’un suspect (+2 voix contre lui demain).',
      en: 'Nail your anonymous poster on a suspect’s door (+2 penalty votes tomorrow).',
    },
  },
};

/**
 * Generates an official balanced preset role distribution for a given player count (4 to 18 players).
 */
export function getRecommendedRoles(playerCount: number): Record<RoleId, number> {
  const counts: Record<RoleId, number> = {
    villager: 0,
    werewolf: 1,
    white_wolf: 0,
    seer: 1,
    witch: 0,
    hunter: 0,
    cupid: 0,
    bodyguard: 0,
    little_girl: 0,
    thief: 0,
    elder: 0,
    idiot: 0,
    raven: 0,
  };

  if (playerCount <= 4) {
    counts.werewolf = 1;
    counts.seer = 1;
    counts.witch = 1;
    counts.villager = Math.max(0, playerCount - 3);
    return counts;
  }

  if (playerCount === 5) {
    counts.werewolf = 1;
    counts.seer = 1;
    counts.witch = 1;
    counts.hunter = 1;
    counts.villager = 1;
    return counts;
  }

  // Standard wolf scaling
  if (playerCount >= 6 && playerCount <= 8) {
    counts.werewolf = 2;
  } else if (playerCount >= 9 && playerCount <= 12) {
    counts.werewolf = 2;
    if (playerCount >= 11) counts.white_wolf = 1;
    else counts.werewolf = 3;
  } else if (playerCount > 12) {
    counts.werewolf = 3;
    counts.white_wolf = 1;
  }

  counts.seer = 1;
  counts.witch = 1;
  if (playerCount >= 6) counts.hunter = 1;
  if (playerCount >= 7) counts.cupid = 1;
  if (playerCount >= 8) counts.bodyguard = 1;
  if (playerCount >= 9) counts.raven = 1;
  if (playerCount >= 10) counts.elder = 1;
  if (playerCount >= 12) counts.idiot = 1;

  const assigned = Object.values(counts).reduce((a, b) => a + b, 0);
  counts.villager = Math.max(0, playerCount - assigned);
  return counts;
}

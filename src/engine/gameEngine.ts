import { ROLES, ROLE_ORDER } from '../data/rolesData';
import {
  CampId,
  ChronicleEvent,
  GamePhase,
  MatchConfig,
  MatchState,
  NightState,
  PendingDeath,
  Player,
  RoleId,
} from './types';

function createFreshNightState(lastBodyguardTargetId: string | null = null): NightState {
  return {
    bodyguardTargetId: null,
    lastBodyguardTargetId,
    ravenTargetId: null,
    seerTargetId: null,
    seerRevealedRole: null,
    werewolfTargetId: null,
    werewolfVotes: {},
    whiteWolfTargetId: null,
    witchSaved: false,
    witchPoisonTargetId: null,
  };
}

function shuffleArray<T>(items: T[], rng: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function isWerewolfCamp(role: RoleId): boolean {
  return role === 'werewolf' || role === 'white_wolf';
}

export function createMatch(
  playerInputs: { id?: string; name: string; avatarIndex?: number }[],
  config: MatchConfig,
  rng: () => number = Math.random
): MatchState {
  const deck: RoleId[] = [];
  for (const roleId of ROLE_ORDER) {
    const count = config.rolesCount[roleId] || 0;
    for (let i = 0; i < count; i++) {
      deck.push(roleId);
    }
  }

  const hasThief = (config.rolesCount.thief || 0) > 0;
  const requiredCards = playerInputs.length + (hasThief ? 2 : 0);

  while (deck.length < requiredCards) {
    deck.push('villager');
  }

  let shuffled = shuffleArray(deck.slice(0, requiredCards), rng);

  // If Thief is in the game, make sure the Thief card is actually dealt to one of the players
  // so that the 2 extra cards on the table don't swallow the Thief role itself!
  if (hasThief) {
    const thiefIdx = shuffled.indexOf('thief');
    if (thiefIdx >= playerInputs.length) {
      const swapIdx = Math.floor(rng() * playerInputs.length);
      [shuffled[thiefIdx], shuffled[swapIdx]] = [shuffled[swapIdx], shuffled[thiefIdx]];
    }
  }

  const thiefExtraCards: [RoleId, RoleId] | null = hasThief
    ? [shuffled[playerInputs.length], shuffled[playerInputs.length + 1]]
    : null;

  const players: Player[] = playerInputs.map((p, idx) => {
    const role = shuffled[idx];
    return {
      id: p.id || `p_${idx + 1}`,
      name: p.name.trim() || `Joueur ${idx + 1}`,
      avatarIndex: p.avatarIndex ?? idx % 12,
      role,
      initialRole: role,
      alive: true,
      isMayor: false,
      loverId: null,
      elderLives: role === 'elder' ? 2 : 1,
      idiotRevealed: false,
      canVote: true,
      ravenCurves: 0,
    };
  });

  const initialChronicle: ChronicleEvent = {
    id: 'chronicle_start',
    turn: 1,
    timeOfDay: 'night',
    icon: '🌕',
    title: {
      fr: 'La Nuit tombe sur Thiercelieux',
      en: 'Night falls upon Miller’s Hollow',
    },
    detail: {
      fr: `${players.length} habitants reçoivent en secret leur destin...`,
      en: `${players.length} townsfolk secretly receive their destiny...`,
    },
    highlightColor: '#E11D48',
  };

  return {
    id: `match_${Date.now()}`,
    config,
    turn: 1,
    phase: 'ROLE_DISTRIBUTION',
    players,
    thiefExtraCards,
    witchPotions: {
      healAvailable: true,
      poisonAvailable: true,
    },
    elderPowerLost: false,
    night: createFreshNightState(null),
    dawnDeaths: [],
    pendingHunterIds: [],
    pendingMayorSuccessionFromId: null,
    returnPhaseAfterInterrupt: null,
    revealIndex: 0,
    activeNightActorIndex: 0,
    votes: {},
    mayorElectionDone: !config.includeMayor,
    chronicles: [initialChronicle],
    winner: null,
    winnerPlayerIds: [],
  };
}

/**
 * Computes the next night phase in official Thiercelieux order based on living roles & turn number.
 */
export function getNextNightPhase(state: MatchState, afterPhase: GamePhase): GamePhase {
  const sequence: GamePhase[] = [
    'NIGHT_THIEF',
    'NIGHT_CUPID',
    'NIGHT_LOVERS',
    'NIGHT_BODYGUARD',
    'NIGHT_RAVEN',
    'NIGHT_SEER',
    'NIGHT_WEREWOLVES',
    'NIGHT_WHITE_WOLF',
    'NIGHT_WITCH',
  ];

  const startIdx = afterPhase === 'NIGHT_INTRO' ? 0 : sequence.indexOf(afterPhase) + 1;

  for (let i = startIdx; i < sequence.length; i++) {
    const candidate = sequence[i];
    if (shouldRunNightPhase(state, candidate)) {
      return candidate;
    }
  }

  return 'DAWN_ANNOUNCEMENT';
}

export function shouldRunNightPhase(state: MatchState, phase: GamePhase): boolean {
  const alivePlayers = state.players.filter((p) => p.alive);
  const hasAliveRole = (r: RoleId) => alivePlayers.some((p) => p.role === r);

  switch (phase) {
    case 'NIGHT_THIEF':
      return state.turn === 1 && hasAliveRole('thief') && state.thiefExtraCards !== null;
    case 'NIGHT_CUPID':
      return state.turn === 1 && !state.elderPowerLost && hasAliveRole('cupid');
    case 'NIGHT_LOVERS':
      return state.turn === 1 && alivePlayers.some((p) => p.loverId !== null);
    case 'NIGHT_BODYGUARD':
      return !state.elderPowerLost && hasAliveRole('bodyguard');
    case 'NIGHT_RAVEN':
      return !state.elderPowerLost && hasAliveRole('raven');
    case 'NIGHT_SEER':
      return !state.elderPowerLost && hasAliveRole('seer');
    case 'NIGHT_WEREWOLVES':
      return alivePlayers.some((p) => isWerewolfCamp(p.role));
    case 'NIGHT_WHITE_WOLF':
      // Official rule: White Werewolf wakes up alone every other night (Night 2, 4, 6...)
      return (
        state.turn % 2 === 0 &&
        hasAliveRole('white_wolf') &&
        alivePlayers.some((p) => p.role === 'werewolf')
      );
    case 'NIGHT_WITCH':
      return (
        !state.elderPowerLost &&
        hasAliveRole('witch') &&
        (state.witchPotions.healAvailable || state.witchPotions.poisonAvailable)
      );
    default:
      return false;
  }
}

export function advanceFromRoleDistribution(state: MatchState): MatchState {
  if (state.revealIndex + 1 < state.players.length) {
    return {
      ...state,
      revealIndex: state.revealIndex + 1,
    };
  }
  return {
    ...state,
    phase: 'NIGHT_INTRO',
    revealIndex: 0,
  };
}

export function startNightSequence(state: MatchState): MatchState {
  const nextPhase = getNextNightPhase(state, 'NIGHT_INTRO');
  if (nextPhase === 'DAWN_ANNOUNCEMENT') {
    return resolveDawn(state);
  }
  return {
    ...state,
    phase: nextPhase,
    activeNightActorIndex: 0,
  };
}

/**
 * Thief action on Night 1: choose card 0, card 1, or null (keep thief card unless both are werewolves).
 */
export function applyThiefChoice(state: MatchState, cardIndex: 0 | 1 | null): MatchState {
  const thief = state.players.find((p) => p.alive && p.role === 'thief');
  let updatedPlayers = [...state.players];

  if (thief && state.thiefExtraCards) {
    const [c0, c1] = state.thiefExtraCards;
    const bothWolves = isWerewolfCamp(c0) && isWerewolfCamp(c1);
    let chosenRole: RoleId | null =
      cardIndex !== null ? state.thiefExtraCards[cardIndex] : bothWolves ? c0 : null;

    if (chosenRole) {
      updatedPlayers = updatedPlayers.map((p) =>
        p.id === thief.id
          ? {
              ...p,
              role: chosenRole!,
              elderLives: chosenRole === 'elder' ? 2 : 1,
            }
          : p
      );
    }
  }

  const nextState: MatchState = {
    ...state,
    players: updatedPlayers,
    night: {
      ...state.night,
      thiefSwapped: cardIndex !== null,
    },
  };

  const nextPhase = getNextNightPhase(nextState, 'NIGHT_THIEF');
  if (nextPhase === 'DAWN_ANNOUNCEMENT') {
    return resolveDawn(nextState);
  }
  return { ...nextState, phase: nextPhase, activeNightActorIndex: 0 };
}

/**
 * Cupid action on Night 1: link two players in eternal love.
 */
export function applyCupidLovers(
  state: MatchState,
  loverAId: string,
  loverBId: string
): MatchState {
  if (loverAId === loverBId) return state;

  const updatedPlayers = state.players.map((p) => {
    if (p.id === loverAId) return { ...p, loverId: loverBId };
    if (p.id === loverBId) return { ...p, loverId: loverAId };
    return p;
  });

  const loverA = updatedPlayers.find((p) => p.id === loverAId);
  const loverB = updatedPlayers.find((p) => p.id === loverBId);

  const chronicles = [...state.chronicles];
  if (loverA && loverB) {
    chronicles.unshift({
      id: `cupid_${state.turn}_${Date.now()}`,
      turn: state.turn,
      timeOfDay: 'night',
      icon: '💘',
      title: {
        fr: 'Flèches de Cupidon',
        en: 'Cupid’s Golden Arrows',
      },
      detail: {
        fr: 'Deux cœurs du village sont désormais liés à la vie, à la mort.',
        en: 'Two hearts in the village are now bound together in life and death.',
      },
      highlightColor: '#EC4899',
    });
  }

  const nextState: MatchState = {
    ...state,
    players: updatedPlayers,
    chronicles,
  };

  const nextPhase = getNextNightPhase(nextState, 'NIGHT_CUPID');
  if (nextPhase === 'DAWN_ANNOUNCEMENT') {
    return resolveDawn(nextState);
  }
  return { ...nextState, phase: nextPhase, activeNightActorIndex: 0 };
}

export function acknowledgeLoversPhase(state: MatchState): MatchState {
  const nextPhase = getNextNightPhase(state, 'NIGHT_LOVERS');
  if (nextPhase === 'DAWN_ANNOUNCEMENT') {
    return resolveDawn(state);
  }
  return { ...state, phase: nextPhase, activeNightActorIndex: 0 };
}

/**
 * Bodyguard (Salvateur) action: protect one living player (cannot be same as lastBodyguardTargetId).
 */
export function applyBodyguardProtection(state: MatchState, targetId: string): MatchState {
  if (targetId === state.night.lastBodyguardTargetId) {
    return state;
  }
  const nextState: MatchState = {
    ...state,
    night: {
      ...state.night,
      bodyguardTargetId: targetId,
    },
  };
  const nextPhase = getNextNightPhase(nextState, 'NIGHT_BODYGUARD');
  if (nextPhase === 'DAWN_ANNOUNCEMENT') {
    return resolveDawn(nextState);
  }
  return { ...nextState, phase: nextPhase, activeNightActorIndex: 0 };
}

/**
 * Raven (Corbeau) action: place +2 anonymous penalty votes on a player for tomorrow's vote.
 */
export function applyRavenCurse(state: MatchState, targetId: string | null): MatchState {
  const updatedPlayers = state.players.map((p) => ({
    ...p,
    ravenCurves: targetId && p.id === targetId ? 2 : 0,
  }));

  const nextState: MatchState = {
    ...state,
    players: updatedPlayers,
    night: {
      ...state.night,
      ravenTargetId: targetId,
    },
  };
  const nextPhase = getNextNightPhase(nextState, 'NIGHT_RAVEN');
  if (nextPhase === 'DAWN_ANNOUNCEMENT') {
    return resolveDawn(nextState);
  }
  return { ...nextState, phase: nextPhase, activeNightActorIndex: 0 };
}

/**
 * Seer (Voyante) inspection: first reveals the target's role on screen, then advances when confirmed.
 */
export function inspectPlayerWithSeer(state: MatchState, targetId: string): MatchState {
  const target = state.players.find((p) => p.id === targetId);
  if (!target) return state;

  return {
    ...state,
    night: {
      ...state.night,
      seerTargetId: targetId,
      seerRevealedRole: target.role,
    },
  };
}

export function advanceAfterSeer(state: MatchState): MatchState {
  const nextPhase = getNextNightPhase(state, 'NIGHT_SEER');
  if (nextPhase === 'DAWN_ANNOUNCEMENT') {
    return resolveDawn(state);
  }
  return { ...state, phase: nextPhase, activeNightActorIndex: 0 };
}

/**
 * Werewolves pack target selection.
 */
export function applyWerewolvesTarget(state: MatchState, targetId: string): MatchState {
  const nextState: MatchState = {
    ...state,
    night: {
      ...state.night,
      werewolfTargetId: targetId,
    },
  };
  const nextPhase = getNextNightPhase(nextState, 'NIGHT_WEREWOLVES');
  if (nextPhase === 'DAWN_ANNOUNCEMENT') {
    return resolveDawn(nextState);
  }
  return { ...nextState, phase: nextPhase, activeNightActorIndex: 0 };
}

/**
 * White Werewolf solo ambush every other night (can devour a regular werewolf or pass with null).
 */
export function applyWhiteWolfTarget(state: MatchState, targetId: string | null): MatchState {
  const nextState: MatchState = {
    ...state,
    night: {
      ...state.night,
      whiteWolfTargetId: targetId,
    },
  };
  const nextPhase = getNextNightPhase(nextState, 'NIGHT_WHITE_WOLF');
  if (nextPhase === 'DAWN_ANNOUNCEMENT') {
    return resolveDawn(nextState);
  }
  return { ...nextState, phase: nextPhase, activeNightActorIndex: 0 };
}

/**
 * Witch decision: optionally heal the werewolf target, optionally poison someone, or pass.
 */
export function applyWitchDecision(
  state: MatchState,
  opts: { useHeal: boolean; poisonTargetId: string | null }
): MatchState {
  const useHeal = opts.useHeal && state.witchPotions.healAvailable && !!state.night.werewolfTargetId;
  const poisonTargetId =
    opts.poisonTargetId && state.witchPotions.poisonAvailable ? opts.poisonTargetId : null;

  const nextState: MatchState = {
    ...state,
    witchPotions: {
      healAvailable: useHeal ? false : state.witchPotions.healAvailable,
      poisonAvailable: poisonTargetId ? false : state.witchPotions.poisonAvailable,
    },
    night: {
      ...state.night,
      witchSaved: useHeal,
      witchPoisonTargetId: poisonTargetId,
    },
  };

  return resolveDawn(nextState);
}

/**
 * Resolves all nocturnal actions at Dawn:
 * - Bodyguard shield
 * - Witch Elixir of Life
 * - Elder 2-lives resistance against Werewolves
 * - White Wolf solo kill
 * - Witch Deadly Poison (triggers Elder power loss if Elder is poisoned!)
 * - Lovers heartbreak chain reaction
 */
export function resolveDawn(state: MatchState): MatchState {
  let players = state.players.map((p) => ({ ...p }));
  const dawnDeaths: PendingDeath[] = [];
  const chronicles = [...state.chronicles];
  let elderPowerLost = state.elderPowerLost;

  const addDeath = (playerId: string, reason: PendingDeath['reason']) => {
    const p = players.find((x) => x.id === playerId);
    if (!p || !p.alive) return;
    if (dawnDeaths.some((d) => d.playerId === playerId)) return;

    p.alive = false;
    dawnDeaths.push({ playerId, reason });

    // If Elder dies from Witch poison, villagers lose their powers!
    if (p.role === 'elder' && reason === 'witch_poison') {
      elderPowerLost = true;
    }

    // Check Lover heartbreak chain
    if (p.loverId) {
      const partner = players.find((x) => x.id === p.loverId);
      if (partner && partner.alive) {
        addDeath(partner.id, 'heartbreak');
      }
    }
  };

  // 1. Resolve Werewolf attack
  const wolfVictimId = state.night.werewolfTargetId;
  if (wolfVictimId) {
    const protectedByBodyguard = state.night.bodyguardTargetId === wolfVictimId;
    const savedByWitch = state.night.witchSaved;

    if (!protectedByBodyguard && !savedByWitch) {
      const victim = players.find((p) => p.id === wolfVictimId);
      if (victim && victim.alive) {
        if (victim.role === 'elder' && victim.elderLives > 1) {
          // Elder survives first werewolf bite!
          victim.elderLives -= 1;
          chronicles.unshift({
            id: `elder_survive_${state.turn}_${Date.now()}`,
            turn: state.turn,
            timeOfDay: 'night',
            icon: '🛡️',
            title: {
              fr: 'Miracle dans la nuit',
              en: 'Miracle in the Night',
            },
            detail: {
              fr: 'Une attaque a eu lieu, mais la sagesse de l’Ancien a repoussé les ombres !',
              en: 'An attack occurred, yet ancient resilience repelled the shadows!',
            },
            highlightColor: '#D97706',
          });
        } else {
          addDeath(victim.id, 'werewolves');
        }
      }
    }
  }

  // 2. Resolve White Werewolf attack
  if (state.night.whiteWolfTargetId) {
    const wwTargetId = state.night.whiteWolfTargetId;
    const protectedByBodyguard = state.night.bodyguardTargetId === wwTargetId;
    if (!protectedByBodyguard) {
      addDeath(wwTargetId, 'white_wolf');
    }
  }

  // 3. Resolve Witch Poison
  if (state.night.witchPoisonTargetId) {
    addDeath(state.night.witchPoisonTargetId, 'witch_poison');
  }

  // Raven announcement
  if (state.night.ravenTargetId) {
    const cursed = players.find((p) => p.id === state.night.ravenTargetId);
    if (cursed && cursed.alive) {
      chronicles.unshift({
        id: `raven_${state.turn}_${Date.now()}`,
        turn: state.turn,
        timeOfDay: 'day',
        icon: '🪶',
        title: {
          fr: 'Lettre Anonyme du Corbeau',
          en: 'The Raven’s Anonymous Poster',
        },
        detail: {
          fr: `${cursed.name} est accusé par le Corbeau (+2 voix contre lui aujourd'hui).`,
          en: `${cursed.name} has been cursed by the Raven (+2 penalty votes today).`,
        },
        highlightColor: '#6366F1',
      });
    }
  }

  // Dawn summary chronicle
  if (dawnDeaths.length === 0) {
    chronicles.unshift({
      id: `dawn_${state.turn}_${Date.now()}`,
      turn: state.turn,
      timeOfDay: 'day',
      icon: '🌅',
      title: {
        fr: `Aube du Jour ${state.turn} — Aucune Victime`,
        en: `Dawn of Day ${state.turn} — No Victims`,
      },
      detail: {
        fr: 'Le soleil se lève sur Thiercelieux. Tous les habitants ont survécu à la nuit !',
        en: 'The sun rises over Miller’s Hollow. Every villager survived the night!',
      },
      highlightColor: '#10B981',
    });
  } else {
    const victimNames = dawnDeaths
      .map((d) => {
        const p = players.find((x) => x.id === d.playerId);
        return p ? `${p.name} (${ROLES[p.role].name.fr})` : '';
      })
      .filter(Boolean)
      .join(', ');
    const victimNamesEn = dawnDeaths
      .map((d) => {
        const p = players.find((x) => x.id === d.playerId);
        return p ? `${p.name} (${ROLES[p.role].name.en})` : '';
      })
      .filter(Boolean)
      .join(', ');

    chronicles.unshift({
      id: `dawn_${state.turn}_${Date.now()}`,
      turn: state.turn,
      timeOfDay: 'day',
      icon: '🩸',
      title: {
        fr: `Aube Tragique — Jour ${state.turn}`,
        en: `Tragic Dawn — Day ${state.turn}`,
      },
      detail: {
        fr: `Le village pleure la perte de : ${victimNames}.`,
        en: `The village mourns the loss of: ${victimNamesEn}.`,
      },
      highlightColor: '#E11D48',
    });
  }

  const pendingHunterIds = dawnDeaths
    .map((d) => players.find((p) => p.id === d.playerId))
    .filter((p): p is Player => !!p && p.role === 'hunter' && !elderPowerLost)
    .map((p) => p.id);

  const deadMayor = dawnDeaths
    .map((d) => players.find((p) => p.id === d.playerId))
    .find((p) => !!p && p.isMayor);

  return {
    ...state,
    phase: 'DAWN_ANNOUNCEMENT',
    players,
    elderPowerLost,
    dawnDeaths,
    pendingHunterIds,
    pendingMayorSuccessionFromId: deadMayor ? deadMayor.id : null,
    returnPhaseAfterInterrupt: !state.mayorElectionDone ? 'MAYOR_ELECTION' : 'DAY_DISCUSSION',
    chronicles,
  };
}

/**
 * Advances from DAWN_ANNOUNCEMENT, HUNTER_REVENGE, or MAYOR_SUCCESSION,
 * checking victory conditions and handling any queued interrupts.
 */
export function proceedAfterDawnOrInterrupt(state: MatchState): MatchState {
  // 1. If a Hunter died and still needs to fire their dying shot:
  if (state.pendingHunterIds.length > 0 && state.players.some((p) => p.alive)) {
    return {
      ...state,
      phase: 'HUNTER_REVENGE',
    };
  }

  // 2. Check if game is won before mayor succession
  const victoryChecked = checkVictoryCondition(state);
  if (victoryChecked.phase === 'GAME_OVER') {
    return victoryChecked;
  }

  // 3. If the Mayor died and must designate a living successor:
  if (
    state.pendingMayorSuccessionFromId &&
    state.players.some((p) => p.alive)
  ) {
    return {
      ...victoryChecked,
      phase: 'MAYOR_SUCCESSION',
    };
  }

  // 4. Otherwise proceed to the scheduled phase (MAYOR_ELECTION, DAY_DISCUSSION, or NIGHT_INTRO)
  const targetPhase =
    victoryChecked.returnPhaseAfterInterrupt ||
    (!victoryChecked.mayorElectionDone ? 'MAYOR_ELECTION' : 'DAY_DISCUSSION');

  if (targetPhase === 'NIGHT_INTRO') {
    const nextTurn = victoryChecked.turn + 1;
    return {
      ...victoryChecked,
      turn: nextTurn,
      phase: 'NIGHT_INTRO',
      night: createFreshNightState(victoryChecked.night.bodyguardTargetId),
      dawnDeaths: [],
      votes: {},
      returnPhaseAfterInterrupt: null,
    };
  }

  return {
    ...victoryChecked,
    phase: targetPhase,
    votes: {},
    returnPhaseAfterInterrupt: null,
  };
}

/**
 * Hunter fires their musket at `targetId`.
 */
export function applyHunterShot(state: MatchState, targetId: string): MatchState {
  const shooterId = state.pendingHunterIds[0];
  const remainingHunters = state.pendingHunterIds.slice(1);
  let players = state.players.map((p) => ({ ...p }));
  const chronicles = [...state.chronicles];
  let elderPowerLost = state.elderPowerLost;
  let pendingMayorSuccessionFromId = state.pendingMayorSuccessionFromId;

  const newHunters: string[] = [];

  const killTarget = (id: string, reason: PendingDeath['reason']) => {
    const victim = players.find((p) => p.id === id);
    if (!victim || !victim.alive) return;
    victim.alive = false;

    if (victim.role === 'elder') {
      elderPowerLost = true;
    }
    if (victim.isMayor) {
      pendingMayorSuccessionFromId = victim.id;
    }
    if (victim.role === 'hunter' && !elderPowerLost) {
      newHunters.push(victim.id);
    }

    chronicles.unshift({
      id: `hunter_shot_${Date.now()}_${id}`,
      turn: state.turn,
      timeOfDay: 'day',
      icon: reason === 'hunter' ? '🎯' : '💔',
      title:
        reason === 'hunter'
          ? {
              fr: 'Dernier Souffle du Chasseur',
              en: 'The Hunter’s Dying Shot',
            }
          : {
              fr: 'Chagrin d’Amour',
              en: 'Broken Heart',
            },
      detail:
        reason === 'hunter'
          ? {
              fr: `Dans son dernier souffle, le Chasseur abat ${victim.name} (${ROLES[victim.role].name.fr}) !`,
              en: `With his dying breath, the Hunter shoots ${victim.name} (${ROLES[victim.role].name.en})!`,
            }
          : {
              fr: `Incapable de survivre sans son amour, ${victim.name} (${ROLES[victim.role].name.fr}) meurt de chagrin.`,
              en: `Unable to live without their beloved, ${victim.name} (${ROLES[victim.role].name.en}) dies of heartbreak.`,
            },
      highlightColor: '#F59E0B',
    });

    if (victim.loverId) {
      const partner = players.find((p) => p.id === victim.loverId);
      if (partner && partner.alive) {
        killTarget(partner.id, 'heartbreak');
      }
    }
  };

  if (shooterId && targetId) {
    killTarget(targetId, 'hunter');
  }

  const nextState: MatchState = {
    ...state,
    players,
    elderPowerLost,
    pendingHunterIds: [...remainingHunters, ...newHunters],
    pendingMayorSuccessionFromId,
    chronicles,
  };

  return proceedAfterDawnOrInterrupt(nextState);
}

/**
 * Dying Mayor names their living successor.
 */
export function applyMayorSuccessor(state: MatchState, successorId: string): MatchState {
  const players = state.players.map((p) => ({
    ...p,
    isMayor: p.id === successorId && p.alive,
  }));

  const successor = players.find((p) => p.id === successorId);
  const chronicles = [...state.chronicles];

  if (successor) {
    chronicles.unshift({
      id: `mayor_succ_${Date.now()}`,
      turn: state.turn,
      timeOfDay: 'day',
      icon: '👑',
      title: {
        fr: 'Succession du Capitaine',
        en: 'Captain’s Succession',
      },
      detail: {
        fr: `Dans son dernier souffle, le Capitaine remet son écharpe à ${successor.name}.`,
        en: `With their final breath, the Captain passes the badge of office to ${successor.name}.`,
      },
      highlightColor: '#FACC15',
    });
  }

  const nextState: MatchState = {
    ...state,
    players,
    pendingMayorSuccessionFromId: null,
    chronicles,
  };

  return proceedAfterDawnOrInterrupt(nextState);
}

/**
 * Elects the Mayor/Captain on Day 1.
 */
export function electMayor(state: MatchState, mayorId: string): MatchState {
  const players = state.players.map((p) => ({
    ...p,
    isMayor: p.id === mayorId,
  }));
  const mayor = players.find((p) => p.id === mayorId);
  const chronicles = [...state.chronicles];

  if (mayor) {
    chronicles.unshift({
      id: `mayor_elect_${Date.now()}`,
      turn: state.turn,
      timeOfDay: 'day',
      icon: '👑',
      title: {
        fr: `${mayor.name} élu Capitaine !`,
        en: `${mayor.name} Elected Captain!`,
      },
      detail: {
        fr: 'Sa voix comptera double lors des votes du village.',
        en: 'Their vote now counts double during village executions.',
      },
      highlightColor: '#FACC15',
    });
  }

  return {
    ...state,
    players,
    mayorElectionDone: true,
    phase: 'DAY_DISCUSSION',
    votes: {},
    chronicles,
  };
}

export function startDayVoting(state: MatchState): MatchState {
  return {
    ...state,
    phase: 'DAY_VOTE',
    votes: {},
  };
}

export function castVillageVote(
  state: MatchState,
  voterId: string,
  targetId: string
): MatchState {
  const voter = state.players.find((p) => p.id === voterId);
  if (!voter || !voter.alive || !voter.canVote) return state;

  return {
    ...state,
    votes: {
      ...state.votes,
      [voterId]: targetId,
    },
  };
}

/**
 * Tallies the village vote (including Mayor's 2x vote weight and Raven's +2 penalty votes)
 * or executes a direct chosen suspect (`directTargetId`).
 */
export function resolveVillageVote(
  state: MatchState,
  directTargetId?: string | null
): MatchState {
  let condemnedId: string | null = directTargetId ?? null;

  if (condemnedId === undefined) {
    const tally: Record<string, number> = {};
    // Add Raven's +2 penalty curses
    for (const p of state.players) {
      if (p.alive && p.ravenCurves > 0) {
        tally[p.id] = (tally[p.id] || 0) + p.ravenCurves;
      }
    }

    for (const [voterId, targetId] of Object.entries(state.votes)) {
      const voter = state.players.find((p) => p.id === voterId);
      if (voter && voter.alive && voter.canVote) {
        const weight = voter.isMayor ? 2 : 1;
        tally[targetId] = (tally[targetId] || 0) + weight;
      }
    }

    let maxVotes = 0;
    let topCandidates: string[] = [];
    for (const [candidateId, count] of Object.entries(tally)) {
      if (count > maxVotes) {
        maxVotes = count;
        topCandidates = [candidateId];
      } else if (count === maxVotes && count > 0) {
        topCandidates.push(candidateId);
      }
    }

    if (topCandidates.length === 1) {
      condemnedId = topCandidates[0];
    } else if (topCandidates.length > 1) {
      // Check if Mayor voted for one of the tied candidates to break the tie
      const mayor = state.players.find((p) => p.alive && p.isMayor);
      const mayorChoice = mayor ? state.votes[mayor.id] : null;
      if (mayorChoice && topCandidates.includes(mayorChoice)) {
        condemnedId = mayorChoice;
      } else {
        condemnedId = null; // Tie with no mayor tie-break -> no execution
      }
    }
  }

  let players = state.players.map((p) => ({
    ...p,
    ravenCurves: 0, // Reset Raven curses after the day's vote
  }));
  const chronicles = [...state.chronicles];
  let elderPowerLost = state.elderPowerLost;
  const pendingHunterIds = [...state.pendingHunterIds];
  let pendingMayorSuccessionFromId = state.pendingMayorSuccessionFromId;
  const dayDeaths: PendingDeath[] = [];

  if (!condemnedId) {
    chronicles.unshift({
      id: `vote_tie_${state.turn}_${Date.now()}`,
      turn: state.turn,
      timeOfDay: 'day',
      icon: '⚖️',
      title: {
        fr: 'Indécision du Village',
        en: 'Village Indecision',
      },
      detail: {
        fr: 'Aucun suspect n’a recueilli la majorité. Personne n’est exécuté ce soir.',
        en: 'No suspect reached a clear majority. Nobody is executed tonight.',
      },
      highlightColor: '#94A3B8',
    });
  } else {
    const target = players.find((p) => p.id === condemnedId);
    if (target && target.alive) {
      // Check Village Idiot pardon rule!
      if (target.role === 'idiot' && !elderPowerLost) {
        target.idiotRevealed = true;
        target.canVote = false;
        chronicles.unshift({
          id: `idiot_pardon_${state.turn}_${Date.now()}`,
          turn: state.turn,
          timeOfDay: 'day',
          icon: '🃏',
          title: {
            fr: `${target.name} est l’Idiot du Village !`,
            en: `${target.name} is the Village Idiot!`,
          },
          detail: {
            fr: 'Le village reconnaît son innocence et l’épargne ! Il perd toutefois son droit de vote.',
            en: 'The townsfolk realize his harmlessness and spare his life! However, he loses his right to vote.',
          },
          highlightColor: '#FACC15',
        });
      } else {
        const executePlayer = (id: string, reason: PendingDeath['reason']) => {
          const victim = players.find((p) => p.id === id);
          if (!victim || !victim.alive) return;
          victim.alive = false;
          dayDeaths.push({ playerId: victim.id, reason });

          if (victim.role === 'elder') {
            elderPowerLost = true;
            // If Elder is voted out, Village Idiot (if already revealed) also dies per classic rule, and all powers are lost
            chronicles.unshift({
              id: `elder_curse_${Date.now()}`,
              turn: state.turn,
              timeOfDay: 'day',
              icon: '⚡',
              title: {
                fr: 'Malédiction de l’Ancien !',
                en: 'Curse of the Elder!',
              },
              detail: {
                fr: 'Le village a exécuté son Ancien ! Tous les villageois perdent leurs pouvoirs spéciaux.',
                en: 'The village executed the Elder! All townsfolk permanently lose their special powers.',
              },
              highlightColor: '#D97706',
            });
          }

          if (victim.isMayor) {
            pendingMayorSuccessionFromId = victim.id;
          }

          if (victim.role === 'hunter' && !elderPowerLost) {
            pendingHunterIds.push(victim.id);
          }

          chronicles.unshift({
            id: `vote_exec_${Date.now()}_${id}`,
            turn: state.turn,
            timeOfDay: 'day',
            icon: reason === 'vote' ? '🔥' : '💔',
            title:
              reason === 'vote'
                ? {
                    fr: `Sentence du Village : ${victim.name}`,
                    en: `Village Verdict: ${victim.name}`,
                  }
                : {
                    fr: `Mort de Chagrin : ${victim.name}`,
                    en: `Died of Heartbreak: ${victim.name}`,
                  },
            detail:
              reason === 'vote'
                ? {
                    fr: `Le village a éliminé ${victim.name}. Son véritable rôle était : ${ROLES[victim.role].name.fr}.`,
                    en: `The village eliminated ${victim.name}. Their true role was: ${ROLES[victim.role].name.en}.`,
                  }
                : {
                    fr: `Déchiré par la perte de son âme sœur, ${victim.name} (${ROLES[victim.role].name.fr}) s’éteint à son tour.`,
                    en: `Heartbroken by the loss of their soulmate, ${victim.name} (${ROLES[victim.role].name.en}) perishes too.`,
                  },
            highlightColor: reason === 'vote' ? '#F97316' : '#EC4899',
          });

          if (victim.loverId) {
            const partner = players.find((p) => p.id === victim.loverId);
            if (partner && partner.alive) {
              executePlayer(partner.id, 'heartbreak');
            }
          }
        };

        executePlayer(target.id, 'vote');
      }
    }
  }

  const nextState: MatchState = {
    ...state,
    players,
    elderPowerLost,
    dawnDeaths: dayDeaths,
    pendingHunterIds,
    pendingMayorSuccessionFromId,
    returnPhaseAfterInterrupt: 'NIGHT_INTRO',
    chronicles,
  };

  return proceedAfterDawnOrInterrupt(nextState);
}

/**
 * Checks whether any faction has won the game:
 * - Star-Crossed Lovers (`lovers`): Only the 2 Lovers remain alive (and they started in different camps, or any 2 lovers last alive).
 * - White Werewolf (`white_wolf`): Only the White Werewolf remains alive.
 * - Village (`village`): No Werewolf or White Werewolf remains alive.
 * - Werewolves (`werewolves`): No non-werewolf villager remains alive (and White Werewolf is not alive to contest them).
 */
export function checkVictoryCondition(state: MatchState): MatchState {
  const alive = state.players.filter((p) => p.alive);

  if (alive.length === 0) {
    return {
      ...state,
      phase: 'GAME_OVER',
      winner: 'village',
      winnerPlayerIds: [],
    };
  }

  // 1. Check Lovers Duo Victory (exactly 2 alive and they are Lovers with each other)
  if (alive.length === 2 && alive[0].loverId === alive[1].id) {
    const campA = ROLES[alive[0].role].camp;
    const campB = ROLES[alive[1].role].camp;
    // Mixed-camp lovers win as the Lovers faction; same-camp village lovers win with Village
    if (campA !== campB) {
      return {
        ...state,
        phase: 'GAME_OVER',
        winner: 'lovers',
        winnerPlayerIds: [alive[0].id, alive[1].id],
      };
    }
  }

  const aliveWolves = alive.filter((p) => p.role === 'werewolf');
  const aliveWhiteWolf = alive.filter((p) => p.role === 'white_wolf');
  const aliveVillagers = alive.filter((p) => !isWerewolfCamp(p.role));

  // 2. White Werewolf solo victory: last player alive (or only White Wolf left)
  if (aliveWhiteWolf.length > 0 && aliveWolves.length === 0 && aliveVillagers.length === 0) {
    return {
      ...state,
      phase: 'GAME_OVER',
      winner: 'white_wolf',
      winnerPlayerIds: aliveWhiteWolf.map((p) => p.id),
    };
  }

  // 3. Village victory: all werewolves (including White Wolf) are eliminated
  if (aliveWolves.length === 0 && aliveWhiteWolf.length === 0) {
    return {
      ...state,
      phase: 'GAME_OVER',
      winner: 'village',
      winnerPlayerIds: state.players
        .filter((p) => ROLES[p.role].camp === 'village')
        .map((p) => p.id),
    };
  }

  // 4. Werewolves victory: no villagers left AND no White Werewolf left to betray them
  if (aliveVillagers.length === 0 && aliveWhiteWolf.length === 0 && aliveWolves.length > 0) {
    return {
      ...state,
      phase: 'GAME_OVER',
      winner: 'werewolves',
      winnerPlayerIds: state.players
        .filter((p) => p.role === 'werewolf')
        .map((p) => p.id),
    };
  }

  return state;
}

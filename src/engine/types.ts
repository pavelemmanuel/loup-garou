export type Language = 'fr' | 'en';

export type RoleId =
  | 'villager'
  | 'werewolf'
  | 'white_wolf'
  | 'infect_father'
  | 'seer'
  | 'witch'
  | 'hunter'
  | 'cupid'
  | 'bodyguard'
  | 'little_girl'
  | 'thief'
  | 'elder'
  | 'idiot'
  | 'raven'
  | 'rusty_knight'
  | 'two_sisters'
  | 'bear_tamer';

export type CampId = 'village' | 'werewolves' | 'white_wolf' | 'lovers';

export interface RoleDefinition {
  id: RoleId;
  camp: 'village' | 'werewolves' | 'white_wolf';
  isExpansion?: boolean;
  accentColor: string;
  secondaryColor: string;
  nightOrder: number | null; // null if passive at night
  firstNightOnly?: boolean;
  everyOtherNight?: boolean;
  name: { fr: string; en: string };
  tagline: { fr: string; en: string };
  description: { fr: string; en: string };
  powerPrompt: { fr: string; en: string };
}

export interface Player {
  id: string;
  name: string;
  avatarIndex: number;
  role: RoleId;
  initialRole: RoleId;
  alive: boolean;
  isMayor: boolean;
  loverId: string | null;
  elderLives: number; // 2 for elder initially, 1 for others
  idiotRevealed: boolean; // true if Village Idiot survived a vote -> loses voting rights
  canVote: boolean;
  ravenCurves: number; // +2 votes against this player if targeted by Raven this night
}

export type GamePhase =
  | 'ROLE_DISTRIBUTION'
  | 'NIGHT_INTRO'
  | 'NIGHT_THIEF'
  | 'NIGHT_CUPID'
  | 'NIGHT_LOVERS'
  | 'NIGHT_TWO_SISTERS'
  | 'NIGHT_BODYGUARD'
  | 'NIGHT_RAVEN'
  | 'NIGHT_SEER'
  | 'NIGHT_WEREWOLVES'
  | 'NIGHT_INFECT_FATHER'
  | 'NIGHT_WHITE_WOLF'
  | 'NIGHT_WITCH'
  | 'DAWN_ANNOUNCEMENT'
  | 'HUNTER_REVENGE'
  | 'MAYOR_SUCCESSION'
  | 'MAYOR_ELECTION'
  | 'DAY_DISCUSSION'
  | 'DAY_VOTE'
  | 'GAME_OVER';

export interface ChronicleEvent {
  id: string;
  turn: number;
  timeOfDay: 'night' | 'day';
  icon: string;
  title: { fr: string; en: string };
  detail: { fr: string; en: string };
  highlightColor?: string;
}

export interface PendingDeath {
  playerId: string;
  reason: 'werewolves' | 'white_wolf' | 'witch_poison' | 'vote' | 'hunter' | 'heartbreak' | 'rusty_sword';
}

export interface NightState {
  thiefSwapped?: boolean;
  bodyguardTargetId: string | null;
  lastBodyguardTargetId: string | null;
  ravenTargetId: string | null;
  seerTargetId: string | null;
  seerRevealedRole: RoleId | null;
  werewolfTargetId: string | null;
  werewolfVotes: Record<string, string>; // voterId -> targetId
  infectVictim?: boolean;
  whiteWolfTargetId: string | null;
  witchSaved: boolean;
  witchPoisonTargetId: string | null;
}

export interface MatchConfig {
  mode: 'pass' | 'lan';
  rolesCount: Record<RoleId, number>;
  includeMayor: boolean;
  discussionSeconds: number;
}

export interface MatchState {
  id: string;
  config: MatchConfig;
  turn: number; // Starts at 1 (Night 1 -> Day 1)
  phase: GamePhase;
  players: Player[];
  thiefExtraCards: [RoleId, RoleId] | null;
  witchPotions: {
    healAvailable: boolean;
    poisonAvailable: boolean;
  };
  infectPowerAvailable: boolean; // Once per game for Infect Père des Loups
  pendingRustySwordTargetId: string | null; // Werewolf wounded by Rusty Knight, dies next dawn
  elderPowerLost: boolean; // True if Elder dies by village vote, Hunter, or Witch poison
  night: NightState;
  dawnDeaths: PendingDeath[];
  pendingHunterIds: string[];
  pendingMayorSuccessionFromId: string | null;
  returnPhaseAfterInterrupt: GamePhase | null;
  revealIndex: number; // Used during ROLE_DISTRIBUTION or Pass & Play turn passing
  activeNightActorIndex: number; // For multi-wolf pass & play
  votes: Record<string, string>; // voterId -> targetId (for Mayor election or Day Village Vote)
  mayorElectionDone: boolean;
  chronicles: ChronicleEvent[];
  winner: CampId | null;
  winnerPlayerIds: string[];
}

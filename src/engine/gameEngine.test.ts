import { describe, expect, it } from 'vitest';
import { ROLES, getRecommendedRoles } from '../data/rolesData';
import {
  acknowledgeLoversPhase,
  advanceAfterSeer,
  advanceFromRoleDistribution,
  applyBodyguardProtection,
  applyCupidLovers,
  applyHunterShot,
  applyRavenCurse,
  applyThiefChoice,
  applyWerewolvesTarget,
  applyWhiteWolfTarget,
  applyWitchDecision,
  createMatch,
  electMayor,
  inspectPlayerWithSeer,
  proceedAfterDawnOrInterrupt,
  resolveVillageVote,
  startDayVoting,
  startNightSequence,
} from './gameEngine';
import { MatchConfig, RoleId } from './types';

function makeEmptyRoleCounts(): Record<RoleId, number> {
  return {
    villager: 0,
    werewolf: 0,
    white_wolf: 0,
    seer: 0,
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
}

describe('Les Loups-Garous de Thiercelieux — Official Engine Rules', () => {
  it('defines all 13 bilingual FR/EN roles and balanced presets', () => {
    expect(Object.keys(ROLES)).toHaveLength(13);
    for (const def of Object.values(ROLES)) {
      expect(def.name.fr.length).toBeGreaterThan(2);
      expect(def.name.en.length).toBeGreaterThan(2);
      expect(def.description.fr.length).toBeGreaterThan(20);
      expect(def.description.en.length).toBeGreaterThan(20);
    }

    const preset8 = getRecommendedRoles(8);
    const total8 = Object.values(preset8).reduce((a, b) => a + b, 0);
    expect(total8).toBe(8);
    expect(preset8.werewolf).toBe(2);
  });

  it('handles Thief extra 2 cards and forced werewolf swap rule on Night 1', () => {
    const rolesCount = makeEmptyRoleCounts();
    rolesCount.thief = 1;
    rolesCount.werewolf = 3;
    rolesCount.villager = 2;

    // Deterministic RNG that keeps order intact so extra cards are the last 2
    const config: MatchConfig = {
      mode: 'pass',
      rolesCount,
      includeMayor: false,
      discussionSeconds: 120,
    };

    const match = createMatch(
      [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }],
      config,
      () => 0.99
    );

    expect(match.players).toHaveLength(4);
    expect(match.thiefExtraCards).not.toBeNull();
    expect(match.players.some((p) => p.role === 'thief')).toBe(true);

    // Advance to NIGHT_THIEF
    let s = match;
    while (s.phase === 'ROLE_DISTRIBUTION') {
      s = advanceFromRoleDistribution(s);
    }
    s = startNightSequence(s);
    expect(s.phase).toBe('NIGHT_THIEF');

    const chosenExtraRole = s.thiefExtraCards![0];
    s = applyThiefChoice(s, 0);
    // Thief has now swapped into chosenExtraRole
    expect(s.players.some((p) => p.initialRole === 'thief' && p.role === chosenExtraRole)).toBe(
      true
    );
  });

  it('links Cupid lovers and triggers heartbreak chain death when one lover dies', () => {
    const rolesCount = makeEmptyRoleCounts();
    rolesCount.cupid = 1;
    rolesCount.werewolf = 1;
    rolesCount.villager = 2;

    let s = createMatch(
      [{ name: 'Cupidon' }, { name: 'Loup' }, { name: 'Roméo' }, { name: 'Juliette' }],
      {
        mode: 'pass',
        rolesCount,
        includeMayor: false,
        discussionSeconds: 120,
      },
      () => 0.99
    );

    const cupid = s.players.find((p) => p.role === 'cupid')!;
    const wolf = s.players.find((p) => p.role === 'werewolf')!;
    const villagers = s.players.filter((p) => p.role === 'villager');

    s = { ...s, phase: 'NIGHT_INTRO' };
    s = startNightSequence(s);
    expect(s.phase).toBe('NIGHT_CUPID');

    // Cupid links the two villagers (or cupid + villager)
    const lover1 = cupid.id;
    const lover2 = villagers[0].id;
    s = applyCupidLovers(s, lover1, lover2);
    expect(s.phase).toBe('NIGHT_LOVERS');

    s = acknowledgeLoversPhase(s);
    expect(s.phase).toBe('NIGHT_WEREWOLVES');

    // Werewolves devour lover1 -> lover2 also dies of heartbreak at dawn!
    s = applyWerewolvesTarget(s, lover1);
    expect(s.phase).toBe('DAWN_ANNOUNCEMENT');
    expect(s.dawnDeaths).toHaveLength(2);
    expect(s.players.find((p) => p.id === lover1)?.alive).toBe(false);
    expect(s.players.find((p) => p.id === lover2)?.alive).toBe(false);
    expect(wolf.alive).toBe(true);
  });

  it('enforces Bodyguard shield, Elder 2-lives against wolves, and Witch potions', () => {
    const rolesCount = makeEmptyRoleCounts();
    rolesCount.werewolf = 1;
    rolesCount.bodyguard = 1;
    rolesCount.witch = 1;
    rolesCount.elder = 1;

    let s = createMatch(
      [{ name: 'Wolf' }, { name: 'Guard' }, { name: 'Witch' }, { name: 'Elder' }],
      {
        mode: 'pass',
        rolesCount,
        includeMayor: false,
        discussionSeconds: 120,
      },
      () => 0.99
    );

    const elder = s.players.find((p) => p.role === 'elder')!;
    const guard = s.players.find((p) => p.role === 'bodyguard')!;

    s = { ...s, phase: 'NIGHT_INTRO' };
    s = startNightSequence(s);
    expect(s.phase).toBe('NIGHT_BODYGUARD');

    // Bodyguard protects himself
    s = applyBodyguardProtection(s, guard.id);
    expect(s.phase).toBe('NIGHT_WEREWOLVES');

    // Wolves bite the Elder (who is NOT protected by Bodyguard, but has 2 lives!)
    s = applyWerewolvesTarget(s, elder.id);
    expect(s.phase).toBe('NIGHT_WITCH');

    // Witch passes both potions
    s = applyWitchDecision(s, { useHeal: false, poisonTargetId: null });
    expect(s.phase).toBe('DAWN_ANNOUNCEMENT');

    // Elder survives with 1 life remaining!
    expect(s.dawnDeaths).toHaveLength(0);
    expect(s.players.find((p) => p.id === elder.id)?.alive).toBe(true);
    expect(s.players.find((p) => p.id === elder.id)?.elderLives).toBe(1);
  });

  it('pardons the Village Idiot on village execution vote and removes their voting right', () => {
    const rolesCount = makeEmptyRoleCounts();
    rolesCount.werewolf = 1;
    rolesCount.idiot = 1;
    rolesCount.villager = 2;

    let s = createMatch(
      [{ name: 'Wolf' }, { name: 'Idiot' }, { name: 'V1' }, { name: 'V2' }],
      {
        mode: 'pass',
        rolesCount,
        includeMayor: false,
        discussionSeconds: 120,
      },
      () => 0.99
    );

    const idiot = s.players.find((p) => p.role === 'idiot')!;
    s = { ...s, phase: 'DAY_VOTE' };
    s = resolveVillageVote(s, idiot.id);

    const updatedIdiot = s.players.find((p) => p.id === idiot.id)!;
    expect(updatedIdiot.alive).toBe(true);
    expect(updatedIdiot.idiotRevealed).toBe(true);
    expect(updatedIdiot.canVote).toBe(false);
  });

  it('triggers Hunter dying revenge shot and detects Village victory when the last wolf is shot', () => {
    const rolesCount = makeEmptyRoleCounts();
    rolesCount.werewolf = 1;
    rolesCount.hunter = 1;
    rolesCount.villager = 2;

    let s = createMatch(
      [{ name: 'Wolf' }, { name: 'Hunter' }, { name: 'V1' }, { name: 'V2' }],
      {
        mode: 'pass',
        rolesCount,
        includeMayor: false,
        discussionSeconds: 120,
      },
      () => 0.99
    );

    const wolf = s.players.find((p) => p.role === 'werewolf')!;
    const hunter = s.players.find((p) => p.role === 'hunter')!;

    s = { ...s, phase: 'NIGHT_WEREWOLVES' };
    s = applyWerewolvesTarget(s, hunter.id);
    expect(s.phase).toBe('DAWN_ANNOUNCEMENT');

    s = proceedAfterDawnOrInterrupt(s);
    expect(s.phase).toBe('HUNTER_REVENGE');

    // Hunter shoots the Werewolf!
    s = applyHunterShot(s, wolf.id);
    expect(s.phase).toBe('GAME_OVER');
    expect(s.winner).toBe('village');
  });
});

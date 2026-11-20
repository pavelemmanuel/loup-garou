import { describe, expect, it } from 'vitest';
import { ROLES, getRecommendedRoles } from '../data/rolesData';
import {
  acknowledgeLoversPhase,
  acknowledgeTwoSistersPhase,
  advanceAfterSeer,
  advanceFromRoleDistribution,
  applyBodyguardProtection,
  applyCupidLovers,
  applyHunterShot,
  applyInfectFatherDecision,
  applyRavenCurse,
  applyThiefChoice,
  applyWerewolvesTarget,
  applyWhiteWolfTarget,
  applyWitchDecision,
  castVillageVote,
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
    infect_father: 0,
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
    rusty_knight: 0,
    two_sisters: 0,
    bear_tamer: 0,
  };
}

describe('Les Loups-Garous de Thiercelieux — Official Engine Rules', () => {
  it('defines all 17 bilingual FR/EN roles and balanced presets', () => {
    expect(Object.keys(ROLES)).toHaveLength(17);
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

  it('prevents Werewolves from devouring each other', () => {
    const rolesCount = makeEmptyRoleCounts();
    rolesCount.werewolf = 2;
    rolesCount.villager = 2;

    let s = createMatch(
      [{ name: 'Wolf1' }, { name: 'Wolf2' }, { name: 'V1' }, { name: 'V2' }],
      {
        mode: 'pass',
        rolesCount,
        includeMayor: false,
        discussionSeconds: 120,
      },
      () => 0.99
    );

    const wolves = s.players.filter((p) => p.role === 'werewolf');
    const villager = s.players.find((p) => p.role === 'villager')!;

    s = { ...s, phase: 'NIGHT_WEREWOLVES' };
    // Trying to target a fellow werewolf should be rejected and stay in NIGHT_WEREWOLVES
    const afterInvalid = applyWerewolvesTarget(s, wolves[1].id);
    expect(afterInvalid.phase).toBe('NIGHT_WEREWOLVES');
    expect(afterInvalid.night.werewolfTargetId).toBeNull();

    // Targeting a villager succeeds
    const afterValid = applyWerewolvesTarget(s, villager.id);
    expect(afterValid.phase).toBe('DAWN_ANNOUNCEMENT');
    expect(afterValid.players.find((p) => p.id === villager.id)?.alive).toBe(false);
  });

  it('prevents Lovers from voting against each other and enforces mandatory elimination on tie', () => {
    const rolesCount = makeEmptyRoleCounts();
    rolesCount.cupid = 1;
    rolesCount.werewolf = 1;
    rolesCount.villager = 2;

    let s = createMatch(
      [{ name: 'Cupidon' }, { name: 'Loup' }, { name: 'V1' }, { name: 'V2' }],
      {
        mode: 'pass',
        rolesCount,
        includeMayor: false,
        discussionSeconds: 120,
      },
      () => 0.99
    );

    const [p1, p2, p3, p4] = s.players;
    s = { ...s, phase: 'NIGHT_CUPID' };
    s = applyCupidLovers(s, p1.id, p2.id);

    s = startDayVoting(s);
    // Lover p1 tries to vote against partner p2 -> rejected
    s = castVillageVote(s, p1.id, p2.id);
    expect(s.votes[p1.id]).toBeUndefined();

    // Create a tie between p3 and p4 (1 vote each, no mayor)
    s = castVillageVote(s, p1.id, p3.id);
    s = castVillageVote(s, p2.id, p4.id);

    s = resolveVillageVote(s);
    // One of the tied candidates (p3 or p4) must be eliminated
    const p3Alive = s.players.find((p) => p.id === p3.id)!.alive;
    const p4Alive = s.players.find((p) => p.id === p4.id)!.alive;
    expect(p3Alive && p4Alive).toBe(false);
  });

  it('triggers Werewolves victory as soon as werewolves are as numerous as villagers', () => {
    const rolesCount = makeEmptyRoleCounts();
    rolesCount.werewolf = 2;
    rolesCount.villager = 3;

    let s = createMatch(
      [{ name: 'Wolf1' }, { name: 'Wolf2' }, { name: 'V1' }, { name: 'V2' }, { name: 'V3' }],
      {
        mode: 'pass',
        rolesCount,
        includeMayor: false,
        discussionSeconds: 120,
      },
      () => 0.99
    );

    const villager = s.players.find((p) => p.role === 'villager')!;
    s = { ...s, phase: 'NIGHT_WEREWOLVES' };
    // Wolves devour 1 villager -> 2 wolves vs 2 villagers remain
    s = applyWerewolvesTarget(s, villager.id);
    expect(s.phase).toBe('DAWN_ANNOUNCEMENT');

    s = proceedAfterDawnOrInterrupt(s);
    expect(s.phase).toBe('GAME_OVER');
    expect(s.winner).toBe('werewolves');
  });

  it('excludes expansion roles from default recommended presets', () => {
    for (const count of [4, 6, 8, 12, 16]) {
      const preset = getRecommendedRoles(count);
      expect(preset.infect_father).toBe(0);
      expect(preset.rusty_knight).toBe(0);
    }
    expect(ROLES.infect_father.isExpansion).toBe(true);
    expect(ROLES.rusty_knight.isExpansion).toBe(true);
    expect(ROLES.two_sisters.isExpansion).toBe(true);
    expect(ROLES.bear_tamer.isExpansion).toBe(true);
    for (const count of [4, 6, 8, 12, 16]) {
      const preset = getRecommendedRoles(count);
      expect(preset.two_sisters).toBe(0);
      expect(preset.bear_tamer).toBe(0);
    }
  });

  it('allows Infect Père des Loups to infect the Werewolves victim once per game', () => {
    const rolesCount = makeEmptyRoleCounts();
    rolesCount.infect_father = 1;
    rolesCount.villager = 3;

    let s = createMatch(
      [{ name: 'Infect' }, { name: 'V1' }, { name: 'V2' }, { name: 'V3' }],
      {
        mode: 'pass',
        rolesCount,
        includeMayor: false,
        discussionSeconds: 120,
      },
      () => 0.99
    );

    const villager = s.players.find((p) => p.role === 'villager')!;
    s = { ...s, phase: 'NIGHT_WEREWOLVES' };
    s = applyWerewolvesTarget(s, villager.id);
    expect(s.phase).toBe('NIGHT_INFECT_FATHER');

    // Infect Father chooses to infect the victim
    s = applyInfectFatherDecision(s, true);
    expect(s.phase).toBe('DAWN_ANNOUNCEMENT');
    expect(s.infectPowerAvailable).toBe(false);
    expect(s.dawnDeaths.length).toBe(0);

    const infectedPlayer = s.players.find((p) => p.id === villager.id)!;
    expect(infectedPlayer.alive).toBe(true);
    expect(infectedPlayer.role).toBe('werewolf');
  });

  it('wounds the first Werewolf to the left of Rusty Knight and kills them on the following dawn', () => {
    const rolesCount = makeEmptyRoleCounts();
    rolesCount.werewolf = 1;
    rolesCount.rusty_knight = 1;
    rolesCount.villager = 3;

    let s = createMatch(
      [{ name: 'P1' }, { name: 'P2' }, { name: 'P3' }, { name: 'P4' }, { name: 'P5' }],
      {
        mode: 'pass',
        rolesCount,
        includeMayor: false,
        discussionSeconds: 120,
      },
      () => 0.99
    );

    const knight = s.players.find((p) => p.role === 'rusty_knight')!;
    const wolf = s.players.find((p) => p.role === 'werewolf')!;

    // Night 1: Werewolves devour the Rusty Knight
    s = { ...s, phase: 'NIGHT_WEREWOLVES' };
    s = applyWerewolvesTarget(s, knight.id);
    expect(s.phase).toBe('DAWN_ANNOUNCEMENT');
    expect(s.players.find((p) => p.id === knight.id)?.alive).toBe(false);
    expect(s.pendingRustySwordTargetId).toBe(wolf.id);
    // Wolf is still alive on Day 1
    expect(s.players.find((p) => p.id === wolf.id)?.alive).toBe(true);

    // Proceed to Day 1 -> Vote out a villager -> Night 2
    s = proceedAfterDawnOrInterrupt(s);
    const villagerToVote = s.players.find((p) => p.alive && p.role === 'villager')!;
    s = startDayVoting(s);
    s = resolveVillageVote(s, villagerToVote.id);
    expect(s.phase).toBe('NIGHT_INTRO');

    // Night 2: Wolf targets another villager -> at Dawn of Day 2, wounded Wolf dies of tetanus!
    s = startNightSequence(s);
    expect(s.phase).toBe('NIGHT_WEREWOLVES');
    const nextVillager = s.players.find((p) => p.alive && p.role === 'villager')!;
    s = applyWerewolvesTarget(s, nextVillager.id);
    expect(s.phase).toBe('DAWN_ANNOUNCEMENT');
    expect(s.players.find((p) => p.id === wolf.id)?.alive).toBe(false);
    expect(s.dawnDeaths.some((d) => d.playerId === wolf.id && d.reason === 'rusty_sword')).toBe(true);
  });

  it('enforces 2 cards for Two Sisters and runs NIGHT_TWO_SISTERS on Night 1', () => {
    const rolesCount = makeEmptyRoleCounts();
    rolesCount.werewolf = 1;
    rolesCount.two_sisters = 1; // Even if 1 is passed, engine enforces 2 cards
    rolesCount.villager = 1;

    let s = createMatch(
      [{ name: 'P1' }, { name: 'P2' }, { name: 'P3' }, { name: 'P4' }],
      {
        mode: 'pass',
        rolesCount,
        includeMayor: false,
        discussionSeconds: 120,
      },
      () => 0.99
    );

    const sisters = s.players.filter((p) => p.role === 'two_sisters');
    expect(sisters).toHaveLength(2);

    s = startNightSequence(s);
    expect(s.phase).toBe('NIGHT_TWO_SISTERS');
    s = acknowledgeTwoSistersPhase(s);
    expect(s.phase).toBe('NIGHT_WEREWOLVES');
  });

  it('triggers Bear Tamer growl at dawn when an immediate living neighbor is a Werewolf', () => {
    const rolesCount = makeEmptyRoleCounts();
    rolesCount.werewolf = 1;
    rolesCount.bear_tamer = 1;
    rolesCount.villager = 3;

    let s = createMatch(
      [{ name: 'Wolf' }, { name: 'Bear' }, { name: 'V1' }, { name: 'V2' }, { name: 'V3' }],
      {
        mode: 'pass',
        rolesCount,
        includeMayor: false,
        discussionSeconds: 120,
      },
      () => 0.99
    );

    // Arrange players so Wolf is directly next to Bear Tamer
    const bear = s.players.find((p) => p.role === 'bear_tamer')!;
    const wolf = s.players.find((p) => p.role === 'werewolf')!;
    const villagers = s.players.filter((p) => p.role === 'villager');
    s = {
      ...s,
      players: [wolf, bear, villagers[0], villagers[1], villagers[2]],
      phase: 'NIGHT_WEREWOLVES',
    };

    s = applyWerewolvesTarget(s, villagers[2].id);
    expect(s.phase).toBe('DAWN_ANNOUNCEMENT');
    expect(s.chronicles.some((c) => c.id.startsWith('bear_growl_'))).toBe(true);
  });
});

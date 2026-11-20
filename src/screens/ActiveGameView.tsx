import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { soundFX } from '../audio/soundFX';
import { RoleArtwork } from '../components/RoleArtwork';
import { TarotRoleCard } from '../components/TarotRoleCard';
import { VillageSkyBackdrop } from '../components/VillageSkyBackdrop';
import { VillagerSelectionGrid } from '../components/VillagerSelectionGrid';
import { ROLES, ROLE_ORDER, getRecommendedRoles } from '../data/rolesData';
import {
  acknowledgeLoversPhase,
  advanceAfterSeer,
  advanceFromRoleDistribution,
  applyBodyguardProtection,
  applyCupidLovers,
  applyHunterShot,
  applyMayorSuccessor,
  applyRavenCurse,
  applyThiefChoice,
  applyWerewolvesTarget,
  applyWhiteWolfTarget,
  applyWitchDecision,
  castVillageVote,
  createMatch,
  electMayor,
  inspectPlayerWithSeer,
  isWerewolfCamp,
  proceedAfterDawnOrInterrupt,
  resolveVillageVote,
  startDayVoting,
  startNightSequence,
} from '../engine/gameEngine';
import {
  GamePhase,
  Language,
  MatchConfig,
  MatchState,
  Player,
  RoleId,
} from '../engine/types';
import { TRANSLATIONS } from '../i18n/translations';
import { LanRoomMember, lanSync } from '../lan/lanSync';

const AVATAR_EMBLEMS = ['🧑‍🌾', '🧙‍♀️', '🏹', '⚒️', '🕯️', '🎻', '🗡️', '🛡️', '🌿', '🦊', '🦉', '🏰'];

interface ActiveGameViewProps {
  match: MatchState;
  onUpdateMatch: (next: MatchState) => void;
  onRestartSameVillage: () => void;
  onExitToLobby: () => void;
  lang: Language;
  onToggleLang: () => void;
  /** In LAN mode, non-host client devices pass their own localPlayerId */
  localPlayerId?: string | null;
  isLanHost?: boolean;
  onSendLanClientAction?: (
    action:
      | { kind: 'thief'; cardIndex: 0 | 1 | null }
      | { kind: 'cupid'; loverAId: string; loverBId: string }
      | { kind: 'bodyguard'; targetId: string }
      | { kind: 'raven'; targetId: string | null }
      | { kind: 'seer'; targetId: string }
      | { kind: 'werewolf'; targetId: string }
      | { kind: 'white_wolf'; targetId: string | null }
      | { kind: 'witch'; useHeal: boolean; poisonTargetId: string | null }
      | { kind: 'hunter'; targetId: string }
      | { kind: 'mayor_successor'; targetId: string }
      | { kind: 'day_vote'; targetId: string }
  ) => void;
}

export const ActiveGameView: React.FC<ActiveGameViewProps> = ({
  match,
  onUpdateMatch,
  onRestartSameVillage,
  onExitToLobby,
  lang,
  onToggleLang,
  localPlayerId = null,
  isLanHost = true,
  onSendLanClientAction,
}) => {
  const t = TRANSLATIONS[lang];

  // Role distribution card reveal state
  const [cardRevealed, setCardRevealed] = useState(false);

  // Pass & Play night privacy screen ("Awaken Role X")
  const [nightRoleAwake, setNightRoleAwake] = useState(false);

  // Night selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [witchUseHeal, setWitchUseHeal] = useState(false);
  const [witchPoisonTargetId, setWitchPoisonTargetId] = useState<string | null>(null);
  const [littleGirlClue, setLittleGirlClue] = useState<string | null>(null);

  // Daytime discussion countdown timer
  const [secondsLeft, setSecondsLeft] = useState(match.config.discussionSeconds);

  // Bottom tab for Chronicles / Survivors
  const [activeBottomTab, setActiveBottomTab] = useState<'chronicles' | 'players'>('chronicles');

  // Reset per-phase local UI states whenever phase or turn changes
  useEffect(() => {
    setCardRevealed(false);
    setNightRoleAwake(false);
    setSelectedIds([]);
    setWitchUseHeal(false);
    setWitchPoisonTargetId(null);
    setLittleGirlClue(null);

    if (match.phase === 'DAY_DISCUSSION') {
      setSecondsLeft(match.config.discussionSeconds);
      soundFX.playCouncilBell();
    } else if (match.phase === 'DAWN_ANNOUNCEMENT') {
      soundFX.playRoosterDawn();
    } else if (match.phase === 'NIGHT_WEREWOLVES' || match.phase === 'NIGHT_WHITE_WOLF') {
      soundFX.playWolfHowl();
    } else if (match.phase === 'HUNTER_REVENGE') {
      soundFX.playHunterShot();
    }
  }, [match.phase, match.turn, match.revealIndex, match.config.discussionSeconds]);

  // Countdown timer during DAY_DISCUSSION
  useEffect(() => {
    if (match.phase !== 'DAY_DISCUSSION') return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [match.phase]);

  const skyMode: 'night' | 'dawn' | 'day' | 'blood' =
    match.phase === 'DAWN_ANNOUNCEMENT'
      ? 'dawn'
      : match.phase === 'NIGHT_WEREWOLVES' ||
        match.phase === 'NIGHT_WHITE_WOLF' ||
        match.phase === 'HUNTER_REVENGE'
      ? 'blood'
      : match.phase === 'MAYOR_ELECTION' ||
        match.phase === 'DAY_DISCUSSION' ||
        match.phase === 'DAY_VOTE' ||
        match.phase === 'MAYOR_SUCCESSION'
      ? 'day'
      : 'night';

  const toggleSelectOne = (id: string) => {
    soundFX.triggerHaptic('light');
    setSelectedIds((prev) => (prev.includes(id) ? [] : [id]));
  };

  const toggleSelectTwo = (id: string) => {
    soundFX.triggerHaptic('light');
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  // Identify current night actor role
  const getPhaseRole = (phase: GamePhase): RoleId | null => {
    switch (phase) {
      case 'NIGHT_THIEF':
        return 'thief';
      case 'NIGHT_CUPID':
        return 'cupid';
      case 'NIGHT_BODYGUARD':
        return 'bodyguard';
      case 'NIGHT_RAVEN':
        return 'raven';
      case 'NIGHT_SEER':
        return 'seer';
      case 'NIGHT_WEREWOLVES':
        return 'werewolf';
      case 'NIGHT_WHITE_WOLF':
        return 'white_wolf';
      case 'NIGHT_WITCH':
        return 'witch';
      default:
        return null;
    }
  };

  const currentPhaseRole = getPhaseRole(match.phase);

  // Little Girl nocturnal peek helper
  const handleLittleGirlPeek = () => {
    soundFX.triggerHaptic('medium');
    const aliveWolves = match.players.filter((p) => p.alive && isWerewolfCamp(p.role));
    if (aliveWolves.length === 0) return;
    const randomWolf = aliveWolves[Math.floor(Math.random() * aliveWolves.length)];
    const firstLetter = randomWolf.name.charAt(0).toUpperCase();
    const clue =
      lang === 'fr'
        ? `Vous apercevez une silhouette dont le nom commence par « ${firstLetter} »...`
        : `You glimpse a shadowy figure whose name begins with "${firstLetter}"...`;
    setLittleGirlClue(clue);
  };

  // LAN Client Dedicated View (when playing on separate phones in Wi-Fi room)
  const localPlayer = localPlayerId
    ? match.players.find((p) => p.id === localPlayerId) || null
    : null;

  if (match.config.mode === 'lan' && localPlayer && !isLanHost) {
    const isMyNightTurn =
      (match.phase === 'NIGHT_THIEF' && localPlayer.role === 'thief') ||
      (match.phase === 'NIGHT_CUPID' && localPlayer.role === 'cupid') ||
      (match.phase === 'NIGHT_BODYGUARD' && localPlayer.role === 'bodyguard') ||
      (match.phase === 'NIGHT_RAVEN' && localPlayer.role === 'raven') ||
      (match.phase === 'NIGHT_SEER' && localPlayer.role === 'seer') ||
      (match.phase === 'NIGHT_WEREWOLVES' && isWerewolfCamp(localPlayer.role)) ||
      (match.phase === 'NIGHT_WHITE_WOLF' && localPlayer.role === 'white_wolf') ||
      (match.phase === 'NIGHT_WITCH' && localPlayer.role === 'witch');

    return (
      <VillageSkyBackdrop mode={skyMode}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.topBar}>
            <Text style={styles.phasePill}>
              {match.phase.startsWith('NIGHT')
                ? `🌙 ${t.nightTitle(match.turn)}`
                : `☀️ ${t.dayTitle(match.turn)}`}
            </Text>
            <Pressable onPress={onToggleLang} style={styles.langPill}>
              <Text style={styles.langPillText}>{lang.toUpperCase()}</Text>
            </Pressable>
          </View>

          <Text style={styles.screenHeading}>{localPlayer.name}</Text>

          <TarotRoleCard
            role={localPlayer.role}
            lang={lang}
            revealed={cardRevealed}
            onPress={() => {
              soundFX.playCardFlip();
              setCardRevealed((r) => !r);
            }}
            playerName={localPlayer.name}
            compact
          />

          {isMyNightTurn && localPlayer.alive && onSendLanClientAction && (
            <View style={styles.panelCard}>
              <Text style={styles.panelTitle}>
                {t.wakeUpCall(ROLES[localPlayer.role].name[lang])}
              </Text>
              <VillagerSelectionGrid
                players={match.players}
                selectedIds={selectedIds}
                disabledIds={
                  match.phase === 'NIGHT_BODYGUARD' && match.night.lastBodyguardTargetId
                    ? [match.night.lastBodyguardTargetId]
                    : []
                }
                onTogglePlayer={
                  match.phase === 'NIGHT_CUPID' ? toggleSelectTwo : toggleSelectOne
                }
                lang={lang}
              />
              {selectedIds.length > 0 && (
                <Pressable
                  style={styles.primaryBtn}
                  onPress={() => {
                    if (match.phase === 'NIGHT_CUPID' && selectedIds.length === 2) {
                      onSendLanClientAction({
                        kind: 'cupid',
                        loverAId: selectedIds[0],
                        loverBId: selectedIds[1],
                      });
                    } else if (match.phase === 'NIGHT_BODYGUARD') {
                      onSendLanClientAction({
                        kind: 'bodyguard',
                        targetId: selectedIds[0],
                      });
                    } else if (match.phase === 'NIGHT_RAVEN') {
                      onSendLanClientAction({
                        kind: 'raven',
                        targetId: selectedIds[0],
                      });
                    } else if (match.phase === 'NIGHT_SEER') {
                      onSendLanClientAction({
                        kind: 'seer',
                        targetId: selectedIds[0],
                      });
                    } else if (match.phase === 'NIGHT_WEREWOLVES') {
                      onSendLanClientAction({
                        kind: 'werewolf',
                        targetId: selectedIds[0],
                      });
                    } else if (match.phase === 'NIGHT_WHITE_WOLF') {
                      onSendLanClientAction({
                        kind: 'white_wolf',
                        targetId: selectedIds[0],
                      });
                    }
                    setSelectedIds([]);
                  }}
                >
                  <Text style={styles.primaryBtnText}>{t.confirmActionBtn}</Text>
                </Pressable>
              )}
            </View>
          )}

          {match.phase === 'DAY_VOTE' && localPlayer.alive && localPlayer.canVote && onSendLanClientAction && (
            <View style={styles.panelCard}>
              <Text style={styles.panelTitle}>{t.councilVoteTitle}</Text>
              <VillagerSelectionGrid
                players={match.players}
                selectedIds={selectedIds}
                onTogglePlayer={toggleSelectOne}
                lang={lang}
              />
              {selectedIds.length === 1 && (
                <Pressable
                  style={styles.primaryBtn}
                  onPress={() => {
                    onSendLanClientAction({
                      kind: 'day_vote',
                      targetId: selectedIds[0],
                    });
                  }}
                >
                  <Text style={styles.primaryBtnText}>{t.confirmActionBtn}</Text>
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>
      </VillageSkyBackdrop>
    );
  }

  // ============================================================================
  // MAIN PASS & PLAY / HOST TABLETOP VIEW
  // ============================================================================
  const currentRevealPlayer: Player | undefined =
    match.players[match.revealIndex];

  // Calculate current day vote tallies
  const voteCounts: Record<string, number> = {};
  for (const p of match.players) {
    if (p.alive && p.ravenCurves > 0) {
      voteCounts[p.id] = (voteCounts[p.id] || 0) + p.ravenCurves;
    }
  }
  for (const [voterId, targetId] of Object.entries(match.votes)) {
    const voter = match.players.find((x) => x.id === voterId);
    const weight = voter?.isMayor ? 2 : 1;
    voteCounts[targetId] = (voteCounts[targetId] || 0) + weight;
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <VillageSkyBackdrop mode={skyMode}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <Pressable onPress={onExitToLobby} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>⬅ {t.backBtn}</Text>
          </Pressable>

          <View style={styles.turnBadge}>
            <Text style={styles.turnBadgeText}>
              {skyMode === 'day' || skyMode === 'dawn'
                ? `☀️ ${t.dayTitle(match.turn)}`
                : `🌕 ${t.nightTitle(match.turn)}`}
            </Text>
          </View>

          <Pressable onPress={onToggleLang} style={styles.langPill}>
            <Text style={styles.langPillText}>
              {lang === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN'}
            </Text>
          </Pressable>
        </View>

        {/* PHASE 1: SECRET TAROT ROLE DISTRIBUTION */}
        {match.phase === 'ROLE_DISTRIBUTION' && currentRevealPlayer && (
          <View style={styles.centerSection}>
            <Text style={styles.passLabel}>
              {t.passDeviceTo} ({match.revealIndex + 1}/{match.players.length})
            </Text>
            <Text style={styles.heroPlayerName}>{currentRevealPlayer.name}</Text>

            <TarotRoleCard
              role={currentRevealPlayer.role}
              lang={lang}
              revealed={cardRevealed}
              playerName={currentRevealPlayer.name}
              onPress={() => {
                soundFX.playCardFlip();
                setCardRevealed((prev) => !prev);
              }}
            />

            {cardRevealed && (
              <Pressable
                style={styles.primaryBtn}
                onPress={() => {
                  soundFX.playCardFlip();
                  setCardRevealed(false);
                  onUpdateMatch(advanceFromRoleDistribution(match));
                }}
              >
                <Text style={styles.primaryBtnText}>
                  {match.revealIndex + 1 < match.players.length
                    ? `${t.memorizeAndHideBtn} → ${t.nextPlayerBtn}`
                    : t.enterTheNightBtn}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* PHASE 2: NIGHT INTRO ("The Village Falls Asleep") */}
        {match.phase === 'NIGHT_INTRO' && (
          <View style={styles.panelCard}>
            <Text style={styles.bigEmoji}>🌑</Text>
            <Text style={styles.screenHeading}>{t.villageSleepsTitle}</Text>
            <Text style={styles.subtitleText}>{t.villageSleepsSub}</Text>

            <Pressable
              style={styles.primaryBtn}
              onPress={() => {
                soundFX.playWolfHowl();
                const next = startNightSequence(match);
                onUpdateMatch(next);
              }}
            >
              <Text style={styles.primaryBtnText}>{t.awakenNextRoleBtn}</Text>
            </Pressable>
          </View>
        )}

        {/* NIGHT ROLE INTERSTITIAL PRIVACY GATE (Before waking each role in Pass & Play) */}
        {currentPhaseRole && !nightRoleAwake && (
          <View style={styles.panelCard}>
            <RoleArtwork role={currentPhaseRole} size={130} />
            <Text style={styles.screenHeading}>
              {t.wakeUpCall(ROLES[currentPhaseRole].name[lang])}
            </Text>
            <Text style={styles.subtitleText}>
              {ROLES[currentPhaseRole].powerPrompt[lang]}
            </Text>

            {/* Show who holds this role (pass-device helper) */}
            <View style={styles.actorsChipRow}>
              {match.players
                .filter((p) =>
                  currentPhaseRole === 'werewolf'
                    ? p.alive && isWerewolfCamp(p.role)
                    : p.alive && p.role === currentPhaseRole
                )
                .map((actor) => (
                  <View
                    key={actor.id}
                    style={[
                      styles.actorChip,
                      { borderColor: ROLES[currentPhaseRole].accentColor },
                    ]}
                  >
                    <Text style={styles.actorChipText}>
                      {AVATAR_EMBLEMS[actor.avatarIndex % AVATAR_EMBLEMS.length]} {actor.name}
                    </Text>
                  </View>
                ))}
            </View>

            <Pressable
              style={[
                styles.primaryBtn,
                { backgroundColor: ROLES[currentPhaseRole].accentColor },
              ]}
              onPress={() => {
                soundFX.playCardFlip();
                soundFX.speakNarrator(
                  t.wakeUpCall(ROLES[currentPhaseRole].name[lang]),
                  lang
                );
                setNightRoleAwake(true);
              }}
            >
              <Text style={styles.primaryBtnText}>
                👁️ {ROLES[currentPhaseRole].name[lang].toUpperCase()}
              </Text>
            </Pressable>
          </View>
        )}

        {/* NIGHT: THIEF (LE VOLEUR) */}
        {match.phase === 'NIGHT_THIEF' && nightRoleAwake && match.thiefExtraCards && (
          <View style={styles.panelCard}>
            <Text style={styles.panelTitle}>{ROLES.thief.name[lang]}</Text>
            <Text style={styles.subtitleText}>{t.thiefPrompt}</Text>

            <View style={styles.thiefCardsRow}>
              {match.thiefExtraCards.map((extraRole, idx) => (
                <Pressable
                  key={idx}
                  style={styles.thiefChoiceCard}
                  onPress={() => {
                    soundFX.playCardFlip();
                    onUpdateMatch(applyThiefChoice(match, idx as 0 | 1));
                  }}
                >
                  <RoleArtwork role={extraRole} size={86} />
                  <Text style={styles.thiefRoleTitle}>
                    {ROLES[extraRole].name[lang]}
                  </Text>
                  <Text
                    style={[
                      styles.thiefSelectLabel,
                      { color: ROLES[extraRole].accentColor },
                    ]}
                  >
                    {t.confirmActionBtn}
                  </Text>
                </Pressable>
              ))}
            </View>

            {isWerewolfCamp(match.thiefExtraCards[0]) &&
            isWerewolfCamp(match.thiefExtraCards[1]) ? (
              <Text style={styles.warningBanner}>{t.thiefForcedWolf}</Text>
            ) : (
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => onUpdateMatch(applyThiefChoice(match, null))}
              >
                <Text style={styles.secondaryBtnText}>{t.thiefKeepCurrent}</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* NIGHT: CUPID (CUPIDON) */}
        {match.phase === 'NIGHT_CUPID' && nightRoleAwake && (
          <View style={styles.panelCard}>
            <Text style={styles.panelTitle}>💘 {ROLES.cupid.name[lang]}</Text>
            <Text style={styles.subtitleText}>{t.cupidPrompt}</Text>

            <VillagerSelectionGrid
              players={match.players}
              selectedIds={selectedIds}
              onTogglePlayer={toggleSelectTwo}
              lang={lang}
              accentColor={ROLES.cupid.accentColor}
            />

            <Pressable
              disabled={selectedIds.length !== 2}
              style={[
                styles.primaryBtn,
                { backgroundColor: ROLES.cupid.accentColor },
                selectedIds.length !== 2 && styles.btnDisabled,
              ]}
              onPress={() => {
                if (selectedIds.length === 2) {
                  soundFX.triggerHaptic('success');
                  onUpdateMatch(
                    applyCupidLovers(match, selectedIds[0], selectedIds[1])
                  );
                }
              }}
            >
              <Text style={styles.primaryBtnText}>
                💘 {t.confirmActionBtn} ({selectedIds.length}/2)
              </Text>
            </Pressable>
          </View>
        )}

        {/* NIGHT: LOVERS RECOGNITION (LES AMOUREUX) */}
        {match.phase === 'NIGHT_LOVERS' && (
          <View style={styles.panelCard}>
            <Text style={styles.bigEmoji}>💘</Text>
            <Text style={styles.screenHeading}>{t.loversWakeTitle}</Text>
            <Text style={styles.subtitleText}>{t.loversWakeSub}</Text>

            <View style={styles.actorsChipRow}>
              {match.players
                .filter((p) => p.loverId !== null)
                .map((lover) => (
                  <View
                    key={lover.id}
                    style={[styles.actorChip, { borderColor: '#EC4899' }]}
                  >
                    <Text style={styles.actorChipText}>
                      💖 {lover.name}
                    </Text>
                  </View>
                ))}
            </View>

            <Pressable
              style={[styles.primaryBtn, { backgroundColor: '#EC4899' }]}
              onPress={() => onUpdateMatch(acknowledgeLoversPhase(match))}
            >
              <Text style={styles.primaryBtnText}>{t.awakenNextRoleBtn}</Text>
            </Pressable>
          </View>
        )}

        {/* NIGHT: BODYGUARD (LE SALVATEUR) */}
        {match.phase === 'NIGHT_BODYGUARD' && nightRoleAwake && (
          <View style={styles.panelCard}>
            <Text style={styles.panelTitle}>🛡️ {ROLES.bodyguard.name[lang]}</Text>
            <Text style={styles.subtitleText}>{t.bodyguardPrompt}</Text>
            {match.night.lastBodyguardTargetId && (
              <Text style={styles.infoNote}>
                ⚠️ {t.bodyguardCannotRepeat} :{' '}
                {
                  match.players.find(
                    (p) => p.id === match.night.lastBodyguardTargetId
                  )?.name
                }
              </Text>
            )}

            <VillagerSelectionGrid
              players={match.players}
              selectedIds={selectedIds}
              disabledIds={
                match.night.lastBodyguardTargetId
                  ? [match.night.lastBodyguardTargetId]
                  : []
              }
              onTogglePlayer={toggleSelectOne}
              lang={lang}
              accentColor={ROLES.bodyguard.accentColor}
            />

            <Pressable
              disabled={selectedIds.length !== 1}
              style={[
                styles.primaryBtn,
                { backgroundColor: ROLES.bodyguard.accentColor },
                selectedIds.length !== 1 && styles.btnDisabled,
              ]}
              onPress={() => {
                if (selectedIds[0]) {
                  soundFX.triggerHaptic('success');
                  onUpdateMatch(applyBodyguardProtection(match, selectedIds[0]));
                }
              }}
            >
              <Text style={styles.primaryBtnText}>🛡️ {t.confirmActionBtn}</Text>
            </Pressable>
          </View>
        )}

        {/* NIGHT: RAVEN (LE CORBEAU) */}
        {match.phase === 'NIGHT_RAVEN' && nightRoleAwake && (
          <View style={styles.panelCard}>
            <Text style={styles.panelTitle}>🪶 {ROLES.raven.name[lang]}</Text>
            <Text style={styles.subtitleText}>{t.ravenPrompt}</Text>

            <VillagerSelectionGrid
              players={match.players}
              selectedIds={selectedIds}
              onTogglePlayer={toggleSelectOne}
              lang={lang}
              accentColor={ROLES.raven.accentColor}
            />

            <View style={styles.actionRow}>
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => onUpdateMatch(applyRavenCurse(match, null))}
              >
                <Text style={styles.secondaryBtnText}>{t.skipActionBtn}</Text>
              </Pressable>

              <Pressable
                disabled={selectedIds.length !== 1}
                style={[
                  styles.primaryBtn,
                  { flex: 1, backgroundColor: ROLES.raven.accentColor },
                  selectedIds.length !== 1 && styles.btnDisabled,
                ]}
                onPress={() =>
                  onUpdateMatch(applyRavenCurse(match, selectedIds[0]))
                }
              >
                <Text style={styles.primaryBtnText}>🪶 {t.confirmActionBtn}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* NIGHT: SEER (LA VOYANTE) */}
        {match.phase === 'NIGHT_SEER' && nightRoleAwake && (
          <View style={styles.panelCard}>
            <Text style={styles.panelTitle}>🔮 {ROLES.seer.name[lang]}</Text>
            {!match.night.seerRevealedRole ? (
              <>
                <Text style={styles.subtitleText}>{t.seerPrompt}</Text>
                <VillagerSelectionGrid
                  players={match.players}
                  selectedIds={selectedIds}
                  disabledIds={match.players
                    .filter((p) => p.role === 'seer')
                    .map((p) => p.id)}
                  onTogglePlayer={toggleSelectOne}
                  lang={lang}
                  accentColor={ROLES.seer.accentColor}
                />
                <Pressable
                  disabled={selectedIds.length !== 1}
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: ROLES.seer.accentColor },
                    selectedIds.length !== 1 && styles.btnDisabled,
                  ]}
                  onPress={() => {
                    if (selectedIds[0]) {
                      soundFX.playCardFlip();
                      onUpdateMatch(inspectPlayerWithSeer(match, selectedIds[0]));
                    }
                  }}
                >
                  <Text style={styles.primaryBtnText}>🔮 {t.confirmActionBtn}</Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.centerSection}>
                <Text style={styles.subtitleText}>
                  {t.seerVisionRevealed}{' '}
                  <Text style={{ color: '#FDE047', fontWeight: '900' }}>
                    {
                      match.players.find((p) => p.id === match.night.seerTargetId)
                        ?.name
                    }
                  </Text>
                </Text>
                <TarotRoleCard
                  role={match.night.seerRevealedRole}
                  lang={lang}
                  revealed={true}
                  compact
                />
                <Pressable
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: ROLES.seer.accentColor },
                  ]}
                  onPress={() => onUpdateMatch(advanceAfterSeer(match))}
                >
                  <Text style={styles.primaryBtnText}>{t.awakenNextRoleBtn}</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* NIGHT: WEREWOLVES (LES LOUPS-GAROUS) */}
        {match.phase === 'NIGHT_WEREWOLVES' && nightRoleAwake && (
          <View style={styles.panelCard}>
            <Text style={[styles.panelTitle, { color: '#FB7185' }]}>
              🐺 {ROLES.werewolf.name[lang]}
            </Text>
            <Text style={styles.subtitleText}>{t.werewolvesPrompt}</Text>

            {/* Little Girl peek button if Little Girl is alive in the village */}
            {match.players.some((p) => p.alive && p.role === 'little_girl') && (
              <View style={styles.littleGirlBox}>
                <Pressable
                  onPress={handleLittleGirlPeek}
                  style={styles.littleGirlBtn}
                >
                  <Text style={styles.littleGirlBtnText}>
                    {t.littleGirlPeekBtn}
                  </Text>
                </Pressable>
                {littleGirlClue && (
                  <Text style={styles.littleGirlClueText}>
                    {t.littleGirlPeekResult(littleGirlClue)}
                  </Text>
                )}
              </View>
            )}

            <VillagerSelectionGrid
              players={match.players}
              selectedIds={selectedIds}
              onTogglePlayer={toggleSelectOne}
              lang={lang}
              accentColor={ROLES.werewolf.accentColor}
            />

            <Pressable
              disabled={selectedIds.length !== 1}
              style={[
                styles.primaryBtn,
                { backgroundColor: ROLES.werewolf.accentColor },
                selectedIds.length !== 1 && styles.btnDisabled,
              ]}
              onPress={() => {
                if (selectedIds[0]) {
                  soundFX.playWolfHowl();
                  onUpdateMatch(applyWerewolvesTarget(match, selectedIds[0]));
                }
              }}
            >
              <Text style={styles.primaryBtnText}>🩸 {t.confirmActionBtn}</Text>
            </Pressable>
          </View>
        )}

        {/* NIGHT: WHITE WEREWOLF (LE LOUP-GAROU BLANC) */}
        {match.phase === 'NIGHT_WHITE_WOLF' && nightRoleAwake && (
          <View style={styles.panelCard}>
            <Text style={styles.panelTitle}>🐺⚪ {ROLES.white_wolf.name[lang]}</Text>
            <Text style={styles.subtitleText}>{t.whiteWolfPrompt}</Text>

            <VillagerSelectionGrid
              players={match.players.filter((p) => p.role === 'werewolf')}
              selectedIds={selectedIds}
              onTogglePlayer={toggleSelectOne}
              lang={lang}
              accentColor="#F43F5E"
            />

            <View style={styles.actionRow}>
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => onUpdateMatch(applyWhiteWolfTarget(match, null))}
              >
                <Text style={styles.secondaryBtnText}>{t.skipActionBtn}</Text>
              </Pressable>
              <Pressable
                disabled={selectedIds.length !== 1}
                style={[
                  styles.primaryBtn,
                  { flex: 1 },
                  selectedIds.length !== 1 && styles.btnDisabled,
                ]}
                onPress={() =>
                  onUpdateMatch(applyWhiteWolfTarget(match, selectedIds[0]))
                }
              >
                <Text style={styles.primaryBtnText}>🩸 {t.confirmActionBtn}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* NIGHT: WITCH (LA SORCIÈRE) */}
        {match.phase === 'NIGHT_WITCH' && nightRoleAwake && (
          <View style={styles.panelCard}>
            <Text style={[styles.panelTitle, { color: '#34D399' }]}>
              🧪 {ROLES.witch.name[lang]}
            </Text>

            {/* Victim display & Elixir of Life */}
            <View style={styles.witchVictimBox}>
              <Text style={styles.witchSectionLabel}>{t.witchVictimLabel}</Text>
              {match.night.werewolfTargetId ? (
                <Text style={styles.witchVictimName}>
                  🩸{' '}
                  {
                    match.players.find(
                      (p) => p.id === match.night.werewolfTargetId
                    )?.name
                  }
                </Text>
              ) : (
                <Text style={styles.subtitleText}>{t.witchNoVictim}</Text>
              )}

              {match.witchPotions.healAvailable && match.night.werewolfTargetId ? (
                <Pressable
                  onPress={() => {
                    soundFX.playPotionBubbles();
                    setWitchUseHeal((h) => !h);
                  }}
                  style={[
                    styles.potionBtn,
                    witchUseHeal && styles.potionBtnHealActive,
                  ]}
                >
                  <Text style={styles.potionBtnText}>
                    {witchUseHeal ? '✅ ' : ''}
                    {t.witchUseHealBtn}
                  </Text>
                </Pressable>
              ) : (
                <Text style={styles.infoNote}>{t.witchHealUsed}</Text>
              )}
            </View>

            {/* Deadly Poison */}
            <View style={styles.witchPoisonSection}>
              <Text style={styles.witchSectionLabel}>
                {match.witchPotions.poisonAvailable
                  ? t.witchUsePoisonLabel
                  : t.witchPoisonUsed}
              </Text>
              {match.witchPotions.poisonAvailable && (
                <VillagerSelectionGrid
                  players={match.players}
                  selectedIds={witchPoisonTargetId ? [witchPoisonTargetId] : []}
                  onTogglePlayer={(id) => {
                    soundFX.playPotionBubbles();
                    setWitchPoisonTargetId((prev) => (prev === id ? null : id));
                  }}
                  lang={lang}
                  accentColor="#A855F7"
                />
              )}
            </View>

            <Pressable
              style={[
                styles.primaryBtn,
                { backgroundColor: ROLES.witch.accentColor },
              ]}
              onPress={() =>
                onUpdateMatch(
                  applyWitchDecision(match, {
                    useHeal: witchUseHeal,
                    poisonTargetId: witchPoisonTargetId,
                  })
                )
              }
            >
              <Text style={styles.primaryBtnText}>{t.dawnBreaksBtn}</Text>
            </Pressable>
          </View>
        )}

        {/* DAWN ANNOUNCEMENT */}
        {match.phase === 'DAWN_ANNOUNCEMENT' && (
          <View style={styles.panelCard}>
            <Text style={styles.bigEmoji}>
              {match.dawnDeaths.length === 0 ? '🌅' : '🩸'}
            </Text>
            <Text style={styles.screenHeading}>{t.dawnTitle(match.turn)}</Text>
            <Text style={styles.subtitleText}>
              {match.dawnDeaths.length === 0
                ? t.peacefulNightMsg
                : t.tragicNightMsg}
            </Text>

            {match.dawnDeaths.map((d) => {
              const victim = match.players.find((p) => p.id === d.playerId);
              if (!victim) return null;
              return (
                <View key={d.playerId} style={styles.fallenBanner}>
                  <RoleArtwork role={victim.role} size={68} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fallenName}>
                      {victim.name} {d.reason === 'heartbreak' ? '💔' : ''}
                    </Text>
                    <Text
                      style={[
                        styles.fallenRole,
                        { color: ROLES[victim.role].accentColor },
                      ]}
                    >
                      {ROLES[victim.role].name[lang]}
                    </Text>
                  </View>
                </View>
              );
            })}

            <Pressable
              style={styles.primaryBtn}
              onPress={() => onUpdateMatch(proceedAfterDawnOrInterrupt(match))}
            >
              <Text style={styles.primaryBtnText}>
                {t.dayDiscussionTitle.toUpperCase()} →
              </Text>
            </Pressable>
          </View>
        )}

        {/* INTERRUPT: HUNTER REVENGE (DERNIER SOUFFLE DU CHASSEUR) */}
        {match.phase === 'HUNTER_REVENGE' && (
          <View style={styles.panelCard}>
            <RoleArtwork role="hunter" size={110} />
            <Text style={[styles.screenHeading, { color: '#F59E0B' }]}>
              🎯 {t.hunterRevengeTitle}
            </Text>
            <Text style={styles.subtitleText}>
              {t.hunterRevengeSub(
                match.players.find((p) => p.id === match.pendingHunterIds[0])
                  ?.name || 'Chasseur'
              )}
            </Text>

            <VillagerSelectionGrid
              players={match.players}
              selectedIds={selectedIds}
              onTogglePlayer={toggleSelectOne}
              lang={lang}
              accentColor="#F59E0B"
            />

            <Pressable
              disabled={selectedIds.length !== 1}
              style={[
                styles.primaryBtn,
                { backgroundColor: '#D97706' },
                selectedIds.length !== 1 && styles.btnDisabled,
              ]}
              onPress={() => {
                if (selectedIds[0]) {
                  soundFX.playHunterShot();
                  onUpdateMatch(applyHunterShot(match, selectedIds[0]));
                }
              }}
            >
              <Text style={styles.primaryBtnText}>💥 {t.confirmActionBtn}</Text>
            </Pressable>
          </View>
        )}

        {/* INTERRUPT: MAYOR SUCCESSION */}
        {match.phase === 'MAYOR_SUCCESSION' && (
          <View style={styles.panelCard}>
            <Text style={styles.bigEmoji}>👑</Text>
            <Text style={styles.screenHeading}>{t.mayorSuccessionTitle}</Text>
            <Text style={styles.subtitleText}>
              {t.mayorSuccessionSub(
                match.players.find(
                  (p) => p.id === match.pendingMayorSuccessionFromId
                )?.name || 'Capitaine'
              )}
            </Text>

            <VillagerSelectionGrid
              players={match.players}
              selectedIds={selectedIds}
              onTogglePlayer={toggleSelectOne}
              lang={lang}
              accentColor="#FACC15"
            />

            <Pressable
              disabled={selectedIds.length !== 1}
              style={[
                styles.primaryBtn,
                { backgroundColor: '#CA8A04' },
                selectedIds.length !== 1 && styles.btnDisabled,
              ]}
              onPress={() => {
                if (selectedIds[0]) {
                  onUpdateMatch(applyMayorSuccessor(match, selectedIds[0]));
                }
              }}
            >
              <Text style={styles.primaryBtnText}>👑 {t.confirmActionBtn}</Text>
            </Pressable>
          </View>
        )}

        {/* DAY 1: MAYOR / CAPTAIN ELECTION */}
        {match.phase === 'MAYOR_ELECTION' && (
          <View style={styles.panelCard}>
            <Text style={styles.bigEmoji}>👑</Text>
            <Text style={styles.screenHeading}>{t.mayorElectionTitle}</Text>
            <Text style={styles.subtitleText}>{t.mayorElectionSub}</Text>

            <VillagerSelectionGrid
              players={match.players}
              selectedIds={selectedIds}
              onTogglePlayer={toggleSelectOne}
              lang={lang}
              accentColor="#FACC15"
            />

            <View style={styles.actionRow}>
              <Pressable
                style={styles.secondaryBtn}
                onPress={() =>
                  onUpdateMatch({
                    ...match,
                    mayorElectionDone: true,
                    phase: 'DAY_DISCUSSION',
                  })
                }
              >
                <Text style={styles.secondaryBtnText}>{t.skipMayorBtn}</Text>
              </Pressable>

              <Pressable
                disabled={selectedIds.length !== 1}
                style={[
                  styles.primaryBtn,
                  { flex: 1, backgroundColor: '#CA8A04' },
                  selectedIds.length !== 1 && styles.btnDisabled,
                ]}
                onPress={() => {
                  if (selectedIds[0]) {
                    soundFX.triggerHaptic('success');
                    onUpdateMatch(electMayor(match, selectedIds[0]));
                  }
                }}
              >
                <Text style={styles.primaryBtnText}>{t.electMayorBtn}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* DAYTIME DISCUSSION & TIMER */}
        {match.phase === 'DAY_DISCUSSION' && (
          <View style={styles.panelCard}>
            <Text style={styles.screenHeading}>{t.dayDiscussionTitle}</Text>
            <Text style={styles.subtitleText}>{t.dayDiscussionSub}</Text>

            {/* Animated Timer Circle */}
            <View style={styles.timerBox}>
              <Text
                style={[
                  styles.timerDigits,
                  secondsLeft <= 15 && { color: '#EF4444' },
                ]}
              >
                ⏱️ {formatTime(secondsLeft)}
              </Text>
              <Pressable
                onPress={() => setSecondsLeft((s) => s + 60)}
                style={styles.addTimePill}
              >
                <Text style={styles.addTimeText}>{t.addTimeBtn}</Text>
              </Pressable>
            </View>

            <VillagerSelectionGrid
              players={match.players}
              selectedIds={[]}
              onTogglePlayer={() => {}}
              lang={lang}
            />

            <Pressable
              style={styles.primaryBtn}
              onPress={() => {
                soundFX.playCouncilBell();
                onUpdateMatch(startDayVoting(match));
              }}
            >
              <Text style={styles.primaryBtnText}>⚖️ {t.openCouncilVoteBtn}</Text>
            </Pressable>
          </View>
        )}

        {/* DAYTIME VILLAGE EXECUTION VOTE */}
        {match.phase === 'DAY_VOTE' && (
          <View style={styles.panelCard}>
            <Text style={styles.screenHeading}>🔥 {t.councilVoteTitle}</Text>
            <Text style={styles.subtitleText}>{t.councilVoteSub}</Text>

            <VillagerSelectionGrid
              players={match.players}
              selectedIds={selectedIds}
              voteCounts={voteCounts}
              onTogglePlayer={toggleSelectOne}
              lang={lang}
              accentColor="#F97316"
            />

            <View style={styles.actionRow}>
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => onUpdateMatch(resolveVillageVote(match, null))}
              >
                <Text style={styles.secondaryBtnText}>
                  {t.noExecutionTieBtn}
                </Text>
              </Pressable>

              <Pressable
                disabled={selectedIds.length !== 1}
                style={[
                  styles.primaryBtn,
                  { flex: 1, backgroundColor: '#EA580C' },
                  selectedIds.length !== 1 && styles.btnDisabled,
                ]}
                onPress={() => {
                  if (selectedIds[0]) {
                    soundFX.triggerHaptic('heavy');
                    onUpdateMatch(resolveVillageVote(match, selectedIds[0]));
                  }
                }}
              >
                <Text style={styles.primaryBtnText}>
                  🔥 {t.executeSuspectBtn}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* GAME OVER VICTORY SCREEN */}
        {match.phase === 'GAME_OVER' && (
          <View style={styles.panelCard}>
            <Text style={styles.bigEmoji}>
              {match.winner === 'village'
                ? '🏰'
                : match.winner === 'lovers'
                ? '💘'
                : match.winner === 'white_wolf'
                ? '🐺⚪'
                : '🌕'}
            </Text>
            <Text style={styles.screenHeading}>
              {match.winner === 'village'
                ? t.victoryVillageTitle
                : match.winner === 'lovers'
                ? t.victoryLoversTitle
                : match.winner === 'white_wolf'
                ? t.victoryWhiteWolfTitle
                : t.victoryWolvesTitle}
            </Text>
            <Text style={styles.subtitleText}>
              {match.winner === 'village'
                ? t.victoryVillageSub
                : match.winner === 'lovers'
                ? t.victoryLoversSub
                : match.winner === 'white_wolf'
                ? t.victoryWhiteWolfSub
                : t.victoryWolvesSub}
            </Text>

            {/* Full True Role Reveal Grid */}
            <VillagerSelectionGrid
              players={match.players}
              selectedIds={match.winnerPlayerIds}
              onTogglePlayer={() => {}}
              showTrueRoles={true}
              lang={lang}
              accentColor="#FACC15"
            />

            <Pressable
              style={styles.primaryBtn}
              onPress={onRestartSameVillage}
            >
              <Text style={styles.primaryBtnText}>
                🔄 {t.playAgainSamePlayersBtn}
              </Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={onExitToLobby}>
              <Text style={styles.secondaryBtnText}>{t.backToLobbyBtn}</Text>
            </Pressable>
          </View>
        )}

        {/* BOTTOM VILLAGE CHRONICLES & SURVIVOR DRAWER */}
        {match.phase !== 'ROLE_DISTRIBUTION' && (
          <View style={styles.chronicleSection}>
            <View style={styles.tabHeaderRow}>
              <Pressable
                onPress={() => setActiveBottomTab('chronicles')}
                style={[
                  styles.tabBtn,
                  activeBottomTab === 'chronicles' && styles.tabBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    activeBottomTab === 'chronicles' && styles.tabBtnTextActive,
                  ]}
                >
                  📜 {t.chroniclesTitle} ({match.chronicles.length})
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveBottomTab('players')}
                style={[
                  styles.tabBtn,
                  activeBottomTab === 'players' && styles.tabBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    activeBottomTab === 'players' && styles.tabBtnTextActive,
                  ]}
                >
                  🧑‍🌾 {t.aliveTab} (
                  {match.players.filter((p) => p.alive).length}/
                  {match.players.length})
                </Text>
              </Pressable>
            </View>

            {activeBottomTab === 'chronicles' ? (
              <View style={styles.chronicleList}>
                {match.chronicles.slice(0, 8).map((ev) => (
                  <View
                    key={ev.id}
                    style={[
                      styles.chronicleItem,
                      ev.highlightColor
                        ? { borderLeftColor: ev.highlightColor }
                        : null,
                    ]}
                  >
                    <Text style={styles.chronicleIcon}>{ev.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.chronicleTitle}>
                        {ev.title[lang]}
                      </Text>
                      <Text style={styles.chronicleDetail}>
                        {ev.detail[lang]}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.rosterCompactList}>
                {match.players.map((p) => (
                  <View
                    key={p.id}
                    style={[
                      styles.rosterRow,
                      !p.alive && { opacity: 0.5 },
                    ]}
                  >
                    <Text style={styles.rosterName}>
                      {AVATAR_EMBLEMS[p.avatarIndex % AVATAR_EMBLEMS.length]}{' '}
                      {p.name} {p.isMayor ? '👑' : ''}{' '}
                      {p.ravenCurves > 0 ? '🪶' : ''}
                    </Text>
                    <Text
                      style={[
                        styles.rosterStatus,
                        { color: p.alive ? '#34D399' : '#FB7185' },
                      ]}
                    >
                      {p.alive
                        ? t.aliveTab
                        : `✝ ${ROLES[p.role].name[lang]}`}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </VillageSkyBackdrop>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 140,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  iconBtnText: {
    color: '#E2E8F0',
    fontSize: 12.5,
    fontWeight: '700',
  },
  turnBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: '#D97706',
  },
  turnBadgeText: {
    color: '#FDE68A',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  phasePill: {
    color: '#FDE68A',
    fontSize: 13,
    fontWeight: '900',
  },
  langPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#D97706',
  },
  langPillText: {
    color: '#FDE68A',
    fontWeight: '800',
    fontSize: 12,
  },
  centerSection: {
    alignItems: 'center',
    gap: 14,
  },
  passLabel: {
    color: '#94A3B8',
    fontSize: 13.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroPlayerName: {
    color: '#FDE68A',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  panelCard: {
    backgroundColor: 'rgba(11, 15, 29, 0.88)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.45)',
    padding: 18,
    alignItems: 'center',
    gap: 14,
  },
  bigEmoji: {
    fontSize: 48,
  },
  screenHeading: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  panelTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FDE68A',
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#CBD5E1',
    textAlign: 'center',
  },
  infoNote: {
    fontSize: 12.5,
    color: '#FDE047',
    fontWeight: '700',
    textAlign: 'center',
  },
  actorsChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  actorChip: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1.5,
  },
  actorChipText: {
    color: '#F8FAFC',
    fontWeight: '800',
    fontSize: 13.5,
  },
  primaryBtn: {
    backgroundColor: '#E11D48',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E11D48',
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  secondaryBtn: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#CBD5E1',
    fontSize: 13.5,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  thiefCardsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
  },
  thiefChoiceCard: {
    flex: 1,
    backgroundColor: '#161F33',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  thiefRoleTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  thiefSelectLabel: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  warningBanner: {
    color: '#FB7185',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  littleGirlBox: {
    width: '100%',
    backgroundColor: 'rgba(131, 24, 67, 0.28)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F472B6',
    padding: 10,
    alignItems: 'center',
    gap: 6,
  },
  littleGirlBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  littleGirlBtnText: {
    color: '#F9A8D4',
    fontWeight: '800',
    fontSize: 13,
  },
  littleGirlClueText: {
    color: '#FDE047',
    fontSize: 12.5,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  witchVictimBox: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.35)',
  },
  witchSectionLabel: {
    color: '#94A3B8',
    fontSize: 12.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  witchVictimName: {
    color: '#FB7185',
    fontSize: 20,
    fontWeight: '900',
  },
  potionBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
  },
  potionBtnHealActive: {
    backgroundColor: '#059669',
  },
  potionBtnText: {
    color: '#ECFDF5',
    fontWeight: '800',
    fontSize: 13.5,
  },
  witchPoisonSection: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  fallenBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 10, 20, 0.9)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E11D48',
    padding: 12,
    gap: 14,
    width: '100%',
  },
  fallenName: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
  },
  fallenRole: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    gap: 14,
  },
  timerDigits: {
    color: '#38BDF8',
    fontSize: 22,
    fontWeight: '900',
  },
  addTimePill: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  addTimeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  chronicleSection: {
    backgroundColor: 'rgba(11, 15, 29, 0.88)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    padding: 14,
    gap: 10,
  },
  tabHeaderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(217, 119, 6, 0.25)',
    borderWidth: 1,
    borderColor: '#D97706',
  },
  tabBtnText: {
    color: '#94A3B8',
    fontSize: 12.5,
    fontWeight: '800',
  },
  tabBtnTextActive: {
    color: '#FDE68A',
  },
  chronicleList: {
    gap: 8,
  },
  chronicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 12,
    padding: 10,
    gap: 10,
    borderLeftWidth: 3.5,
    borderLeftColor: '#64748B',
  },
  chronicleIcon: {
    fontSize: 20,
  },
  chronicleTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
  },
  chronicleDetail: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 1,
  },
  rosterCompactList: {
    gap: 6,
  },
  rosterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 10,
  },
  rosterName: {
    color: '#E2E8F0',
    fontWeight: '700',
    fontSize: 13,
  },
  rosterStatus: {
    fontWeight: '800',
    fontSize: 12.5,
  },
});

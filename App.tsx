import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { soundFX } from './src/audio/soundFX';
import { RoleArtwork } from './src/components/RoleArtwork';
import { RoleGrimoireModal } from './src/components/RoleGrimoireModal';
import { VillageSkyBackdrop } from './src/components/VillageSkyBackdrop';
import { ROLES, ROLE_ORDER, getRecommendedRoles } from './src/data/rolesData';
import {
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
  inspectPlayerWithSeer,
} from './src/engine/gameEngine';
import { Language, MatchState, RoleId } from './src/engine/types';
import { TRANSLATIONS } from './src/i18n/translations';
import { LanPacket, LanRoomMember, lanSync } from './src/lan/lanSync';
import { ActiveGameView } from './src/screens/ActiveGameView';

const STORAGE_KEY_PLAYERS = '@loupgarou_players_v1';
const STORAGE_KEY_LANG = '@loupgarou_lang_v1';

const DEFAULT_VILLAGERS = [
  'Camille',
  'Lucas',
  'Léa',
  'Hugo',
  'Chloé',
  'Antoine',
  'Manon',
  'Thomas',
];

export default function App() {
  const [lang, setLang] = useState<Language>('fr');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [grimoireOpen, setGrimoireOpen] = useState<boolean>(false);

  // Lobby mode: 'pass' (single device) or 'lan' (local Wi-Fi room)
  const [mode, setMode] = useState<'pass' | 'lan'>('pass');

  // Players list for Pass & Play
  const [playerNames, setPlayerNames] = useState<string[]>(DEFAULT_VILLAGERS);
  const [newPlayerInput, setNewPlayerInput] = useState<string>('');

  // Role composition counts
  const [rolesCount, setRolesCount] = useState<Record<RoleId, number>>(() =>
    getRecommendedRoles(DEFAULT_VILLAGERS.length)
  );
  const [includeMayor, setIncludeMayor] = useState<boolean>(true);
  const [discussionSeconds, setDiscussionSeconds] = useState<number>(180);

  // Active Match State
  const [match, setMatch] = useState<MatchState | null>(null);

  // Local Wi-Fi / LAN Room State
  const [lanSubMode, setLanSubMode] = useState<'host' | 'join'>('host');
  const [roomCode, setRoomCode] = useState<string>('LOU1');
  const [lanPlayerName, setLanPlayerName] = useState<string>('Villageois');
  const [lanWsUrl, setLanWsUrl] = useState<string>('');
  const [lanConnected, setLanConnected] = useState<boolean>(false);
  const [localPlayerId, setLocalPlayerId] = useState<string>(() => `p_${Date.now()}`);
  const [lanMembers, setLanMembers] = useState<LanRoomMember[]>([]);

  const t = TRANSLATIONS[lang];

  // Load persisted village roster & language
  useEffect(() => {
    (async () => {
      try {
        const savedLang = await AsyncStorage.getItem(STORAGE_KEY_LANG);
        if (savedLang === 'fr' || savedLang === 'en') {
          setLang(savedLang);
        }
        const savedPlayers = await AsyncStorage.getItem(STORAGE_KEY_PLAYERS);
        if (savedPlayers) {
          const parsed = JSON.parse(savedPlayers);
          if (Array.isArray(parsed) && parsed.length >= 4) {
            setPlayerNames(parsed);
            setRolesCount(getRecommendedRoles(parsed.length));
          }
        }
      } catch {
        // Ignore storage load failures
      }
    })();
  }, []);

  const toggleLanguage = () => {
    soundFX.triggerHaptic('light');
    const next: Language = lang === 'fr' ? 'en' : 'fr';
    setLang(next);
    AsyncStorage.setItem(STORAGE_KEY_LANG, next).catch(() => {});
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    soundFX.enabled = next;
    setSoundEnabled(next);
    if (next) soundFX.playCardFlip();
  };

  const persistPlayers = (list: string[]) => {
    setPlayerNames(list);
    AsyncStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(list)).catch(() => {});
  };

  const handleAddPlayer = () => {
    const trimmed = newPlayerInput.trim();
    if (!trimmed) return;
    soundFX.triggerHaptic('light');
    const next = [...playerNames, trimmed];
    persistPlayers(next);
    setNewPlayerInput('');
    setRolesCount(getRecommendedRoles(next.length));
  };

  const handleRemovePlayer = (index: number) => {
    if (playerNames.length <= 4) return;
    soundFX.triggerHaptic('light');
    const next = playerNames.filter((_, idx) => idx !== index);
    persistPlayers(next);
    setRolesCount(getRecommendedRoles(next.length));
  };

  const handleAdjustRoleCount = (roleId: RoleId, delta: number) => {
    soundFX.triggerHaptic('light');
    setRolesCount((prev) => {
      const current = prev[roleId] || 0;
      const maxForRole =
        roleId === 'villager' || roleId === 'werewolf' ? 12 : 1;
      const nextVal = Math.max(0, Math.min(maxForRole, current + delta));
      return {
        ...prev,
        [roleId]: nextVal,
      };
    });
  };

  const handleAutoBalanceRoles = () => {
    soundFX.playCardFlip();
    const count =
      mode === 'lan' && lanMembers.length >= 4
        ? lanMembers.length
        : playerNames.length;
    setRolesCount(getRecommendedRoles(count));
  };

  // Subscribe to LAN packets when connected
  useEffect(() => {
    if (!lanConnected) return;

    const unsubscribe = lanSync.subscribe((packet: LanPacket) => {
      if (packet.type === 'ROOM_STATE') {
        setLanMembers(packet.members);
        if (lanSubMode === 'join') {
          setMatch(packet.match);
        }
      } else if (packet.type === 'JOIN_ROOM' && lanSubMode === 'host') {
        setLanMembers((prev) => {
          const exists = prev.some((m) => m.id === packet.member.id);
          const updated = exists
            ? prev.map((m) => (m.id === packet.member.id ? packet.member : m))
            : [...prev, packet.member];
          lanSync.send({
            type: 'ROOM_STATE',
            roomCode,
            hostId: localPlayerId,
            members: updated,
            match,
          });
          return updated;
        });
      } else if (packet.type === 'PLAYER_NIGHT_ACTION' && lanSubMode === 'host' && match) {
        let updated: MatchState = match;
        const a = packet.action;
        if (a.kind === 'thief') updated = applyThiefChoice(match, a.cardIndex);
        else if (a.kind === 'cupid') updated = applyCupidLovers(match, a.loverAId, a.loverBId);
        else if (a.kind === 'bodyguard') updated = applyBodyguardProtection(match, a.targetId);
        else if (a.kind === 'raven') updated = applyRavenCurse(match, a.targetId);
        else if (a.kind === 'seer') updated = inspectPlayerWithSeer(match, a.targetId);
        else if (a.kind === 'werewolf') updated = applyWerewolvesTarget(match, a.targetId);
        else if (a.kind === 'white_wolf') updated = applyWhiteWolfTarget(match, a.targetId);
        else if (a.kind === 'witch')
          updated = applyWitchDecision(match, {
            useHeal: a.useHeal,
            poisonTargetId: a.poisonTargetId,
          });
        else if (a.kind === 'hunter') updated = applyHunterShot(match, a.targetId);
        else if (a.kind === 'mayor_successor') updated = applyMayorSuccessor(match, a.targetId);

        setMatch(updated);
        lanSync.send({
          type: 'ROOM_STATE',
          roomCode,
          hostId: localPlayerId,
          members: lanMembers,
          match: updated,
        });
      } else if (packet.type === 'PLAYER_DAY_VOTE' && lanSubMode === 'host' && match) {
        const updated = castVillageVote(match, packet.voterId, packet.targetId);
        setMatch(updated);
        lanSync.send({
          type: 'ROOM_STATE',
          roomCode,
          hostId: localPlayerId,
          members: lanMembers,
          match: updated,
        });
      }
    });

    return () => unsubscribe();
  }, [lanConnected, lanSubMode, roomCode, localPlayerId, match, lanMembers]);

  const handleConnectLanRoom = (subMode: 'host' | 'join') => {
    const cleanCode = roomCode.trim().toUpperCase() || 'LOU1';
    setRoomCode(cleanCode);
    setLanSubMode(subMode);
    lanSync.connect(cleanCode, lanWsUrl);
    setLanConnected(true);

    const myMember: LanRoomMember = {
      id: localPlayerId,
      name: lanPlayerName.trim() || 'Villageois',
      avatarIndex: Math.floor(Math.random() * 12),
      isHost: subMode === 'host',
    };

    if (subMode === 'host') {
      const initialMembers = [myMember];
      setLanMembers(initialMembers);
      lanSync.send({
        type: 'ROOM_STATE',
        roomCode: cleanCode,
        hostId: localPlayerId,
        members: initialMembers,
        match: null,
      });
    } else {
      lanSync.send({
        type: 'JOIN_ROOM',
        roomCode: cleanCode,
        member: myMember,
      });
    }
  };

  const handleStartMatch = () => {
    soundFX.playWolfHowl();
    const roster =
      mode === 'lan' && lanMembers.length >= 4
        ? lanMembers.map((m, i) => ({
            id: m.id,
            name: m.name,
            avatarIndex: m.avatarIndex ?? i,
          }))
        : playerNames.map((name, i) => ({
            id: `p_${i + 1}`,
            name,
            avatarIndex: i,
          }));

    const newMatch = createMatch(roster, {
      mode,
      rolesCount,
      includeMayor,
      discussionSeconds,
    });

    setMatch(newMatch);

    if (mode === 'lan' && lanConnected) {
      lanSync.send({
        type: 'ROOM_STATE',
        roomCode,
        hostId: localPlayerId,
        members: lanMembers,
        match: newMatch,
      });
    }
  };

  const handleUpdateMatch = (nextMatch: MatchState) => {
    setMatch(nextMatch);
    if (mode === 'lan' && lanConnected && lanSubMode === 'host') {
      lanSync.send({
        type: 'ROOM_STATE',
        roomCode,
        hostId: localPlayerId,
        members: lanMembers,
        match: nextMatch,
      });
    }
  };

  // Total cards summary
  const activePlayerCount =
    mode === 'lan' && lanMembers.length >= 4
      ? lanMembers.length
      : playerNames.length;
  const totalDeckCards = Object.values(rolesCount).reduce((a, b) => a + b, 0);
  const hasThief = (rolesCount.thief || 0) > 0;
  const requiredDeckCards = activePlayerCount + (hasThief ? 2 : 0);

  // If a match is running, render ActiveGameView
  if (match) {
    return (
      <>
        <StatusBar style="light" />
        <ActiveGameView
          match={match}
          onUpdateMatch={handleUpdateMatch}
          onRestartSameVillage={handleStartMatch}
          onExitToLobby={() => setMatch(null)}
          lang={lang}
          onToggleLang={toggleLanguage}
          localPlayerId={mode === 'lan' ? localPlayerId : null}
          isLanHost={mode !== 'lan' || lanSubMode === 'host'}
          onSendLanClientAction={(action) => {
            if (action.kind === 'day_vote') {
              lanSync.send({
                type: 'PLAYER_DAY_VOTE',
                roomCode,
                voterId: localPlayerId,
                targetId: action.targetId,
              });
            } else {
              lanSync.send({
                type: 'PLAYER_NIGHT_ACTION',
                roomCode,
                actorId: localPlayerId,
                action,
              });
            }
          }}
        />
      </>
    );
  }

  return (
    <VillageSkyBackdrop mode="night">
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Controls Bar: Language + Sound + Grimoire */}
        <View style={styles.topActionsRow}>
          <Pressable onPress={toggleLanguage} style={styles.topPill}>
            <Text style={styles.topPillText}>
              {lang === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'}
            </Text>
          </Pressable>

          <Pressable onPress={toggleSound} style={styles.topPill}>
            <Text style={styles.topPillText}>
              {soundEnabled ? '🔊' : '🔇'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              soundFX.playCardFlip();
              setGrimoireOpen(true);
            }}
            style={[styles.topPill, styles.grimoirePill]}
          >
            <Text style={styles.grimoirePillText}>📖 {t.grimoireBtn}</Text>
          </Pressable>
        </View>

        {/* Hero Title Emblem */}
        <View style={styles.heroHeader}>
          <RoleArtwork role="werewolf" size={116} />
          <Text style={styles.heroTitle}>{t.appTitle}</Text>
          <Text style={styles.heroSubtitle}>{t.appSubtitle}</Text>
        </View>

        {/* Game Mode Selector: Pass & Play vs Local Wi-Fi Room */}
        <View style={styles.modeSwitchRow}>
          <Pressable
            onPress={() => {
              soundFX.triggerHaptic('light');
              setMode('pass');
            }}
            style={[
              styles.modeCard,
              mode === 'pass' && styles.modeCardActive,
            ]}
          >
            <Text style={styles.modeEmoji}>📱</Text>
            <Text style={styles.modeTitle}>{t.modePassAndPlay}</Text>
            <Text style={styles.modeDesc}>{t.modePassDesc}</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              soundFX.triggerHaptic('light');
              setMode('lan');
            }}
            style={[
              styles.modeCard,
              mode === 'lan' && styles.modeCardActive,
            ]}
          >
            <Text style={styles.modeEmoji}>📡</Text>
            <Text style={styles.modeTitle}>{t.modeLan}</Text>
            <Text style={styles.modeDesc}>{t.modeLanDesc}</Text>
          </Pressable>
        </View>

        {/* PASS & PLAY PLAYER ROSTER BUILDER */}
        {mode === 'pass' ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                🧑‍🌾 {t.playersSection} ({playerNames.length})
              </Text>
            </View>

            <View style={styles.addInputRow}>
              <TextInput
                value={newPlayerInput}
                onChangeText={setNewPlayerInput}
                placeholder={t.addPlayerPlaceholder}
                placeholderTextColor="#64748B"
                style={styles.textInput}
                onSubmitEditing={handleAddPlayer}
              />
              <Pressable onPress={handleAddPlayer} style={styles.addBtn}>
                <Text style={styles.addBtnText}>+ {t.addBtn}</Text>
              </Pressable>
            </View>

            <View style={styles.playerChipsWrap}>
              {playerNames.map((name, idx) => (
                <View key={`${name}_${idx}`} style={styles.playerChip}>
                  <Text style={styles.playerChipText}>
                    {idx + 1}. {name}
                  </Text>
                  {playerNames.length > 4 && (
                    <Pressable
                      onPress={() => handleRemovePlayer(idx)}
                      style={styles.removeChipBtn}
                    >
                      <Text style={styles.removeChipText}>✕</Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          </View>
        ) : (
          /* LOCAL WI-FI / HOTSPOT MULTI-DEVICE ROOM PANEL */
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📡 {t.modeLan}</Text>

            <View style={styles.lanInputGroup}>
              <Text style={styles.inputLabel}>{t.lanRoomCodeLabel}</Text>
              <TextInput
                value={roomCode}
                onChangeText={(txt) => setRoomCode(txt.toUpperCase())}
                maxLength={6}
                style={styles.textInput}
                placeholder="LOU1"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.lanInputGroup}>
              <Text style={styles.inputLabel}>{t.lanYourNameLabel}</Text>
              <TextInput
                value={lanPlayerName}
                onChangeText={setLanPlayerName}
                style={styles.textInput}
                placeholder="Camille"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.lanInputGroup}>
              <Text style={styles.inputLabel}>{t.lanServerUrlLabel}</Text>
              <TextInput
                value={lanWsUrl}
                onChangeText={setLanWsUrl}
                style={styles.textInput}
                placeholder="ws://192.168.1.10:4567 (optionnel)"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.lanButtonsRow}>
              <Pressable
                onPress={() => handleConnectLanRoom('host')}
                style={[styles.primaryCta, { flex: 1, paddingVertical: 12 }]}
              >
                <Text style={styles.primaryCtaText}>{t.lanCreateRoomBtn}</Text>
              </Pressable>
              <Pressable
                onPress={() => handleConnectLanRoom('join')}
                style={[styles.secondaryCta, { flex: 1 }]}
              >
                <Text style={styles.secondaryCtaText}>{t.lanJoinRoomBtn}</Text>
              </Pressable>
            </View>

            {lanConnected && (
              <View style={styles.lanLobbyStatus}>
                <Text style={styles.lanStatusHeading}>
                  🟢 Salon [{roomCode}] — {t.lanConnectedPlayers} (
                  {lanMembers.length})
                </Text>
                <View style={styles.playerChipsWrap}>
                  {lanMembers.map((m) => (
                    <View key={m.id} style={styles.playerChip}>
                      <Text style={styles.playerChipText}>
                        {m.isHost ? '👑 ' : '🧑‍🌾 '}
                        {m.name}
                      </Text>
                    </View>
                  ))}
                </View>
                {lanSubMode === 'join' && (
                  <Text style={styles.waitingHostText}>
                    ⏳ {t.lanWaitingForHost}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* ROLE DECK COMPOSITION & OPTIONS (Visible in Pass & Play or for LAN Host) */}
        {(mode === 'pass' || lanSubMode === 'host') && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>🃏 {t.rolesSection}</Text>
              <Pressable
                onPress={handleAutoBalanceRoles}
                style={styles.autoBalanceBtn}
              >
                <Text style={styles.autoBalanceText}>
                  ✨ {t.autoBalanceBtn}
                </Text>
              </Pressable>
            </View>

            <Text
              style={[
                styles.deckCountInfo,
                totalDeckCards !== requiredDeckCards && { color: '#FACC15' },
              ]}
            >
              {t.cardsMatchInfo(totalDeckCards, activePlayerCount, hasThief)}
            </Text>

            <View style={styles.rolesGrid}>
              {ROLE_ORDER.map((roleId) => {
                const def = ROLES[roleId];
                const count = rolesCount[roleId] || 0;
                return (
                  <View
                    key={roleId}
                    style={[
                      styles.roleCounterCard,
                      count > 0 && {
                        borderColor: def.accentColor,
                        backgroundColor: `${def.accentColor}15`,
                      },
                    ]}
                  >
                    <RoleArtwork role={roleId} size={56} />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.roleCounterName,
                        count > 0 && { color: '#FFFFFF' },
                      ]}
                    >
                      {def.name[lang]}
                    </Text>

                    <View style={styles.stepperRow}>
                      <Pressable
                        onPress={() => handleAdjustRoleCount(roleId, -1)}
                        style={styles.stepperBtn}
                      >
                        <Text style={styles.stepperBtnText}>−</Text>
                      </Pressable>
                      <Text style={styles.stepperCount}>{count}</Text>
                      <Pressable
                        onPress={() => handleAdjustRoleCount(roleId, 1)}
                        style={[
                          styles.stepperBtn,
                          { backgroundColor: def.accentColor },
                        ]}
                      >
                        <Text style={styles.stepperBtnText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Mayor & Timer Settings */}
            <View style={styles.optionRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>
                  👑 {t.includeMayorLabel}
                </Text>
                <Text style={styles.optionDesc}>{t.mayorDesc}</Text>
              </View>
              <Switch
                value={includeMayor}
                onValueChange={setIncludeMayor}
                trackColor={{ false: '#334155', true: '#D97706' }}
                thumbColor="#FDE68A"
              />
            </View>

            <View style={styles.optionRow}>
              <Text style={styles.optionTitle}>
                ⏱️ {t.discussionTimerLabel}
              </Text>
              <View style={styles.timerPillsRow}>
                {[120, 180, 300].map((sec) => (
                  <Pressable
                    key={sec}
                    onPress={() => setDiscussionSeconds(sec)}
                    style={[
                      styles.timerPill,
                      discussionSeconds === sec && styles.timerPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.timerPillText,
                        discussionSeconds === sec && styles.timerPillTextActive,
                      ]}
                    >
                      {sec / 60} min
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Launch Game Button */}
            <Pressable
              onPress={handleStartMatch}
              style={styles.primaryCta}
            >
              <Text style={styles.primaryCtaText}>🌕 {t.startMatchBtn}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Role Grimoire Modal */}
      <RoleGrimoireModal
        visible={grimoireOpen}
        onClose={() => setGrimoireOpen(false)}
        lang={lang}
      />
    </VillageSkyBackdrop>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 145,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  topActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  topPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  topPillText: {
    color: '#F8FAFC',
    fontSize: 12.5,
    fontWeight: '800',
  },
  grimoirePill: {
    borderColor: '#D97706',
    backgroundColor: 'rgba(217, 119, 6, 0.18)',
  },
  grimoirePillText: {
    color: '#FDE68A',
    fontSize: 12.5,
    fontWeight: '800',
  },
  heroHeader: {
    alignItems: 'center',
    marginVertical: 4,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1.8,
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: '#E11D48',
    textShadowRadius: 14,
  },
  heroSubtitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 2,
  },
  modeSwitchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modeCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    padding: 14,
    gap: 4,
  },
  modeCardActive: {
    borderColor: '#E11D48',
    backgroundColor: 'rgba(225, 29, 72, 0.16)',
  },
  modeEmoji: {
    fontSize: 22,
  },
  modeTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '900',
  },
  modeDesc: {
    color: '#94A3B8',
    fontSize: 11.5,
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: 'rgba(11, 15, 29, 0.88)',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.38)',
    padding: 16,
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#FDE68A',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  addInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#161F33',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  addBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  playerChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 99,
    paddingVertical: 7,
    paddingLeft: 13,
    paddingRight: 10,
    borderWidth: 1,
    borderColor: '#475569',
    gap: 8,
  },
  playerChipText: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '700',
  },
  removeChipBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(225, 29, 72, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeChipText: {
    color: '#FB7185',
    fontSize: 11,
    fontWeight: '900',
  },
  autoBalanceBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  autoBalanceText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
  },
  deckCountInfo: {
    color: '#94A3B8',
    fontSize: 12.5,
    fontWeight: '700',
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  roleCounterCard: {
    width: '31%',
    minWidth: 96,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    padding: 10,
    alignItems: 'center',
    gap: 6,
  },
  roleCounterName: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  stepperCount: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '900',
    minWidth: 16,
    textAlign: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    padding: 12,
    borderRadius: 14,
    gap: 12,
  },
  optionTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
  },
  optionDesc: {
    color: '#94A3B8',
    fontSize: 11.5,
    marginTop: 2,
  },
  timerPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  timerPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#475569',
  },
  timerPillActive: {
    backgroundColor: '#D97706',
    borderColor: '#FDE68A',
  },
  timerPillText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
  },
  timerPillTextActive: {
    color: '#FFFFFF',
  },
  primaryCta: {
    backgroundColor: '#E11D48',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E11D48',
    shadowOpacity: 0.45,
    shadowRadius: 12,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  secondaryCta: {
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCtaText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '900',
  },
  lanInputGroup: {
    gap: 5,
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 12.5,
    fontWeight: '700',
  },
  lanButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  lanLobbyStatus: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  lanStatusHeading: {
    color: '#34D399',
    fontSize: 13.5,
    fontWeight: '800',
  },
  waitingHostText: {
    color: '#FDE047',
    fontSize: 12.5,
    fontStyle: 'italic',
  },
});

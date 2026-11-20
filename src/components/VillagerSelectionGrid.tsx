import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ROLES } from '../data/rolesData';
import { Language, Player } from '../engine/types';
import { RoleArtwork } from './RoleArtwork';

const AVATAR_EMBLEMS = ['🧑‍🌾', '🧙‍♀️', '🏹', '⚒️', '🕯️', '🎻', '🗡️', '🛡️', '🌿', '🦊', '🦉', '🏰'];

interface VillagerSelectionGridProps {
  players: Player[];
  selectedIds: string[];
  disabledIds?: string[];
  onTogglePlayer: (playerId: string) => void;
  showTrueRoles?: boolean;
  voteCounts?: Record<string, number>;
  lang: Language;
  accentColor?: string;
}

export const VillagerSelectionGrid: React.FC<VillagerSelectionGridProps> = ({
  players,
  selectedIds,
  disabledIds = [],
  onTogglePlayer,
  showTrueRoles = false,
  voteCounts = {},
  lang,
  accentColor = '#E11D48',
}) => {
  return (
    <View style={styles.grid}>
      {players.map((p) => {
        const isSelected = selectedIds.includes(p.id);
        const isDisabled = disabledIds.includes(p.id) || !p.alive;
        const votes = voteCounts[p.id] || 0;
        const roleDef = ROLES[p.role];
        const avatarEmoji = AVATAR_EMBLEMS[p.avatarIndex % AVATAR_EMBLEMS.length];

        return (
          <Pressable
            key={p.id}
            disabled={isDisabled}
            onPress={() => onTogglePlayer(p.id)}
            style={({ pressed }) => [
              styles.card,
              isSelected && {
                borderColor: accentColor,
                backgroundColor: `${accentColor}22`,
                transform: [{ scale: 1.03 }],
              },
              !p.alive && styles.cardDead,
              isDisabled && !isSelected && styles.cardDisabled,
              pressed && !isDisabled && { opacity: 0.85 },
            ]}
          >
            {/* Top Status Badges */}
            <View style={styles.badgeRow}>
              {p.isMayor && (
                <View style={styles.mayorBadge}>
                  <Text style={styles.badgeEmoji}>👑</Text>
                </View>
              )}
              {p.ravenCurves > 0 && (
                <View style={styles.ravenBadge}>
                  <Text style={styles.ravenText}>🪶+{p.ravenCurves}</Text>
                </View>
              )}
              {p.idiotRevealed && (
                <View style={styles.idiotBadge}>
                  <Text style={styles.badgeEmoji}>🃏</Text>
                </View>
              )}
              {votes > 0 && (
                <View style={[styles.voteBadge, { backgroundColor: accentColor }]}>
                  <Text style={styles.voteBadgeText}>{votes}</Text>
                </View>
              )}
            </View>

            {/* Avatar or Role Medallion */}
            <View style={styles.avatarContainer}>
              {showTrueRoles || !p.alive ? (
                <RoleArtwork role={p.role} size={52} />
              ) : (
                <View
                  style={[
                    styles.avatarCircle,
                    isSelected && { borderColor: accentColor },
                  ]}
                >
                  <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
                </View>
              )}
            </View>

            <Text
              numberOfLines={1}
              style={[
                styles.playerName,
                !p.alive && styles.playerNameDead,
                isSelected && { color: '#FFFFFF' },
              ]}
            >
              {p.name}
            </Text>

            {(showTrueRoles || !p.alive) && (
              <Text
                numberOfLines={1}
                style={[styles.roleSubtext, { color: roleDef.accentColor }]}
              >
                {roleDef.name[lang]}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  card: {
    width: '30%',
    minWidth: 98,
    maxWidth: 135,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    borderWidth: 1.8,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    position: 'relative',
  },
  cardDead: {
    opacity: 0.45,
    backgroundColor: 'rgba(9, 11, 18, 0.7)',
    borderColor: 'rgba(225, 29, 72, 0.25)',
  },
  cardDisabled: {
    opacity: 0.42,
  },
  badgeRow: {
    position: 'absolute',
    top: 5,
    right: 5,
    left: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  mayorBadge: {
    backgroundColor: 'rgba(250, 204, 21, 0.22)',
    borderRadius: 99,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  ravenBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.35)',
    borderRadius: 99,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  ravenText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C7D2FE',
  },
  idiotBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.25)',
    borderRadius: 99,
    paddingHorizontal: 4,
  },
  badgeEmoji: {
    fontSize: 11,
  },
  voteBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  voteBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  avatarContainer: {
    marginTop: 6,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  playerName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E2E8F0',
    textAlign: 'center',
  },
  playerNameDead: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  roleSubtext: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
});

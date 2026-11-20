import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';
import { ROLES } from '../data/rolesData';
import { Language, RoleId } from '../engine/types';
import { TRANSLATIONS } from '../i18n/translations';
import { RoleArtwork } from './RoleArtwork';

interface TarotRoleCardProps {
  role: RoleId;
  lang: Language;
  revealed: boolean;
  onPress?: () => void;
  playerName?: string;
  compact?: boolean;
}

export const TarotRoleCard: React.FC<TarotRoleCardProps> = ({
  role,
  lang,
  revealed,
  onPress,
  playerName,
  compact = false,
}) => {
  const flipAnim = useRef(new Animated.Value(revealed ? 1 : 0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(flipAnim, {
      toValue: revealed ? 1 : 0,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [revealed, flipAnim]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glowAnim]);

  const def = ROLES[role];
  const t = TRANSLATIONS[lang];

  const campLabel =
    def.camp === 'werewolves'
      ? t.campWerewolves
      : def.camp === 'white_wolf'
      ? t.campWhiteWolf
      : t.campVillage;

  const scaleX = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.06, 1],
  });

  const pulseScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Animated.View
        style={[
          styles.cardOuter,
          compact && styles.cardOuterCompact,
          {
            borderColor: revealed ? def.accentColor : '#D97706',
            transform: [{ scaleX }, { scale: pulseScale }],
          },
        ]}
      >
        {!revealed ? (
          <LinearGradient
            colors={['#171128', '#0D0A1A', '#261220']}
            style={styles.cardInner}
          >
            {/* Sealed Wax & Occult Moon Back of Tarot Card */}
            <View style={styles.cardCornerTL} />
            <View style={styles.cardCornerTR} />
            <View style={styles.cardCornerBL} />
            <View style={styles.cardCornerBR} />

            <Svg width={136} height={136} viewBox="0 0 120 120">
              <Circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="#D97706"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <Circle
                cx="60"
                cy="60"
                r="40"
                fill="#1E1B4B"
                stroke="#F59E0B"
                strokeWidth="1.5"
              />
              {/* Wolf Paw & Crescent Emblem */}
              <Path
                d="M72 34 A22 22 0 1 0 72 86 A16 16 0 1 1 72 34 Z"
                fill="#FDE047"
              />
              <Polygon
                points="55,48 58,56 66,56 60,61 62,69 55,64 48,69 50,61 44,56 52,56"
                fill="#E11D48"
              />
            </Svg>

            {playerName && (
              <Text style={styles.sealedPlayerName}>{playerName}</Text>
            )}
            <Text style={styles.sealedTapPrompt}>{t.tapToRevealRole}</Text>
            <Text style={styles.sealedWarning}>{t.holdSecretWarning}</Text>
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={['#111827', '#090D16', def.secondaryColor]}
            style={styles.cardInner}
          >
            {/* Camp Pill */}
            <View
              style={[
                styles.campPill,
                {
                  backgroundColor: `${def.accentColor}25`,
                  borderColor: def.accentColor,
                },
              ]}
            >
              <Text style={[styles.campPillText, { color: def.accentColor }]}>
                {campLabel.toUpperCase()}
              </Text>
            </View>

            {/* Custom Vector SVG Tarot Illustration */}
            <View style={styles.artWrapper}>
              <RoleArtwork role={role} size={compact ? 110 : 148} />
            </View>

            {/* Role Title & Tagline */}
            <Text style={[styles.roleTitle, { color: '#F8FAFC' }]}>
              {def.name[lang]}
            </Text>
            <Text style={[styles.roleTagline, { color: def.accentColor }]}>
              {def.tagline[lang]}
            </Text>

            {!compact && (
              <View style={styles.descBox}>
                <Text style={styles.roleDescription}>
                  {def.description[lang]}
                </Text>
              </View>
            )}
          </LinearGradient>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardOuter: {
    width: 310,
    minHeight: 430,
    borderRadius: 24,
    borderWidth: 2.5,
    backgroundColor: '#0B0F19',
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 14,
    alignSelf: 'center',
  },
  cardOuterCompact: {
    width: 250,
    minHeight: 300,
  },
  cardInner: {
    flex: 1,
    borderRadius: 19,
    paddingHorizontal: 18,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.22)',
    position: 'relative',
  },
  cardCornerTL: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 14,
    height: 14,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#F59E0B',
  },
  cardCornerTR: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 14,
    height: 14,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#F59E0B',
  },
  cardCornerBL: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 14,
    height: 14,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#F59E0B',
  },
  cardCornerBR: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 14,
    height: 14,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: '#F59E0B',
  },
  sealedPlayerName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FDE68A',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginTop: 10,
  },
  sealedTapPrompt: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: 1,
    paddingHorizontal: 12,
    lineHeight: 20,
  },
  sealedWarning: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  campPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  campPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  artWrapper: {
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  roleTagline: {
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  descBox: {
    backgroundColor: 'rgba(7, 9, 19, 0.72)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    width: '100%',
  },
  roleDescription: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#CBD5E1',
    textAlign: 'center',
  },
});

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

interface VillageSkyBackdropProps {
  mode: 'night' | 'dawn' | 'day' | 'blood';
  children: React.ReactNode;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FIREFLIES = [
  { left: '12%', top: '18%', size: 4, delay: 0 },
  { left: '28%', top: '34%', size: 3, delay: 400 },
  { left: '76%', top: '22%', size: 5, delay: 800 },
  { left: '84%', top: '48%', size: 3.5, delay: 1200 },
  { left: '19%', top: '62%', size: 4.5, delay: 600 },
  { left: '64%', top: '71%', size: 3.5, delay: 1500 },
  { left: '46%', top: '15%', size: 3, delay: 900 },
];

export const VillageSkyBackdrop: React.FC<VillageSkyBackdropProps> = ({ mode, children }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    floatLoop.start();
    return () => {
      pulseLoop.stop();
      floatLoop.stop();
    };
  }, [pulseAnim, floatAnim]);

  const skyColors: [string, string, string] =
    mode === 'night'
      ? ['#050711', '#0F172A', '#1E1B4B']
      : mode === 'blood'
      ? ['#18040C', '#3B0819', '#090A12']
      : mode === 'dawn'
      ? ['#1E1B4B', '#7C2D12', '#F59E0B']
      : ['#0C4A6E', '#0284C7', '#38BDF8'];

  const moonScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.07],
  });

  const mistTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const fireflyOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.9],
  });

  return (
    <View style={styles.root}>
      <LinearGradient colors={skyColors} style={StyleSheet.absoluteFillObject} />

      {/* Celestial Moon / Sun Aura in Upper Right */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.celestialOrb,
          {
            transform: [{ scale: moonScale }],
          },
        ]}
      >
        <Svg width={150} height={150} viewBox="0 0 150 150">
          <Defs>
            <RadialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
              <Stop
                offset="0%"
                stopColor={
                  mode === 'blood'
                    ? '#F43F5E'
                    : mode === 'night'
                    ? '#E2E8F0'
                    : '#FDE047'
                }
                stopOpacity="0.85"
              />
              <Stop
                offset="45%"
                stopColor={
                  mode === 'blood'
                    ? '#E11D48'
                    : mode === 'night'
                    ? '#6366F1'
                    : '#F59E0B'
                }
                stopOpacity="0.35"
              />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="75" cy="75" r="72" fill="url(#orbGlow)" />
          <Circle
            cx="75"
            cy="75"
            r="26"
            fill={
              mode === 'blood'
                ? '#E11D48'
                : mode === 'night'
                ? '#F8FAFC'
                : '#FEF08A'
            }
            opacity="0.9"
          />
          {mode !== 'day' && (
            <G opacity="0.25">
              <Circle cx="67" cy="68" r="5" fill="#64748B" />
              <Circle cx="84" cy="79" r="7" fill="#64748B" />
              <Circle cx="72" cy="85" r="3.5" fill="#64748B" />
            </G>
          )}
        </Svg>
      </Animated.View>

      {/* Floating Fireflies / Embers */}
      {FIREFLIES.map((f, idx) => (
        <Animated.View
          key={idx}
          pointerEvents="none"
          style={[
            styles.firefly,
            {
              left: f.left as unknown as number,
              top: f.top as unknown as number,
              width: f.size * 2,
              height: f.size * 2,
              borderRadius: f.size,
              backgroundColor:
                mode === 'blood'
                  ? '#FB7185'
                  : mode === 'night'
                  ? '#FDE047'
                  : '#FEF9C3',
              opacity: fireflyOpacity,
              transform: [{ translateY: mistTranslateY }],
            },
          ]}
        />
      ))}

      {/* Medieval Thiercelieux Village Timber Gables & Pine Forest Silhouette at Bottom */}
      <View pointerEvents="none" style={styles.silhouetteContainer}>
        <Svg
          width={Math.max(SCREEN_WIDTH, 500)}
          height={130}
          viewBox="0 0 500 130"
          preserveAspectRatio="none"
        >
          {/* Distant Forest Ridge */}
          <Path
            d="M0 130 L0 88 L22 65 L38 86 L60 54 L82 86 L108 60 L130 90 L370 90 L395 56 L418 85 L445 48 L470 84 L500 62 L500 130 Z"
            fill={mode === 'day' ? '#075985' : '#090D1A'}
            opacity="0.7"
          />
          {/* Medieval Village Houses & Bell Tower Silhouette */}
          <Polygon
            points="0,130 0,98 45,98 68,72 92,98 145,98 175,62 205,98 232,98 232,54 250,24 268,54 268,98 310,98 342,68 375,98 500,98 500,130"
            fill="#05070F"
          />
          {/* Warm Glowing Tavern & Cottage Windows */}
          <Rect x="62" y="92" width="10" height="12" rx="1.5" fill="#F59E0B" opacity="0.85" />
          <Rect x="166" y="84" width="8" height="10" rx="1" fill="#FACC15" opacity="0.75" />
          <Rect x="178" y="84" width="8" height="10" rx="1" fill="#FACC15" opacity="0.75" />
          <Rect x="245" y="62" width="10" height="16" rx="5" fill="#E11D48" opacity="0.8" />
          <Rect x="338" y="88" width="11" height="11" rx="1.5" fill="#F59E0B" opacity="0.8" />
        </Svg>
      </View>

      {/* Foreground Screen Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050711',
    position: 'relative',
    overflow: 'hidden',
  },
  celestialOrb: {
    position: 'absolute',
    top: -10,
    right: -15,
    zIndex: 0,
  },
  firefly: {
    position: 'absolute',
    zIndex: 0,
    shadowColor: '#FDE047',
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  silhouetteContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 130,
    zIndex: 0,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});

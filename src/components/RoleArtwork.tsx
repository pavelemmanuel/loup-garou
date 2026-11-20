import React from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { ROLES } from '../data/rolesData';
import { RoleId } from '../engine/types';

interface RoleArtworkProps {
  role: RoleId;
  size?: number;
}

/**
 * Custom hand-crafted Dark Fantasy / Tarot SVG illustrations for each of the 13 roles
 * of Les Loups-Garous de Thiercelieux.
 */
export const RoleArtwork: React.FC<RoleArtworkProps> = ({ role, size = 140 }) => {
  const def = ROLES[role];
  const accent = def.accentColor;
  const secondary = def.secondaryColor;

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <RadialGradient id={`bg_${role}`} cx="50%" cy="45%" r="55%">
          <Stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <Stop offset="65%" stopColor={secondary} stopOpacity="0.22" />
          <Stop offset="100%" stopColor="#070913" stopOpacity="0.95" />
        </RadialGradient>
        <LinearGradient id={`gold_${role}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FDE68A" />
          <Stop offset="50%" stopColor="#D97706" />
          <Stop offset="100%" stopColor="#78350F" />
        </LinearGradient>
      </Defs>

      {/* Ornate Tarot Medallion Backdrop */}
      <Circle cx="60" cy="60" r="56" fill={`url(#bg_${role})`} stroke={`url(#gold_${role})`} strokeWidth="2.5" />
      <Circle cx="60" cy="60" r="50" fill="none" stroke={accent} strokeWidth="0.9" strokeDasharray="3 3" opacity="0.7" />

      {/* Corner Celestial Stars */}
      <Circle cx="20" cy="22" r="1.4" fill="#FDE68A" opacity="0.8" />
      <Circle cx="100" cy="24" r="1.2" fill="#FDE68A" opacity="0.7" />
      <Circle cx="24" cy="96" r="1.2" fill="#FDE68A" opacity="0.6" />
      <Circle cx="96" cy="96" r="1.5" fill="#FDE68A" opacity="0.8" />

      {role === 'werewolf' && (
        <G>
          {/* Blood Full Moon */}
          <Circle cx="60" cy="46" r="28" fill="#E11D48" opacity="0.28" />
          <Circle cx="60" cy="46" r="21" fill="#FB7185" opacity="0.35" />
          {/* Feral Wolf Head & Ears */}
          <Path
            d="M30 88 L36 52 L28 24 L48 40 L60 36 L72 40 L92 24 L84 52 L90 88 L74 78 L60 94 L46 78 Z"
            fill="#1F121D"
            stroke="#FB7185"
            strokeWidth="2"
          />
          {/* Glowing Crimson Eyes */}
          <Polygon points="44,54 54,58 46,61" fill="#FF1E56" />
          <Polygon points="76,54 66,58 74,61" fill="#FF1E56" />
          {/* Snarl & Fangs */}
          <Path d="M48 73 L53 82 L57 74 L60 79 L63 74 L67 82 L72 73 Z" fill="#F8FAFC" />
          {/* Claw Slash Marks */}
          <Path d="M22 36 L38 66 M98 36 L82 66" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
        </G>
      )}

      {role === 'white_wolf' && (
        <G>
          {/* Eclipse Crimson Halo */}
          <Circle cx="60" cy="48" r="27" fill="#991B1B" opacity="0.45" />
          <Circle cx="60" cy="48" r="22" fill="#F8FAFC" opacity="0.22" />
          {/* Albino Wolf Head */}
          <Path
            d="M28 88 L35 50 L27 22 L49 39 L60 34 L71 39 L93 22 L85 50 L92 88 L75 78 L60 95 L45 78 Z"
            fill="#E2E8F0"
            stroke="#94A3B8"
            strokeWidth="2"
          />
          {/* Inner Fur Shading */}
          <Path d="M48 42 L60 66 L72 42" fill="none" stroke="#64748B" strokeWidth="2" />
          {/* Piercing Blood-Red Eyes */}
          <Polygon points="43,53 54,57 46,61" fill="#DC2626" />
          <Polygon points="77,53 66,57 74,61" fill="#DC2626" />
          {/* Crown Scar & Fangs */}
          <Path d="M56 29 L64 43 M64 29 L56 43" stroke="#DC2626" strokeWidth="2" />
          <Path d="M48 74 L53 83 L58 75 L62 75 L67 83 L72 74 Z" fill="#FFFFFF" stroke="#475569" strokeWidth="0.8" />
        </G>
      )}

      {role === 'villager' && (
        <G>
          {/* Warm Lantern Glow */}
          <Circle cx="60" cy="58" r="25" fill="#38BDF8" opacity="0.2" />
          <Circle cx="60" cy="60" r="14" fill="#FDE047" opacity="0.45" />
          {/* Medieval Lantern Cage */}
          <Path d="M48 38 L72 38 L76 78 L44 78 Z" fill="#0F172A" stroke="#38BDF8" strokeWidth="2.2" />
          <Path d="M52 38 L56 28 L64 28 L68 38" fill="none" stroke="#FDE68A" strokeWidth="2.2" />
          <Circle cx="60" cy="24" r="4" fill="none" stroke="#FDE68A" strokeWidth="2" />
          {/* Inner Lantern Flame */}
          <Path
            d="M60 46 C66 54 67 64 60 70 C53 64 54 54 60 46 Z"
            fill="#FACC15"
            stroke="#F97316"
            strokeWidth="1.5"
          />
          {/* Pitchfork Silhouette Behind */}
          <Path d="M32 88 L32 40 M26 40 L26 52 L38 52 L38 40" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <Path d="M44 78 L76 78 L80 86 L40 86 Z" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.8" />
        </G>
      )}

      {role === 'seer' && (
        <G>
          {/* Floating Mystic Crystal Ball */}
          <Circle cx="60" cy="54" r="25" fill="#7E22CE" opacity="0.38" />
          <Circle cx="60" cy="54" r="22" fill="#3B0764" stroke="#C084FC" strokeWidth="2.5" />
          {/* All-Seeing Golden Eye inside Orb */}
          <Path
            d="M42 54 Q60 39 78 54 Q60 69 42 54 Z"
            fill="#1E1B4B"
            stroke="#FDE047"
            strokeWidth="2"
          />
          <Circle cx="60" cy="54" r="6.5" fill="#A855F7" stroke="#FDE047" strokeWidth="1.5" />
          <Circle cx="60" cy="54" r="2.8" fill="#FFFFFF" />
          {/* Ornate Pedestal */}
          <Path d="M42 82 L78 82 L70 74 L50 74 Z" fill="#D97706" stroke="#FDE68A" strokeWidth="1.5" />
          <Path d="M36 88 L84 88 L78 82 L42 82 Z" fill="#78350F" stroke="#FDE68A" strokeWidth="1.5" />
          {/* Mystic Rays */}
          <Path d="M60 22 L60 27 M32 38 L36 41 M88 38 L84 41" stroke="#E9D5FF" strokeWidth="2" strokeLinecap="round" />
        </G>
      )}

      {role === 'witch' && (
        <G>
          {/* Bubbling Emerald Flask (Life) & Crimson Vial (Poison) */}
          <Path
            d="M52 28 L68 28 L68 34 L64 36 L64 46 L82 74 C85 80 81 88 73 88 L47 88 C39 88 35 80 38 74 L56 46 L56 36 L52 34 Z"
            fill="#064E3B"
            stroke="#34D399"
            strokeWidth="2.2"
          />
          {/* Glowing Potion Liquid */}
          <Path
            d="M43 70 Q60 65 77 70 L80 76 C82 81 78 85 72 85 L48 85 C42 85 38 81 40 76 Z"
            fill="#10B981"
          />
          {/* Rising Magic Bubbles */}
          <Circle cx="55" cy="62" r="3" fill="#A7F3D0" />
          <Circle cx="65" cy="55" r="2.2" fill="#A7F3D0" />
          <Circle cx="60" cy="44" r="1.8" fill="#6EE7B7" />
          <Circle cx="60" cy="21" r="2.4" fill="#34D399" />
          {/* Cork Stopper */}
          <Rect x="55" y="21" width="10" height="7" rx="1.5" fill="#B45309" stroke="#FDE68A" strokeWidth="1.2" />
        </G>
      )}

      {role === 'hunter' && (
        <G>
          {/* Crosshair Target Reticle */}
          <Circle cx="60" cy="60" r="26" fill="none" stroke="#F59E0B" strokeWidth="2.2" />
          <Circle cx="60" cy="60" r="14" fill="none" stroke="#FDE68A" strokeWidth="1.4" strokeDasharray="4 2" />
          <Circle cx="60" cy="60" r="4" fill="#EF4444" />
          {/* Crosshair Axis Lines */}
          <Path d="M60 24 L60 42 M60 78 L60 96 M24 60 L42 60 M78 60 L96 60" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" />
          {/* Crossed Flintlock Rifles */}
          <Path d="M28 86 L88 30" stroke="#FDE68A" strokeWidth="3.5" strokeLinecap="round" />
          <Path d="M92 86 L32 30" stroke="#D97706" strokeWidth="3.5" strokeLinecap="round" />
        </G>
      )}

      {role === 'cupid' && (
        <G>
          {/* Glowing Heart */}
          <Path
            d="M60 86 C60 86 30 66 30 45 C30 34 39 27 48 27 C54 27 58 31 60 35 C62 31 66 27 72 27 C81 27 90 34 90 45 C90 66 60 86 60 86 Z"
            fill="#BE185D"
            stroke="#F472B6"
            strokeWidth="2.5"
          />
          {/* Golden Arrow Piercing Heart */}
          <Path d="M24 84 L92 26" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
          {/* Arrowhead */}
          <Polygon points="95,23 83,26 90,34" fill="#FDE047" />
          {/* Feather Fletching */}
          <Path d="M24 84 L18 80 M28 80 L22 76 M24 84 L28 90" stroke="#FDE68A" strokeWidth="2.2" strokeLinecap="round" />
        </G>
      )}

      {role === 'bodyguard' && (
        <G>
          {/* Radiant Templar Shield */}
          <Path
            d="M60 22 L88 34 L88 58 C88 76 74 90 60 96 C46 90 32 76 32 58 L32 34 Z"
            fill="#0E7490"
            stroke="#67E8F9"
            strokeWidth="2.8"
          />
          <Path
            d="M60 29 L81 39 L81 57 C81 71 70 83 60 88 C50 83 39 71 39 57 L39 39 Z"
            fill="#164E63"
            stroke="#22D3EE"
            strokeWidth="1.5"
          />
          {/* Golden Guard Cross */}
          <Path d="M60 36 L60 80 M44 54 L76 54" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
        </G>
      )}

      {role === 'little_girl' && (
        <G>
          {/* Hooded Cloak */}
          <Path
            d="M60 22 C38 24 30 46 32 86 L88 86 C90 46 82 24 60 22 Z"
            fill="#831843"
            stroke="#F472B6"
            strokeWidth="2.2"
          />
          {/* Shadowed Face Interior */}
          <Ellipse cx="60" cy="56" rx="17" ry="19" fill="#090D16" />
          {/* Two Wide Curious Peeking Eyes */}
          <Ellipse cx="52" cy="54" rx="4.5" ry="3.2" fill="#F8FAFC" />
          <Circle cx="53" cy="54" r="2" fill="#38BDF8" />
          <Ellipse cx="68" cy="54" rx="4.5" ry="3.2" fill="#F8FAFC" />
          <Circle cx="69" cy="54" r="2" fill="#38BDF8" />
          {/* Fingers Covering Lower Face */}
          <Path d="M46 68 L52 59 M53 70 L57 60 M67 70 L63 60 M74 68 L68 59" stroke="#FBCFE8" strokeWidth="2.6" strokeLinecap="round" />
        </G>
      )}

      {role === 'thief' && (
        <G>
          {/* Two Overlapping Mystery Tarot Cards */}
          <G transform="rotate(-12 52 58)">
            <Rect x="34" y="32" width="32" height="48" rx="4" fill="#2E1065" stroke="#A78BFA" strokeWidth="2" />
            <Path d="M50 48 L55 56 L50 64 L45 56 Z" fill="#C4B5FD" />
          </G>
          <G transform="rotate(14 68 58)">
            <Rect x="54" y="32" width="32" height="48" rx="4" fill="#1E1B4B" stroke="#FDE047" strokeWidth="2" />
            <Circle cx="70" cy="56" r="7" fill="none" stroke="#FDE047" strokeWidth="2" />
          </G>
          {/* Domino Mask Across Foreground */}
          <Path
            d="M32 54 Q46 46 60 54 Q74 46 88 54 Q84 68 72 66 Q60 60 60 60 Q60 60 48 66 Q36 68 32 54 Z"
            fill="#0F172A"
            stroke="#C084FC"
            strokeWidth="2"
          />
        </G>
      )}

      {role === 'elder' && (
        <G>
          {/* Ancient Hourglass & Gnarled Oak Staff */}
          <Path d="M42 28 L78 28 M42 92 L78 92" stroke="#FDE68A" strokeWidth="3.5" strokeLinecap="round" />
          <Path
            d="M46 28 L74 28 L63 58 L74 92 L46 92 L57 58 Z"
            fill="#451A03"
            stroke="#F59E0B"
            strokeWidth="2.2"
          />
          {/* Golden Sands of Time (2 Lives) */}
          <Polygon points="51,38 69,38 60,55" fill="#FACC15" />
          <Polygon points="50,88 70,88 60,72" fill="#F59E0B" />
          <Circle cx="60" cy="64" r="1.8" fill="#FDE047" />
        </G>
      )}

      {role === 'idiot' && (
        <G>
          {/* Three-Pointed Medieval Jester Crown / Hat */}
          <Path
            d="M34 74 C32 52 22 40 26 32 C32 30 44 44 48 54 C52 40 56 24 60 22 C64 24 68 40 72 54 C76 44 88 30 94 32 C98 40 88 52 86 74 Z"
            fill="#713F12"
            stroke="#FACC15"
            strokeWidth="2.4"
          />
          {/* Jester Bells */}
          <Circle cx="25" cy="31" r="4.5" fill="#FDE047" />
          <Circle cx="60" cy="20" r="4.5" fill="#FDE047" />
          <Circle cx="95" cy="31" r="4.5" fill="#FDE047" />
          {/* Crown Rim */}
          <Rect x="34" y="72" width="52" height="12" rx="4" fill="#A16207" stroke="#FDE047" strokeWidth="2" />
          <Circle cx="46" cy="78" r="2.2" fill="#FEF08A" />
          <Circle cx="60" cy="78" r="2.2" fill="#FEF08A" />
          <Circle cx="74" cy="78" r="2.2" fill="#FEF08A" />
        </G>
      )}

      {role === 'raven' && (
        <G>
          {/* Crescent Moon Behind Raven */}
          <Path
            d="M70 24 A22 22 0 1 0 90 58 A17 17 0 1 1 70 24 Z"
            fill="#818CF8"
            opacity="0.45"
          />
          {/* Perched Raven Silhouette */}
          <Path
            d="M45 34 C53 28 64 32 66 42 L80 44 L67 50 C70 62 64 76 50 86 L34 88 L42 74 C36 64 36 44 45 34 Z"
            fill="#1E1B4B"
            stroke="#A5B4FC"
            strokeWidth="2.2"
          />
          {/* Glowing Indigo Eye */}
          <Circle cx="57" cy="40" r="2.5" fill="#F43F5E" />
          {/* Sealed Accusation Letter Held in Beak */}
          <Rect x="68" y="48" width="22" height="15" rx="2" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
          <Circle cx="79" cy="55.5" r="3" fill="#E11D48" />
        </G>
      )}
    </Svg>
  );
};

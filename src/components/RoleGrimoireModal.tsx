import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ROLES, ROLE_ORDER } from '../data/rolesData';
import { Language } from '../engine/types';
import { TRANSLATIONS } from '../i18n/translations';
import { RoleArtwork } from './RoleArtwork';

interface RoleGrimoireModalProps {
  visible: boolean;
  onClose: () => void;
  lang: Language;
}

export const RoleGrimoireModal: React.FC<RoleGrimoireModalProps> = ({
  visible,
  onClose,
  lang,
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>📖 {t.grimoireBtn}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.list}>
            {ROLE_ORDER.map((roleId) => {
              const def = ROLES[roleId];
              const campLabel =
                def.camp === 'werewolves'
                  ? t.campWerewolves
                  : def.camp === 'white_wolf'
                  ? t.campWhiteWolf
                  : t.campVillage;

              return (
                <View
                  key={roleId}
                  style={[
                    styles.roleCard,
                    { borderColor: `${def.accentColor}55` },
                  ]}
                >
                  <RoleArtwork role={roleId} size={76} />
                  <View style={styles.roleInfo}>
                    <View style={styles.titleRow}>
                      <Text style={styles.roleName}>{def.name[lang]}</Text>
                      <View
                        style={[
                          styles.campBadge,
                          {
                            backgroundColor: `${def.accentColor}25`,
                            borderColor: def.accentColor,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.campText, { color: def.accentColor }]}
                        >
                          {campLabel}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[styles.tagline, { color: def.accentColor }]}
                    >
                      {def.tagline[lang]}
                    </Text>
                    <Text style={styles.desc}>{def.description[lang]}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 17, 0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: '#0B0F1D',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 2,
    borderColor: '#D97706',
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FDE68A',
    letterSpacing: 0.6,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  roleCard: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 12,
    gap: 12,
    alignItems: 'center',
  },
  roleInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  campBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    borderWidth: 1,
  },
  campText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tagline: {
    fontSize: 12,
    fontWeight: '700',
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 4,
  },
  desc: {
    fontSize: 12,
    lineHeight: 17,
    color: '#CBD5E1',
  },
});

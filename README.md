# 🐺 LES LOUPS-GAROUS DE THIERCELIEUX — Édition Locale Bilingue (FR 🇫🇷 / EN 🇬🇧)

Une adaptation complète, 100 % locale et hors-ligne du jeu de société culte **Les Loups-Garous de Thiercelieux** (*The Werewolves of Miller's Hollow*), développée avec **React Native + Expo + TypeScript + SVG** pour **Web, iOS et APK Android autonome**.

---

## ✨ Fonctionnalités & Direction Artistique

- **Bilingue Français & Anglais (`FR 🇫🇷` / `EN 🇬🇧`)** : Basculez instantanément entre le français et l'anglais à tout moment depuis le salon ou en pleine partie.
- **UI Immersive Dark Fantasy & Animations** :
  - **Illustrations Tarot Vectorielles (SVG) sur mesure** pour chacun des **13 rôles** dans [RoleArtwork.tsx](file:///home/pavel/loup-garou/src/components/RoleArtwork.tsx).
  - **Ciel Dynamique & Silhouette Médiévale de Thiercelieux** ([VillageSkyBackdrop.tsx](file:///home/pavel/loup-garou/src/components/VillageSkyBackdrop.tsx)) : transitions animées entre la **Nuit Étoilée**, la **Lune de Sang des Loups**, l'**Aube Dorée**, et le **Jour du Conseil**, accompagnées de lucioles flottantes.
  - **Cartes de Tarot 3D à retournement** ([TarotRoleCard.tsx](file:///home/pavel/loup-garou/src/components/TarotRoleCard.tsx)) avec sceau occulte anti-regard indiscret.
  - **Synthétiseur Audio WebAudio & Narrateur Vocal** ([soundFX.ts](file:///home/pavel/loup-garou/src/audio/soundFX.ts)) : hurlements de loups, chant clair de l'aube, cloche du conseil, bouillonnements de potions, coup de fusil du Chasseur, vibrations haptiques et voix off (SpeechSynthesis FR/EN).
- **13 Rôles Emblématiques & Règles Officielles** ([rolesData.ts](file:///home/pavel/loup-garou/src/data/rolesData.ts) & [gameEngine.ts](file:///home/pavel/loup-garou/src/engine/gameEngine.ts)) :
  1. 🐺 **Loup-Garou (Werewolf)** : Se réveille chaque nuit avec la meute pour dévorer un villageois.
  2. 🧑‍🌾 **Simple Villageois (Villager)** : Enquête et vote au Conseil du Village.
  3. 🔮 **La Voyante (The Seer)** : Sonde la véritable identité d'un joueur chaque nuit dans sa boule de cristal.
  4. 🧪 **La Sorcière (The Witch)** : Possède l'**Élixir de Vie** (pour ressusciter la victime des Loups) et le **Poison Mortel**.
  5. 🎯 **Le Chasseur (The Hunter)** : S'il meurt (dévoré ou exécuté), il tire immédiatement sa dernière balle sur un joueur vivant.
  6. 💘 **Cupidon (Cupid)** : Unit deux **Amoureux** la première nuit. Si l'un meurt, l'autre meurt aussitôt de chagrin. S'ils sont de camps opposés, ils peuvent remporter la victoire en couple !
  7. 🛡️ **Le Salvateur (The Bodyguard)** : Protège un joueur chaque nuit contre les Loups-Garous (interdiction de protéger la même personne 2 nuits de suite).
  8. 👧 **La Petite Fille (The Little Girl)** : Peut espionner la meute dans l'ombre pendant le tour des Loups pour obtenir un indice.
  9. 🐺⚪ **Le Loup-Garou Blanc (White Werewolf)** : Se réveille avec la meute, mais une nuit sur deux il se réveille seul pour dévorer un Loup-Garou. Son objectif : être l'unique survivant !
  10. ⏳ **L'Ancien (The Village Elder)** : Survit à la première attaque des Loups-Garous (**2 vies**). Mais s'il est exécuté par le vote du village, le tir du Chasseur ou le poison de la Sorcière, tous les villageois perdent leurs pouvoirs !
  11. 🃏 **L'Idiot du Village (The Village Idiot)** : S'il est condamné par le vote du village, il retourne sa carte et est immédiatement gracié (mais perd son droit de vote).
  12. 🪶 **Le Corbeau (The Raven)** : Cloue une affiche anonyme la nuit sur la porte d'un suspect (**+2 voix** contre lui au vote du lendemain).
  13. 🎭 **Le Voleur (The Thief)** : Consulte 2 cartes supplémentaires non distribuées la première nuit et peut échanger son rôle (échange obligatoire si les 2 cartes sont des Loups-Garous).
  - 👑 **Capitaine / Maire (Captain / Mayor)** : Élu par le village, sa voix compte double (`x2`), il tranche les égalités et désigne son successeur dans son dernier souffle.

---

## 🎮 Deux Modes Multijoueurs Locaux

1. **Pass & Play (1 Seul Appareil)** :
   - Faites circuler un téléphone ou une tablette autour de la table.
   - Le Maître du Jeu intégré appelle les rôles dans l'ordre officiel de la nuit avec un écran de confidentialité avant chaque réveil.
2. **Salon Wi-Fi Local / Hotspot (Multi-Appareils)** :
   - Lancez le relais WebSocket local (`npm run lan-server` sur le port `4567`) ou ouvrez plusieurs onglets locaux (synchronisation instantanée via `BroadcastChannel`).
   - L'hôte crée un code de salon à 4 lettres (ex. `LOU1`) et chaque joueur rejoint sur son propre smartphone pour consulter sa carte secrète et voter.

---

## 📱 Compilation & Installation de l'APK Android Autonome (100 % Hors-Ligne)

Un script de compilation natif [build-android.sh](file:///home/pavel/loup-garou/build-android.sh) génère l'APK signé [dist/loup-garou-local.apk](file:///home/pavel/loup-garou/dist/loup-garou-local.apk) sans dépendance réseau :

```bash
# Compiler uniquement l'APK signé dans dist/loup-garou-local.apk :
npm run build:apk

# Compiler, installer via ADB sur le téléphone Android connecté et lancer le jeu :
npm run install:apk
```

---

## 🚀 Démarrage Rapide (Web / Expo / Tests)

```bash
# Lancer les tests unitaires du moteur de règles (Vitest)
npm test

# Vérifier le typage TypeScript
npm run typecheck

# Démarrer le serveur de développement Expo (Web / iOS / Android)
npm run web

# (Optionnel) Démarrer le relais Wi-Fi Local pour le mode Multi-Appareils (port 4567)
npm run lan-server
```

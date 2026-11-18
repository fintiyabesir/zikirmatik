import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'zikirmatik:v1';

const ZIKIRS = [
  { id: 'subhanallah', name: 'Sübhanallah', target: 33 },
  { id: 'elhamdulillah', name: 'Elhamdülillah', target: 33 },
  { id: 'allahuekber', name: 'Allahu Ekber', target: 33 },
  { id: 'lailaheillallah', name: 'La ilahe illallah', target: 100 },
  { id: 'estagfirullah', name: 'Estağfirullah', target: 100 },
  { id: 'salavat', name: 'Salavat-ı Şerife', target: 100 },
  { id: 'serbest', name: 'Serbest Zikir', target: 0 },
];

const TARGETS = [33, 99, 100, 500, 1000, 0]; // 0 = hedefsiz

const initialState = {
  zikirId: 'subhanallah',
  counts: {}, // zikirId -> { count, rounds, total }
  targets: {}, // zikirId -> hedef
  vibration: true,
};

const getZikir = (id) => ZIKIRS.find((z) => z.id === id) || ZIKIRS[0];

export default function App() {
  const [state, setState] = useState(initialState);
  const [loaded, setLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [customTarget, setCustomTarget] = useState('');
  const scale = useRef(new Animated.Value(1)).current;

  // Kayıtlı veriyi yükle
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setState({ ...initialState, ...JSON.parse(raw) });
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  // Değişiklikleri kaydet
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, loaded]);

  const zikir = getZikir(state.zikirId);
  const entry = state.counts[zikir.id] || { count: 0, rounds: 0, total: 0 };
  const target = state.targets[zikir.id] ?? zikir.target;

  const haptic = useCallback(
    (kind) => {
      if (!state.vibration) return;
      try {
        if (kind === 'done') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch (e) {}
    },
    [state.vibration]
  );

  const update = (id, fn) =>
    setState((s) => {
      const cur = s.counts[id] || { count: 0, rounds: 0, total: 0 };
      return { ...s, counts: { ...s.counts, [id]: fn(cur) } };
    });

  const onTap = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.94, duration: 60, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    const next = entry.count + 1;
    const reached = target > 0 && next >= target;
    haptic(reached ? 'done' : 'tap');
    update(zikir.id, (c) =>
      reached
        ? { count: 0, rounds: c.rounds + 1, total: c.total + 1 }
        : { ...c, count: c.count + 1, total: c.total + 1 }
    );
  };

  const onUndo = () => {
    if (entry.count === 0) return;
    update(zikir.id, (c) => ({ ...c, count: c.count - 1, total: Math.max(0, c.total - 1) }));
  };

  const onReset = () => {
    Alert.alert('Sıfırla', `"${zikir.name}" sayacı sıfırlansın mı?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sıfırla',
        style: 'destructive',
        onPress: () => update(zikir.id, () => ({ count: 0, rounds: 0, total: 0 })),
      },
    ]);
  };

  const setTarget = (t) => setState((s) => ({ ...s, targets: { ...s.targets, [zikir.id]: t } }));

  const applyCustomTarget = () => {
    const n = parseInt(customTarget, 10);
    if (n > 0) {
      setTarget(n);
      setCustomTarget('');
    }
  };

  const progress = target > 0 ? entry.count / target : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Pressable onPress={() => setMenuOpen(true)} style={styles.zikirPicker}>
          <Text style={styles.zikirName}>{zikir.name}</Text>
          <Text style={styles.zikirHint}>değiştirmek için dokun ▾</Text>
        </Pressable>
      </View>

      <View style={styles.stats}>
        <Stat label="Tur" value={entry.rounds} />
        <Stat label="Hedef" value={target > 0 ? target : '∞'} />
        <Stat label="Toplam" value={entry.total} />
      </View>

      <View style={styles.center}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Pressable
            onPress={onTap}
            style={({ pressed }) => [styles.bigButton, pressed && styles.bigButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Say"
          >
            <Text style={styles.count}>{entry.count}</Text>
            {target > 0 && <Text style={styles.countSub}>/ {target}</Text>}
          </Pressable>
        </Animated.View>
        {target > 0 && (
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${Math.min(100, progress * 100)}%` }]} />
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <ActionButton label="↶ Geri Al" onPress={onUndo} />
        <ActionButton label="⟲ Sıfırla" onPress={onReset} danger />
      </View>

      <Modal visible={menuOpen} animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.menu}>
            <Text style={styles.menuTitle}>Zikir Seç</Text>
            {ZIKIRS.map((z) => (
              <Pressable
                key={z.id}
                onPress={() => setState((s) => ({ ...s, zikirId: z.id }))}
                style={[styles.item, z.id === zikir.id && styles.itemActive]}
              >
                <Text style={styles.itemText}>{z.name}</Text>
                <Text style={styles.itemSub}>{(state.counts[z.id]?.total ?? 0)} toplam</Text>
              </Pressable>
            ))}

            <Text style={styles.menuTitle}>Hedef</Text>
            <View style={styles.chips}>
              {TARGETS.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTarget(t)}
                  style={[styles.chip, t === target && styles.chipActive]}
                >
                  <Text style={styles.chipText}>{t === 0 ? '∞' : t}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.customRow}>
              <TextInput
                value={customTarget}
                onChangeText={(t) => setCustomTarget(t.replace(/[^0-9]/g, ''))}
                placeholder="Özel hedef"
                placeholderTextColor="#6b7a77"
                keyboardType="number-pad"
                style={styles.input}
                onSubmitEditing={applyCustomTarget}
              />
              <Pressable onPress={applyCustomTarget} style={styles.chip}>
                <Text style={styles.chipText}>Ayarla</Text>
              </Pressable>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.itemText}>Titreşim</Text>
              <Switch
                value={state.vibration}
                onValueChange={(v) => setState((s) => ({ ...s, vibration: v }))}
              />
            </View>

            <Pressable onPress={() => setMenuOpen(false)} style={styles.close}>
              <Text style={styles.closeText}>Tamam</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const Stat = ({ label, value }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ActionButton = ({ label, onPress, danger }) => (
  <Pressable onPress={onPress} style={[styles.action, danger && styles.actionDanger]}>
    <Text style={styles.actionText}>{label}</Text>
  </Pressable>
);

const GREEN = '#1f8f6b';
const BG = '#0b1f1a';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { alignItems: 'center', paddingTop: 24 },
  zikirPicker: { alignItems: 'center', padding: 8 },
  zikirName: { color: '#fff', fontSize: 28, fontWeight: '700' },
  zikirHint: { color: '#7fb5a3', fontSize: 12, marginTop: 4 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, paddingHorizontal: 16 },
  stat: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '600' },
  statLabel: { color: '#7fb5a3', fontSize: 12, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bigButton: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: '#2fc299',
    elevation: 8,
  },
  bigButtonPressed: { backgroundColor: '#187556' },
  count: { color: '#fff', fontSize: 72, fontWeight: '800' },
  countSub: { color: '#c8efe3', fontSize: 20, marginTop: -4 },
  bar: { width: 260, height: 8, borderRadius: 4, backgroundColor: '#17352d', marginTop: 28, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#2fc299' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingBottom: 32 },
  action: { backgroundColor: '#17352d', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14 },
  actionDanger: { backgroundColor: '#4a1f1f' },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  menu: { padding: 20 },
  menuTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 10 },
  item: {
    backgroundColor: '#12302a',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemActive: { borderWidth: 2, borderColor: '#2fc299' },
  itemText: { color: '#fff', fontSize: 16 },
  itemSub: { color: '#7fb5a3', fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#12302a', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20 },
  chipActive: { backgroundColor: GREEN },
  chipText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  customRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: '#12302a',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  close: { backgroundColor: GREEN, padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 28 },
  closeText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActionButton,
  colors,
  Field,
  LargeTitle,
  ListRow,
  Notice,
  Section,
  Separator,
  ui,
} from '../components/ui';
import { loadLists } from '../services/bringApi';
import {
  DEFAULT_LOOKUP_PREFERENCES,
  loadCredentials,
  loadCustomBarcodes,
  loadLookupPreferences,
  loadSelectedList,
  saveCredentials,
  saveCustomBarcodes,
  saveLookupPreferences,
  saveSelectedList,
} from '../services/storage';
import { BringList, CustomBarcode, LabelStyle, LookupPreferences, ProductLanguage } from '../types';
import { PRODUCT_DATABASES } from '../productDatabases';
import { APP_LANGUAGES, connectionError, translate, useI18n } from '../i18n';

const LANGUAGES: { value: ProductLanguage; title: string }[] = [
  { value: 'auto', title: 'Automatic' },
  { value: 'de', title: 'German' },
  { value: 'en', title: 'English' },
  { value: 'fr', title: 'French' },
  { value: 'it', title: 'Italian' },
];
const LABEL_STYLES: { value: LabelStyle; title: string; detail: string }[] = [
  { value: 'generic', title: 'Generic', detail: 'Toilet paper' },
  { value: 'exact', title: 'Exact Product', detail: 'Brand, variant and quantity' },
  { value: 'ask', title: 'Ask Every Time', detail: 'Start with the exact name and edit it' },
];

export function SettingsScreen() {
  const { language: appLanguage, setLanguage: setAppLanguage, t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lists, setLists] = useState<BringList[]>([]);
  const [selected, setSelected] = useState<BringList | null>(null);
  const [barcode, setBarcode] = useState('');
  const [label, setLabel] = useState('');
  const [custom, setCustom] = useState<CustomBarcode[]>([]);
  const [preferences, setPreferences] = useState<LookupPreferences>(DEFAULT_LOOKUP_PREFERENCES);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {
    Promise.all([
      loadCredentials(),
      loadSelectedList(),
      loadCustomBarcodes(),
      loadLookupPreferences(),
    ]).then(([c, l, b, p]) => {
      if (c) {
        setEmail(c.email);
        setPassword(c.password);
      }
      setSelected(l);
      setCustom(b);
      setPreferences(p);
    });
  }, []);
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(''), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  async function connect() {
    if (!email.trim() || !password) return setError(t('enterCredentials'));
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const result = await loadLists({ email, password });
      await saveCredentials({ email: email.trim(), password });
      setLists(result);
      setSuccess(t('connectedChoose'));
    } catch {
      setError(connectionError(appLanguage));
    } finally {
      setBusy(false);
    }
  }
  async function choose(list: BringList) {
    await saveSelectedList(list);
    setSelected(list);
    setSuccess(t('selected', { name: list.name }));
  }
  async function addCustom() {
    const clean = barcode.replace(/\D/g, '');
    if (!/^\d{8,14}$/.test(clean) || !label.trim()) return setError(t('invalidCustom'));
    const next = [
      ...custom.filter((item) => item.barcode !== clean),
      { barcode: clean, label: label.trim() },
    ];
    await saveCustomBarcodes(next);
    setCustom(next);
    setBarcode('');
    setLabel('');
    setError('');
    setSuccess(t('customSaved'));
  }
  function removeCustom(value: string) {
    Alert.alert(t('removeCustomTitle'), t('removeCustomBody'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('remove'),
        style: 'destructive',
        onPress: async () => {
          const next = custom.filter((item) => item.barcode !== value);
          await saveCustomBarcodes(next);
          setCustom(next);
          setError('');
          setSuccess(t('customRemoved'));
        },
      },
    ]);
  }
  async function updatePreferences(update: Partial<LookupPreferences>, confirmation: string) {
    const next = { ...preferences, ...update };
    setPreferences(next);
    await saveLookupPreferences(next);
    setError('');
    setSuccess(confirmation);
  }

  return (
    <SafeAreaView edges={['top']} style={ui.safe}>
      <View style={ui.header}>
        <LargeTitle>{t('settings')}</LargeTitle>
      </View>
      {(error || success) && (
        <View pointerEvents="none" style={styles.statusSlot}>
          {error ? <Notice>{error}</Notice> : <Notice kind="success">{success}</Notice>}
        </View>
      )}
      <ScrollView
        style={ui.screen}
        contentContainerStyle={ui.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Section title={t('appLanguage')}>
          {APP_LANGUAGES.map((option, index) => (
            <View key={option.value}>
              {index > 0 ? <Separator /> : null}
              <ListRow
                title={option.name}
                selected={appLanguage === option.value}
                onPress={async () => {
                  await setAppLanguage(option.value);
                  setSuccess(translate(option.value, 'languageSaved', { language: option.name }));
                }}
              />
            </View>
          ))}
        </Section>
        <Section title={t('bringAccount')} footer={t('accountFooter')}>
          <Field
            label={t('email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="username"
            placeholder="you@example.com"
          />
          <Separator />
          <Field
            label={t('password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            placeholder={t('required')}
          />
          <Separator />
          <ActionButton title={t('connectLoad')} onPress={connect} loading={busy} />
        </Section>
        {(lists.length > 0 || selected) && (
          <Section title={t('shoppingList')} footer={t('listFooter')}>
            {selected && !lists.some((l) => l.listUuid === selected.listUuid) && (
              <ListRow title={selected.name} selected />
            )}
            {lists.map((list, index) => (
              <View key={list.listUuid}>
                {index > 0 || (selected && !lists.some((l) => l.listUuid === selected.listUuid)) ? (
                  <Separator />
                ) : null}
                <ListRow
                  title={list.name}
                  selected={selected?.listUuid === list.listUuid}
                  onPress={() => choose(list)}
                />
              </View>
            ))}
          </Section>
        )}
        <Section title={t('productLanguage')} footer={t('productLanguageFooter')}>
          {LANGUAGES.map((option, index) => {
            const key = (
              {
                auto: 'automatic',
                de: 'german',
                en: 'english',
                fr: 'french',
                it: 'italian',
              } as const
            )[option.value];
            const title = t(key);
            return (
              <View key={option.value}>
                {index > 0 ? <Separator /> : null}
                <ListRow
                  title={title}
                  selected={preferences.language === option.value}
                  onPress={() =>
                    updatePreferences(
                      { language: option.value },
                      t('languageSet', { language: title }),
                    )
                  }
                />
              </View>
            );
          })}
        </Section>
        <Section title={t('bringItemLabel')} footer={t('labelFooter')}>
          {LABEL_STYLES.map((style, index) => {
            const keys = (
              {
                generic: ['generic', 'genericExample'],
                exact: ['exactProduct', 'exactDetail'],
                ask: ['askEveryTime', 'askDetail'],
              } as const
            )[style.value];
            const title = t(keys[0]);
            return (
              <View key={style.value}>
                {index > 0 ? <Separator /> : null}
                <ListRow
                  title={title}
                  detail={t(keys[1])}
                  selected={preferences.labelStyle === style.value}
                  onPress={() =>
                    updatePreferences({ labelStyle: style.value }, t('labelSet', { style: title }))
                  }
                />
              </View>
            );
          })}
        </Section>
        <Section title={t('addCustomBarcode')} footer={t('customFooter')}>
          <Field
            label={t('barcode')}
            value={barcode}
            onChangeText={setBarcode}
            keyboardType="number-pad"
            placeholder="7612345678901"
          />
          <Separator />
          <Field
            label={t('bringLabel')}
            value={label}
            onChangeText={setLabel}
            placeholder={t('productName')}
          />
          <Separator />
          <ActionButton title={t('saveCustom')} onPress={addCustom} />
        </Section>
        {custom.length > 0 && (
          <Section title={t('savedBarcodes')}>
            {custom.map((item, index) => (
              <View key={item.barcode}>
                {index > 0 ? <Separator /> : null}
                <ListRow
                  title={item.label}
                  detail={item.barcode}
                  trailing={
                    <Pressable
                      accessibilityRole="button"
                      hitSlop={10}
                      onPress={() => removeCustom(item.barcode)}
                    >
                      <Text style={styles.delete}>{t('delete')}</Text>
                    </Pressable>
                  }
                />
              </View>
            ))}
          </Section>
        )}
        <Section title={t('productDatabases')} footer={t('databaseFooter')}>
          {PRODUCT_DATABASES.map((database, index) => {
            const description = t(
              (
                {
                  'Open Food Facts': 'foodDb',
                  'Open Products Facts': 'productsDb',
                  'Open Beauty Facts': 'beautyDb',
                  'Open Pet Food Facts': 'petDb',
                } as const
              )[database.name],
            );
            return (
              <View key={database.url}>
                {index > 0 ? <Separator /> : null}
                <ListRow
                  title={database.name}
                  detail={description}
                  onPress={() => Linking.openURL(database.url)}
                  trailing={<Text style={styles.open}>{t('open')}</Text>}
                />
              </View>
            );
          })}
        </Section>
        <Text style={styles.disclaimer}>{t('disclaimer')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  statusSlot: { position: 'absolute', zIndex: 10, bottom: 12, left: 16, right: 16 },
  open: { color: colors.tint, fontSize: 15, fontWeight: '500' },
  delete: { color: colors.destructive, fontSize: 15 },
  disclaimer: {
    color: colors.secondaryLabel,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginHorizontal: 18,
    marginBottom: 12,
  },
});

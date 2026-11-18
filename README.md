# Zikirmatik

React Native (Expo) ile yazılmış zikirmatik uygulaması.

## Özellikler
- Büyük dokunma butonu, titreşim (haptik) geri bildirimi
- Hazır zikirler (Sübhanallah, Elhamdülillah, Allahu Ekber, ...) ve serbest zikir
- Hedef seçimi (33, 99, 100, 500, 1000, ∞ veya özel); hedefe ulaşınca tur sayılır
- Her zikir için ayrı sayaç, tur ve toplam
- Geri al / sıfırla
- Veriler cihazda saklanır (uygulama kapanınca kaybolmaz)

## Çalıştırma
```
npm install
npx expo start
```
Telefonda Expo Go ile QR kodu okutun; veya `npm run android` / `npm run ios`.

## iOS / TestFlight yayını (EAS)

Gereken: Apple Developer hesabı (ücretli), Expo hesabı.

Tek seferlik kurulum (kendi bilgisayarınızda):
```
npm install -g eas-cli
eas login
eas init                      # projeyi Expo hesabınıza bağlar (app.json'a projectId yazar, commit'leyin)
eas build -p ios --profile production   # Apple girişi sorulur; sertifika/profil otomatik oluşturulur
eas submit -p ios --latest    # App Store Connect'te uygulama kaydını oluşturur ve TestFlight'a yükler
```
Sonraki sürümler otomatik: GitHub → Settings → Secrets → Actions içine `EXPO_TOKEN`
(expo.dev → Account Settings → Access Tokens) ekleyin, sonra `git tag v1.0.1 && git push --tags`
ya da Actions sekmesinden "iOS → TestFlight" iş akışını elle çalıştırın.
Gönderim için Apple API anahtarı `eas submit` ilk çalıştırmada kaydedilir.

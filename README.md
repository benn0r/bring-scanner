# Bring Scanner

> [!IMPORTANT]
> **This entire repository, including the application, design, tests, documentation, and deployment setup was made with AI.**

An unofficial React Native iOS companion that scans EAN/UPC barcodes, resolves product names, and adds them to a selected Bring shopping list.

![Bring Scanner with fantasy product data](docs/screenshot.svg)

## Features

- EAN-8, EAN-13, UPC-A, and UPC-E scanning with the device camera
- Free product lookup through Open Food Facts
- Custom barcode-to-label mappings that override online results
- Bring credential entry and shopping-list selection
- Keychain-backed credential storage with `expo-secure-store`
- Confirmation before an item is added, including the EAN as its specification

## Run locally

Requirements: Node.js 22, npm, Xcode, and an iPhone or iOS simulator. A physical device is needed for camera scanning.

```sh
npm ci
npm run ios
```

Run verification with:

```sh
npm run typecheck
npm test
npm run test:e2e
npm run build
```

## Privacy and service notes

Credentials are stored only in secure device storage and are never written to source files or regular app storage. Shopping-list selection and custom barcode mappings remain on the device.

Bring does not provide a documented public API for its shopping-list app. This project uses an isolated, unofficial adapter based on the web API and may stop working when that API changes. It is not affiliated with or endorsed by Bring! Labs AG.

Product information comes from [Open Food Facts](https://world.openfoodfacts.org/) and is available under the Open Database License. Coverage and labels vary by country and contributor data.

## License

MIT — see [LICENSE](LICENSE).

# Smart POS Mobile - Production Flutter Application

A cross-platform mobile retail Point of Sale (POS) application built with **Flutter**, **Dart**, **Drift (SQLite)**, and **Cloud Firestore**.

## Features Included
- **High-Speed POS Terminal**: Fast multi-category search, barcode lookup, cart management, line discounts.
- **Multi-Rail Payments**: Cash tender & change calculation, JazzCash & Easypaisa QR, Raast EMVCo dynamic QR code, Card POS, and Udhaar (Customer Credit).
- **Offline First**: Drift SQLite schema with background sync queue to Cloud Firestore.
- **ESC/POS Hardware Thermal Printing**: 58mm / 80mm ESC/POS command stream, partial cutter, and RJ11/12 cash drawer solenoid kick pulse.
- **Khata Ledger**: Customer Udhaar balance tracking, repayment ("Wasooli") recording, and 1-tap WhatsApp reminders.
- **Daily Closing Z-Report**: Cash drawer float reconciliation (balanced, shortage, overage) and shift close slips.
- **Camera & USB Barcode Scanning**: `mobile_scanner` with laser viewfinder overlay and USB HID wedge listener.

## How to Run

### 1. Install Dependencies
```bash
flutter pub get
```

### 2. Generate Drift Database Code
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

### 3. Run on Mobile Device or Emulator
```bash
# Android Device / Emulator
flutter run -d android

# iOS Simulator / Device
flutter run -d ios

# Web
flutter run -d chrome
```

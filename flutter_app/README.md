# Smart POS Pro - Production Flutter Mobile Application

A cross-platform multi-tenant SaaS retail Point of Sale (POS) mobile application built with **Flutter**, **Dart**, **Provider**, and **Cloud Firestore**.

## Features Included
- **Multi-Tenant SaaS Subscriptions & Super Admin Approval**: Launches into the SaaS Auth Portal (`Business Login`, `Register & Plan`, `Admin Login`). New businesses choose a monthly subscription plan and pay before registration; requests go to the **Super Admin Console** (`admin@omnipos.pk` / `Admin@2026#`) for Approve (30 days), Reject, Block, Unblock, or Complete Month. When the 1-month period completes or Admin blocks access, login is automatically blocked/logged out while **all business data stays intact** until renewed.
- **Subscription Plan Feature Gating (`Starter Monthly` vs `Business Pro Monthly`)**:
  - **Starter Monthly (PKR 2,500/mo)**: Enables 1 Storefront, Cashier POS Terminal & Barcode Scanner, Inventory Catalog, Customers & Khata (searchable), Suppliers, Operating Expenses, Sales & Refunds, Store Dashboard, Daily Z-Report, and PDF / ESC/POS Receipts. Disables Multi-Branch stores, Custom Cashiers & Managers, P&L & Margins analytics, Near-Expiry Alerts, and Cloud Firestore sync.
  - **Business Pro Monthly (PKR 4,900/mo)**: Unlocks Multi-Branch stores, Custom Cashiers & Optional Managers, P&L & Margins analytics, Near-Expiry alert banners/filters, and live Cloud Firestore sync. Includes an in-app **Upgrade Pro** submission dialog routed to Super Admin approval.
- **Per-Business Staff Management (Business Pro)**: Business owners create and manage their own Cashiers and optional Managers scoped strictly to their store (no hardcoded global staff).
- **City Support Including Mianwali**: Business registration, onboarding wizard, and branch creation include Mianwali plus 45+ regional cities and custom city fallback.
- **Interactive Smart POS HUD Logo**: Animated optical barcode scanner badge with haptic pulse & diagnostics modal (Cloud Sync engine / Starter Local status, thermal roll width, Z-Report, audio mute toggle).
- **Accurate & Intelligent Barcode Scanner**: Normalized barcode matching detects catalog items cleanly, opens the Quantity Prompt dialog, and pushes entered quantities straight into the cart. Supports online product lookup (OpenFoodFacts, OpenProductsFacts, OpenBeautyFacts, UPCitemdb) when adding new products.
- **Product Expiry Date & Near-Expiry Alerts (Business Pro)**: Track optional product expiry dates in Inventory, surface expired and ≤30-day near-expiry warning banners and badges on the Dashboard & Inventory screens.
- **Cashier POS Terminal & Optional Discount**: Responsive mobile layout (`320px+`), Catalog | Cart segmented toggle, dynamic store categories, Held Sales pause/resume, item discounts & notes, optional Bill Discount toggle (Flat / %) alongside optional GST toggle, and searchable Khata Customer picker.
- **Multi-Rail Payments & Searchable Khata**: Cash tender, JazzCash & Easypaisa QR, Raast QR, Card POS, Split Payment, Udhaar / Khata credit with real-time search by customer name, phone, or address, Wasooli repayment recording, and WhatsApp reminders.
- **PDF Receipts & ESC/POS Thermal Printing**: Generate formatted PDF thermal/A4 receipts (`pdf` + `path_provider`) and share directly as `.pdf` files to WhatsApp via `share_plus`, alongside 58mm / 80mm ESC/POS output (`EscPosService`).
- **Durable Local Persistence & Session Auto-Restore**: All business profiles, admin approvals, staff accounts, inventory, sales, Khata ledgers, suppliers, expenses, and active login sessions are persisted automatically via `shared_preferences` (plus Cloud Firestore sync/hydration when enabled), so closing and restarting the app restores your session and business data without losing records or requiring re-registration.
- **Sales Returns & Z-Report**: Partial & full item returns with auto-restock, P&L margin income statement (Business Pro), and end-of-day till cash drawer reconciliation.

## How to Run

1. Navigate to the Flutter project directory:
```bash
cd flutter_app
```
2. Install packages (`shared_preferences`, `pdf`, `http`, `path_provider`, `mobile_scanner`, `share_plus`, `provider`, etc.):
```bash
flutter pub get
```
3. Run on a connected Android/iOS device or emulator:
```bash
flutter run
```

*(Note: Ensure Camera permission for `mobile_scanner` and Internet permission for online barcode lookup are enabled in `android/app/src/main/AndroidManifest.xml` / `ios/Runner/Info.plist`. Cloud Firestore sync automatically falls back to local offline mode if `google-services.json` / `GoogleService-Info.plist` is not configured yet, so the app launches cleanly out of the box.)*

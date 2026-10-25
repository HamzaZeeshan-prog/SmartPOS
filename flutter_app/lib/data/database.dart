import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

part 'database.g.dart';

// Drift Tables
class Products extends Table {
  TextColumn get id => text()();
  TextColumn get shopId => text()();
  TextColumn get barcode => text()();
  TextColumn get name => text()();
  TextColumn get category => text()();
  TextColumn get brand => text()();
  RealColumn get costPrice => real()();
  RealColumn get sellingPrice => real()();
  RealColumn get taxPercentage => real().withDefault(const Constant(0.0))();
  IntColumn get stockQuantity => integer()();
  IntColumn get minimumStockLimit => integer().withDefault(const Constant(5))();
  TextColumn get unit => text().withDefault(const Constant('piece'))();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class Customers extends Table {
  TextColumn get id => text()();
  TextColumn get shopId => text()();
  TextColumn get name => text()();
  TextColumn get phone => text()();
  RealColumn get dueBalance => real().withDefault(const Constant(0.0))();
  IntColumn get loyaltyPoints => integer().withDefault(const Constant(0))();
  RealColumn get totalPurchases => real().withDefault(const Constant(0.0))();

  @override
  Set<Column> get primaryKey => {id};
}

class Sales extends Table {
  TextColumn get id => text()();
  TextColumn get shopId => text()();
  TextColumn get invoiceNumber => text()();
  DateTimeColumn get createdAt => dateTime()();
  TextColumn get cashierName => text()();
  TextColumn get customerName => text().nullable()();
  RealColumn get grandTotal => real()();
  TextColumn get paymentMethod => text()();
  BoolColumn get isRefunded => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}

class SyncQueue extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get entityType => text()();
  TextColumn get entityId => text()();
  TextColumn get action => text()(); // create, update, delete
  TextColumn get payload => text()();
  DateTimeColumn get createdAt => dateTime()();
  BoolColumn get isSynced => boolean().withDefault(const Constant(false))();
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'smart_pos.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}

@DriftDatabase(tables: [Products, Customers, Sales, SyncQueue])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;
}

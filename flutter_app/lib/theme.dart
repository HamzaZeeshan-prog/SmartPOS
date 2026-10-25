import 'package:flutter/material.dart';

class AppTheme {
  static const Color slate950 = Color(0xFF020617);
  static const Color slate900 = Color(0xFF0F172A);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate700 = Color(0xFF334155);
  static const Color slate600 = Color(0xFF475569);
  static const Color slate500 = Color(0xFF64748B);
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color slate300 = Color(0xFFCBD5E1);
  static const Color slate200 = Color(0xFFE2E8F0);
  static const Color slate100 = Color(0xFFF1F5F9);

  static const Color blue600 = Color(0xFF2563EB);
  static const Color blue500 = Color(0xFF3B82F6);
  static const Color blue400 = Color(0xFF60A5FA);
  static const Color blue300 = Color(0xFF93C5FD);

  static const Color emerald600 = Color(0xFF059669);
  static const Color emerald500 = Color(0xFF10B981);
  static const Color emerald400 = Color(0xFF34D399);
  static const Color emerald300 = Color(0xFF6EE7B7);

  static const Color rose600 = Color(0xFFE11D48);
  static const Color rose500 = Color(0xFFF43F5E);
  static const Color rose400 = Color(0xFFFB7185);

  static const Color amber500 = Color(0xFFF59E0B);
  static const Color amber400 = Color(0xFFFBBF24);

  static const Color indigo600 = Color(0xFF4F46E5);
  static const Color indigo500 = Color(0xFF6366F1);
  static const Color indigo400 = Color(0xFF818CF8);

  static const Color purple600 = Color(0xFF9333EA);
  static const Color purple400 = Color(0xFFC084FC);

  static ThemeData get darkTheme => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: slate950,
        colorScheme: const ColorScheme.dark(
          primary: blue600,
          secondary: emerald500,
          surface: slate900,
          error: rose600,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: slate900,
          elevation: 0,
          surfaceTintColor: Colors.transparent,
        ),
        cardTheme: CardThemeData(
          color: slate800,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
        chipTheme: ChipThemeData(
          backgroundColor: slate800,
          selectedColor: blue600,
          labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: slate950,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: slate800),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: slate800),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: blue600),
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          labelStyle: const TextStyle(color: slate400, fontSize: 12),
        ),
        textTheme: const TextTheme(
          bodyLarge: TextStyle(color: slate100),
          bodyMedium: TextStyle(color: slate200),
          bodySmall: TextStyle(color: slate400),
          titleLarge: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          titleMedium: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          titleSmall: TextStyle(color: slate200, fontWeight: FontWeight.bold),
        ),
      );
}

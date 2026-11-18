import 'dart:typed_data';
import 'package:share_plus/share_plus.dart';

Future<void> sharePdfBytes({
  required Uint8List bytes,
  required String fileName,
  required String subject,
  required String text,
}) async {
  await SharePlus.instance.share(
    ShareParams(
      files: [
        XFile.fromData(
          bytes,
          mimeType: 'application/pdf',
          name: fileName,
        ),
      ],
      subject: subject,
      text: text,
    ),
  );
}

import JSZip from 'jszip';

export interface FlutterFile {
  path: string;
  content: string;
  sizeBytes: number;
}

const rawFlutterModules = import.meta.glob<string>(
  [
    '/flutter_app/pubspec.yaml',
    '/flutter_app/README.md',
    '/flutter_app/lib/**/*.dart',
    '/flutter_app/**/*.yaml',
    '/flutter_app/**/*.md',
  ],
  { query: '?raw', import: 'default', eager: true }
);

export const FLUTTER_PROJECT_FILES: FlutterFile[] = Object.entries(rawFlutterModules)
  .map(([fullPath, content]) => ({
    path: fullPath.replace(/^\/flutter_app\//, ''),
    content,
    sizeBytes: new Blob([content]).size,
  }))
  .sort((a, b) => a.path.localeCompare(b.path));

export async function generateFlutterProjectZipBlob(): Promise<{ blob: Blob; fileCount: number; fileName: string }> {
  const zip = new JSZip();
  const folder = zip.folder('flutter_app');

  FLUTTER_PROJECT_FILES.forEach((file) => {
    folder?.file(file.path, file.content);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  const fileName = `Smart_POS_Flutter_Mobile_App_${new Date().toISOString().slice(0, 10)}.zip`;
  return {
    blob,
    fileCount: FLUTTER_PROJECT_FILES.length,
    fileName,
  };
}

export async function downloadFlutterProjectZip(): Promise<void> {
  const { blob, fileName } = await generateFlutterProjectZipBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

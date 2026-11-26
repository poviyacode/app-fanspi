import { rmSync, existsSync, copyFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

// 1. Limpiar carpeta dist para eliminar cualquier archivo o chunk huérfano
if (existsSync('dist')) {
  rmSync('dist', { recursive: true, force: true });
}

// 2. Compilar Angular
execSync('ng build', { stdio: 'inherit' });

// 3. Asegurar que index.html exista en browser copiando index.csr.html si es necesario
const csrIndex = 'dist/app_fanspi/browser/index.csr.html';
const targetIndex = 'dist/app_fanspi/browser/index.html';
if (existsSync(csrIndex) && !existsSync(targetIndex)) {
  copyFileSync(csrIndex, targetIndex);
}

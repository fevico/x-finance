const fs = require('fs');
const path = require('path');

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src).forEach((item) => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

const staticDirs = [
  { src: path.join(__dirname, 'src', 'pdf', 'templates'), dest: path.join(__dirname, 'dist', 'src', 'pdf', 'templates') },
  { src: path.join(__dirname, 'src', 'pdf', 'styles'), dest: path.join(__dirname, 'dist', 'src', 'pdf', 'styles') },
];

staticDirs.forEach(({ src, dest }) => {
  if (fs.existsSync(src)) {
    copyDirSync(src, dest);
    console.log(`Copied ${src} to ${dest}`);
  }
});

const path = require('path');
const rceditModule = require('rcedit');

const rcedit = rceditModule.rcedit || rceditModule.default || rceditModule;

module.exports = async function afterPack(context) {
  if (!context || context.electronPlatformName !== 'win32') {
    return;
  }

  const projectDir = context.packager.projectDir;
  const productFilename = context.packager.appInfo.productFilename;
  const executablePath = path.join(context.appOutDir, `${productFilename}.exe`);
  const iconPath = path.join(projectDir, 'build', 'app-icon.ico');

  await rcedit(executablePath, {
    icon: iconPath,
    'product-version': context.packager.appInfo.version,
    'file-version': context.packager.appInfo.version
  });
};
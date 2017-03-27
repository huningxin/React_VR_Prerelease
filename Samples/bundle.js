/**
 * Produces production builds of the React application (index.vr.js) and the
 * client-side implementation (client.js).
 */

'use strict';

const child_process = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

function buildScript(root, input, output) {
  // Allow overriding the CLI location with an env variable
  const cliLocation = process.env.RN_CLI_LOCATION ||
    path.resolve('node_modules', 'react-native', 'local-cli', 'cli.js');
  return new Promise((resolve, reject) => {
    const npm = child_process.spawn(
      (/^win/.test(process.platform) ? 'node.exe' : 'node'),
      [
        cliLocation,
        'bundle',
        '--entry-file',
        input,
        '--platform',
        'vr',
        '--bundle-output',
        output,
        '--dev',
        'false'
      ],
      {stdio: 'inherit', cwd: root}
    );
    npm.on('close', (code) => {
      if (code !== 0) {
        reject(code);
      }
      resolve();
    });
  });
}

function hasIndexVRJs(project_dir, build_dir) {
  var indexVRJsPath;

  if (build_dir.length === 0) {
    indexVRJsPath = path.join(project_dir, 'index.vr.js');
  } else {
    indexVRJsPath = path.join(project_dir, build_dir, 'index.vr.js');
  }

  try {
    fs.statSync(indexVRJsPath);
  } catch (e) {
    return false;
  }
  return true;
}

let projectDir = process.cwd();

var build_dir = '';

if (process.argv.length > 2) {
  build_dir = process.argv[2];
}

console.log('build dir is : ' + build_dir);
while (!hasIndexVRJs(projectDir, build_dir)) {
  const next = path.join(projectDir, '..');
  if (projectDir === next) {
    console.log('Could not find a React VR project directory');
    process.exit(1);
  }
  projectDir = path.join(projectDir, '..');
}

new Promise((resolve, reject) => {
  if (build_dir.length > 0) {
    projectDir = path.join(projectDir, build_dir);
  }

  const buildDir = path.join(projectDir, 'vr', 'build');

  try {
    const stat = fs.statSync(buildDir);
    if (stat.isDirectory()) {
      return resolve();
    }
  } catch (e) {}
  fs.mkdir(path.join(projectDir, 'vr', 'build'), (err) => {
    if (err) {
      console.log('Failed to create `vr/build` directory');
      return reject(1);
    }
    resolve();
  });
}).then(() => {
  return Promise.all([
    buildScript(
      projectDir,
      path.resolve(projectDir, 'index.vr.js'),
      path.resolve(projectDir, 'vr', 'build', 'index.bundle.js')
    ),
    buildScript(
      projectDir,
      path.resolve(projectDir, 'vr', 'client.js'),
      path.resolve(projectDir, 'vr', 'build', 'client.bundle.js')
    ),
  ]);
}).then(() => {
  console.log(
    'Production versions were successfully built.' +
    'They can be found at ' + path.resolve(projectDir, 'vr', 'build')
  );
}).catch((err) => {
  console.log(
    'An error occurred during the bundling process. Exited with code ' + err +
    '.\nLook at the packager output above to see what went wrong.'
  );
  process.exit(1);
});

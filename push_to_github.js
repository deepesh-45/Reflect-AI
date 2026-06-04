const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');

const workspaceDir = __dirname;
const token = process.argv[2];

if (!token) {
  console.error("Error: GitHub Personal Access Token is required.");
  console.error("Usage: node push_to_github.js <your_github_token>");
  process.exit(1);
}

// Ignore list
const ignoredDirs = ['.git', 'node_modules', 'dist', '.DS_Store', 'build'];
const ignoredFiles = ['.env', '.DS_Store'];

function getFiles(dir, allFiles = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(workspaceDir, fullPath);
    
    if (ignoredDirs.some(ignored => relPath === ignored || relPath.startsWith(ignored + path.sep))) {
      continue;
    }
    if (ignoredFiles.some(ignored => relPath === ignored || file === ignored)) {
      continue;
    }

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getFiles(fullPath, allFiles);
    } else {
      allFiles.push(relPath);
    }
  }
  return allFiles;
}

async function run() {
  try {
    console.log("Initializing git repository...");
    await git.init({ fs, dir: workspaceDir });

    console.log("Scanning workspace for files...");
    const files = getFiles(workspaceDir);
    console.log(`Found ${files.length} files to commit.`);

    console.log("Adding files to git index...");
    for (const file of files) {
      await git.add({ fs, dir: workspaceDir, filepath: file });
    }

    console.log("Creating commit...");
    const sha = await git.commit({
      fs,
      dir: workspaceDir,
      author: {
        name: 'Deepesh Patel',
        email: 'deepeshpatel@reflectai.app'
      },
      message: 'Initial commit: ReflectAI wellness portal'
    });
    console.log(`Commit created successfully: ${sha}`);

    console.log("Setting remote...");
    try {
      await git.deleteRemote({ fs, dir: workspaceDir, remote: 'origin' });
    } catch (e) {}

    await git.addRemote({
      fs,
      dir: workspaceDir,
      remote: 'origin',
      url: 'https://github.com/deepesh-45/Reflect-AI.git'
    });

    console.log("Pushing to GitHub remote...");
    const pushResult = await git.push({
      fs,
      http,
      dir: workspaceDir,
      remote: 'origin',
      ref: 'refs/heads/main',
      force: true,
      onAuth: () => ({ username: token })
    });

    console.log("Push complete!", pushResult);
  } catch (error) {
    console.error("Failed to push to GitHub:", error);
  }
}

run();

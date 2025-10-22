#!/usr/bin/env node
/**
 * 发布脚本
 * 自动化版本发布流程
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface PackageJson {
  name: string;
  version: string;
  [key: string]: any;
}

/**
 * 执行命令
 */
function exec(command: string): string {
  console.log(`执行: ${command}`);
  return execSync(command, { encoding: 'utf-8' });
}

/**
 * 读取 package.json
 */
function readPackageJson(path: string): PackageJson {
  const content = readFileSync(join(path, 'package.json'), 'utf-8');
  return JSON.parse(content);
}

/**
 * 写入 package.json
 */
function writePackageJson(path: string, pkg: PackageJson): void {
  const content = JSON.stringify(pkg, null, 2);
  writeFileSync(join(path, 'package.json'), content + '\n');
}

/**
 * 更新版本
 */
function updateVersion(type: 'major' | 'minor' | 'patch'): string {
  console.log(`📦 更新版本: ${type}`);
  
  const pkg = readPackageJson('.');
  const [major, minor, patch] = pkg.version.split('.').map(Number);

  let newVersion: string;
  
  switch (type) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
  }

  pkg.version = newVersion;
  writePackageJson('.', pkg);

  console.log(`✅ 版本已更新: ${pkg.version} -> ${newVersion}`);
  return newVersion;
}

/**
 * 运行测试
 */
function runTests(): void {
  console.log('🧪 运行测试...');
  
  try {
    exec('npm run test');
    exec('npm run lint');
    exec('npm run type-check');
    console.log('✅ 所有测试通过');
  } catch (error) {
    console.error('❌ 测试失败');
    process.exit(1);
  }
}

/**
 * 构建包
 */
function build(): void {
  console.log('🔨 构建包...');
  
  try {
    exec('npm run clean');
    exec('npm run build');
    console.log('✅ 构建完成');
  } catch (error) {
    console.error('❌ 构建失败');
    process.exit(1);
  }
}

/**
 * 生成 changelog
 */
function generateChangelog(): void {
  console.log('📝 生成 CHANGELOG...');
  
  try {
    const gitLog = exec('git log --oneline -20');
    const lines = gitLog.trim().split('\n');
    
    const pkg = readPackageJson('.');
    const date = new Date().toISOString().split('T')[0];
    
    let changelog = `## [${pkg.version}] - ${date}\n\n`;
    changelog += '### Changes\n\n';
    
    lines.forEach(line => {
      changelog += `- ${line}\n`;
    });
    
    changelog += '\n';
    
    // 追加到 CHANGELOG.md
    const existingChangelog = readFileSync('CHANGELOG.md', 'utf-8').catch(() => '# Changelog\n\n');
    const newChangelog = changelog + existingChangelog;
    
    writeFileSync('CHANGELOG.md', newChangelog);
    console.log('✅ CHANGELOG 已更新');
  } catch (error) {
    console.warn('⚠️  生成 CHANGELOG 失败，继续发布流程');
  }
}

/**
 * Git 提交和标签
 */
function gitCommit(version: string): void {
  console.log('📤 Git 提交和标签...');
  
  try {
    exec('git add .');
    exec(`git commit -m "chore: release v${version}"`);
    exec(`git tag v${version}`);
    console.log('✅ Git 提交完成');
  } catch (error) {
    console.warn('⚠️  Git 提交失败');
  }
}

/**
 * 发布到 npm
 */
function publishToNpm(): void {
  console.log('📦 发布到 NPM...');
  
  const answer = prompt('确认发布到 NPM? (yes/no): ');
  if (answer?.toLowerCase() !== 'yes') {
    console.log('❌ 取消发布');
    return;
  }

  try {
    exec('npm publish --access public');
    console.log('✅ 发布到 NPM 成功');
  } catch (error) {
    console.error('❌ 发布失败');
    process.exit(1);
  }
}

/**
 * 主流程
 */
async function main() {
  console.log('🚀 开始发布流程...\n');

  const args = process.argv.slice(2);
  const versionType = (args[0] || 'patch') as 'major' | 'minor' | 'patch';

  if (!['major', 'minor', 'patch'].includes(versionType)) {
    console.error('❌ 版本类型必须是 major、minor 或 patch');
    process.exit(1);
  }

  // 1. 运行测试
  runTests();

  // 2. 更新版本
  const newVersion = updateVersion(versionType);

  // 3. 构建
  build();

  // 4. 生成 changelog
  generateChangelog();

  // 5. Git 提交
  gitCommit(newVersion);

  // 6. 发布到 NPM
  publishToNpm();

  console.log('\n✨ 发布流程完成！');
  console.log(`📦 新版本: v${newVersion}`);
}

// 运行
main().catch(error => {
  console.error('❌ 发布流程失败:', error);
  process.exit(1);
});


# Word Viewer 构建测试脚本

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Word Viewer 构建测试" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$packages = @("core", "vue", "react", "lit")
$results = @()

foreach ($package in $packages) {
    Write-Host "测试 $package 包..." -ForegroundColor Yellow
    Write-Host "----------------------------------------"
    
    Set-Location "packages\$package"
    
    # 构建包
    Write-Host "执行构建..." -ForegroundColor Gray
    npm run build 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $package 包构建成功" -ForegroundColor Green
        
        # 检查产物
        if (Test-Path "dist") {
            $files = Get-ChildItem -Path "dist" -Recurse -File
            Write-Host "   产物文件数: $($files.Count)" -ForegroundColor Gray
            
            # 检查关键文件
            $hasEsm = Test-Path "dist\esm"
            $hasCjs = Test-Path "dist\cjs"
            $hasDts = Test-Path "dist\index.d.ts"
            
            if ($hasEsm) { Write-Host "   ✓ ESM 格式" -ForegroundColor Green }
            if ($hasCjs) { Write-Host "   ✓ CJS 格式" -ForegroundColor Green }
            if ($hasDts) { Write-Host "   ✓ TypeScript 类型定义" -ForegroundColor Green }
            
            $results += [PSCustomObject]@{
                Package = $package
                Status = "成功"
                ESM = $hasEsm
                CJS = $hasCjs
                DTS = $hasDts
            }
        } else {
            Write-Host "   ⚠ dist 目录不存在" -ForegroundColor Yellow
            $results += [PSCustomObject]@{
                Package = $package
                Status = "部分成功"
                ESM = $false
                CJS = $false
                DTS = $false
            }
        }
    } else {
        Write-Host "❌ $package 包构建失败" -ForegroundColor Red
        $results += [PSCustomObject]@{
            Package = $package
            Status = "失败"
            ESM = $false
            CJS = $false
            DTS = $false
        }
    }
    
    Write-Host ""
    Set-Location "..\..\"
}

# 显示汇总
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "构建测试汇总" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$results | Format-Table -AutoSize

# 统计
$success = ($results | Where-Object { $_.Status -eq "成功" }).Count
$total = $results.Count
$percentage = [math]::Round(($success / $total) * 100, 2)

Write-Host ""
Write-Host "总计: $total 个包" -ForegroundColor Gray
Write-Host "成功: $success 个包" -ForegroundColor Green
Write-Host "成功率: $percentage%" -ForegroundColor $(if ($percentage -eq 100) { "Green" } else { "Yellow" })

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "下一步: 测试演示项目" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "运行以下命令启动演示项目:" -ForegroundColor Gray
Write-Host ""
Write-Host "cd packages\core\demo && npm install && npm run dev   # 端口 3001" -ForegroundColor Cyan
Write-Host "cd packages\vue\demo && npm install && npm run dev    # 端口 3002" -ForegroundColor Cyan
Write-Host "cd packages\react\demo && npm install && npm run dev  # 端口 3003" -ForegroundColor Cyan
Write-Host "cd packages\lit\demo && npm install && npm run dev    # 端口 3004" -ForegroundColor Cyan
Write-Host ""

# 保存结果到文件
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportFile = "build-test-result_$timestamp.txt"
$results | Format-Table -AutoSize | Out-File $reportFile
Write-Host "测试结果已保存到: $reportFile" -ForegroundColor Gray
Write-Host ""

@echo off
chcp 65001 >nul
title GreenLearn - Ket noi Antigravity
powershell -NoProfile -ExecutionPolicy Bypass -Command "$m='#PS1'+'START'; $s=[IO.File]::ReadAllText('%~f0',[Text.Encoding]::UTF8); $i=$s.IndexOf($m); Invoke-Expression $s.Substring($i)"
exit /b
#PS1START
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

# ================= CẤU HÌNH (chủ dự án sửa 1 lần trước khi phát hành) =================
$ServerName = 'greenlearn'
$ServerUrl  = 'https://jzwmgflmhtaceasqzfop.supabase.co/functions/v1/mcp'
# =======================================================================================

function Get-ConfigPath {
    $candidates = @(
        (Join-Path $env:USERPROFILE '.gemini\config\mcp_config.json'),
        (Join-Path $env:USERPROFILE '.gemini\antigravity\mcp_config.json')
    )
    foreach ($p in $candidates) { if (Test-Path $p) { return $p } }
    return $candidates[0]
}

function Read-Config($path) {
    if (Test-Path $path) {
        $raw = Get-Content $path -Raw -Encoding UTF8
        if ($raw -and $raw.Trim()) { return ($raw | ConvertFrom-Json) }
    }
    return [pscustomobject]@{}
}

function Save-Config($path, $cfg) {
    $dir = Split-Path $path
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    if (Test-Path $path) { Copy-Item $path "$path.bak" -Force }
    $json = $cfg | ConvertTo-Json -Depth 20
    [IO.File]::WriteAllText($path, $json, (New-Object Text.UTF8Encoding($false)))
}

function Get-Entry($cfg) {
    if ($cfg.PSObject.Properties['mcpServers'] -and $cfg.mcpServers.PSObject.Properties[$ServerName]) {
        return $cfg.mcpServers.$ServerName
    }
    return $null
}

function Test-Server($token) {
    $body = '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"ketnoianti","version":"1.0"}}}'
    try {
        $null = Invoke-WebRequest -Uri $ServerUrl -Method Post -Body $body -ContentType 'application/json' `
            -Headers @{ Authorization = "Bearer $token"; Accept = 'application/json, text/event-stream' } `
            -UseBasicParsing -TimeoutSec 15
        return @{ ok = $true; msg = 'Máy chủ phản hồi, token hợp lệ.' }
    } catch {
        $code = $null
        if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
        if ($code -eq 401 -or $code -eq 403) { return @{ ok = $false; msg = "Token sai hoặc đã bị thu hồi (HTTP $code)." } }
        if ($code) { return @{ ok = $false; msg = "Máy chủ trả về HTTP $code." } }
        return @{ ok = $false; msg = 'Không kết nối được máy chủ. Kiểm tra mạng hoặc địa chỉ máy chủ.' }
    }
}

function Pause-Menu { Write-Host ''; Read-Host 'Nhấn Enter để quay lại menu' | Out-Null }

function Do-Connect {
    $path = Get-ConfigPath
    Write-Host ''
    Write-Host 'Bước 1: Trong GreenLearn, vào Cài đặt > "Tạo token cho Antigravity" rồi copy token.' -ForegroundColor Cyan
    Write-Host 'Bước 2: Dán token vào đây (lúc gõ sẽ không hiện ký tự).' -ForegroundColor Cyan
    Write-Host ''
    $sec = Read-Host 'Token' -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
    try { $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    $token = $token.Trim()

    if (-not $token) { Write-Host 'Chưa nhập token.' -ForegroundColor Yellow; return }
    if ($token -notmatch '^gl_[A-Za-z0-9_\-]{16,}$') {
        Write-Host 'Cảnh báo: token không đúng dạng gl_xxxxx. Vẫn tiếp tục.' -ForegroundColor Yellow
    }

    Write-Host 'Đang kiểm tra token...' -ForegroundColor Gray
    $t = Test-Server $token
    if ($t.ok) { Write-Host $t.msg -ForegroundColor Green }
    else {
        Write-Host $t.msg -ForegroundColor Yellow
        $go = Read-Host 'Vẫn ghi vào cấu hình? (y/N)'
        if ($go -ne 'y' -and $go -ne 'Y') { return }
    }

    $cfg = Read-Config $path
    if (-not $cfg.PSObject.Properties['mcpServers']) {
        $cfg | Add-Member -NotePropertyName mcpServers -NotePropertyValue ([pscustomobject]@{})
    }
    $entry = [pscustomobject]@{
        serverUrl = $ServerUrl
        headers   = [pscustomobject]@{ Authorization = "Bearer $token" }
    }
    if ($cfg.mcpServers.PSObject.Properties[$ServerName]) { $cfg.mcpServers.$ServerName = $entry }
    else { $cfg.mcpServers | Add-Member -NotePropertyName $ServerName -NotePropertyValue $entry }

    Save-Config $path $cfg
    Write-Host ''
    Write-Host 'Đã kết nối xong.' -ForegroundColor Green
    Write-Host "File cấu hình: $path"
    Write-Host 'Bản sao lưu: ' ($path + '.bak')
    Write-Host 'Hãy khởi động lại Antigravity (hoặc bấm Refresh ở mục MCP Servers) để nhận cấu hình mới.' -ForegroundColor Cyan
}

function Do-Status {
    $path = Get-ConfigPath
    Write-Host ''
    Write-Host "File cấu hình: $path"
    if (-not (Test-Path $path)) { Write-Host 'Chưa có file cấu hình. Chọn 1 để kết nối.' -ForegroundColor Yellow; return }
    $entry = Get-Entry (Read-Config $path)
    if (-not $entry) { Write-Host 'GreenLearn: CHƯA kết nối.' -ForegroundColor Yellow; return }
    $auth = [string]$entry.headers.Authorization
    $tok = $auth -replace '^Bearer\s+', ''
    $tail = if ($tok.Length -ge 4) { $tok.Substring($tok.Length - 4) } else { '****' }
    Write-Host "GreenLearn: ĐÃ kết nối (token ...$tail)" -ForegroundColor Green
    Write-Host "Địa chỉ: $($entry.serverUrl)"
    $t = Test-Server $tok
    if ($t.ok) { Write-Host $t.msg -ForegroundColor Green } else { Write-Host $t.msg -ForegroundColor Yellow }
}

function Do-Disconnect {
    $path = Get-ConfigPath
    Write-Host ''
    if (-not (Test-Path $path)) { Write-Host 'Không có gì để gỡ.' -ForegroundColor Yellow; return }
    $cfg = Read-Config $path
    if (-not (Get-Entry $cfg)) { Write-Host 'GreenLearn chưa được kết nối.' -ForegroundColor Yellow; return }
    $cfg.mcpServers.PSObject.Properties.Remove($ServerName)
    Save-Config $path $cfg
    Write-Host 'Đã gỡ kết nối GreenLearn khỏi Antigravity.' -ForegroundColor Green
    Write-Host 'Nên vào GreenLearn > Cài đặt để thu hồi token này.' -ForegroundColor Cyan
}

if ($ServerUrl -like '*YOUR-PROJECT-REF*') {
    Write-Host 'File này chưa được cấu hình địa chỉ máy chủ ($ServerUrl). Hãy liên hệ người phát hành.' -ForegroundColor Red
    Read-Host 'Nhấn Enter để thoát' | Out-Null
    exit
}

while ($true) {
    Clear-Host
    Write-Host '==============================================' -ForegroundColor Green
    Write-Host '   GreenLearn  <->  Antigravity' -ForegroundColor Green
    Write-Host '   Kết nối bàn học với trợ lý lập trình AI' -ForegroundColor Green
    Write-Host '==============================================' -ForegroundColor Green
    Write-Host ''
    Write-Host '  1. Kết nối (dán token)'
    Write-Host '  2. Kiểm tra trạng thái'
    Write-Host '  3. Gỡ kết nối'
    Write-Host '  0. Thoát'
    Write-Host ''
    $c = Read-Host 'Chọn'
    try {
        switch ($c) {
            '1' { Do-Connect; Pause-Menu }
            '2' { Do-Status; Pause-Menu }
            '3' { Do-Disconnect; Pause-Menu }
            '0' { exit }
        }
    } catch {
        Write-Host ''
        Write-Host ('Lỗi: ' + $_.Exception.Message) -ForegroundColor Red
        Pause-Menu
    }
}

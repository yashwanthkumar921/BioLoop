# BioLoop JVM Classpath Generator
$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoDir = Split-Path -Parent $scriptDir
$backendDir = Join-Path $repoDir "backend"
$targetDir = Join-Path $backendDir "target"
$cpFile = Join-Path $targetDir "cp.txt"
$argsFile = Join-Path $targetDir "jvm-args.txt"

if (-not (Test-Path $cpFile)) {
    Write-Host "[BioLoop] Generating classpath scan..."
    $m2Repo = Join-Path $env:USERPROFILE ".m2\repository"
    $allJars = Get-ChildItem -Path $m2Repo -Filter "*.jar" -Recurse | Where-Object { $_.FullName -notmatch "surefire|sources|javadoc" } | Select-Object -ExpandProperty FullName
    $cpString = "target\classes;" + ($allJars -join ";")
    Set-Content -Path $cpFile -Value $cpString
}

function Parse-Version($v) {
    $parts = $v.Split('.-')
    $ints = @()
    foreach ($p in $parts) {
        $num = 0
        if ([int]::TryParse($p, [ref]$num)) { $ints += $num }
    }
    return $ints
}

function Compare-Ver($v1, $v2) {
    $p1 = Parse-Version $v1
    $p2 = Parse-Version $v2
    $len = [Math]::Max($p1.Count, $p2.Count)
    for ($i = 0; $i -lt $len; $i++) {
        $n1 = if ($i -lt $p1.Count) { $p1[$i] } else { 0 }
        $n2 = if ($i -lt $p2.Count) { $p2[$i] } else { 0 }
        if ($n1 -gt $n2) { return 1 }
        if ($n1 -lt $n2) { return -1 }
    }
    return [System.String]::Compare($v1, $v2)
}

$jars = (Get-Content $cpFile).Split(';') | Where-Object { $_ -and (Test-Path $_) }
$byArtifact = @{}
foreach ($jar in $jars) {
    if ($jar -like "*target\classes*") { continue }
    if ($jar -like "*commons-logging*") { continue }

    $dir = [System.IO.Path]::GetDirectoryName([System.IO.Path]::GetDirectoryName($jar))
    $fileName = [System.IO.Path]::GetFileName($jar)
    if ($fileName -match '^(.*?)-(\d.*)\.jar$') {
        $name = $matches[1]
        $ver = $matches[2]
        $key = "$dir\$name"
        if (-not $byArtifact.ContainsKey($key) -or ((Compare-Ver $ver $byArtifact[$key].ver) -gt 0)) {
            $byArtifact[$key] = @{ ver = $ver; path = $jar }
        }
    } else {
        $byArtifact[$jar] = @{ ver = ""; path = $jar }
    }
}

$cleanClasses = (Join-Path $targetDir "classes").Replace('\', '/')
$cleanJars = @($cleanClasses)
foreach ($key in $byArtifact.Keys) {
    $cleanJars += $byArtifact[$key].path.Replace('\', '/')
}

$cleanClasspath = $cleanJars -join ';'
$argContent = "-cp`r`n`"$cleanClasspath`"`r`ncom.bioloop.BioloopApiApplication"
[System.IO.File]::WriteAllText($argsFile, $argContent, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "[BioLoop] Updated jvm-args.txt with $($cleanJars.Count) classpath entries."



git checkout -b feature/actual-work
$files = git status --porcelain -uall | ForEach-Object { $_.Substring(3).Trim("`"") }
$totalFiles = $files.Count

$commits = 15
$baseSize = [math]::Floor($totalFiles / $commits)
$remainder = $totalFiles % $commits

$currentIndex = 0

for ($i = 1; $i -le $commits; $i++) {
    $chunkSize = $baseSize
    if ($i -le $remainder) {
        $chunkSize++
    }
    
    $chunk = $files | Select-Object -Skip $currentIndex -First $chunkSize
    foreach ($file in $chunk) {
        git add "`"$file`""
    }
    git commit -m "Update project files part $i"
    
    $currentIndex += $chunkSize
}


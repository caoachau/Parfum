$ErrorActionPreference = 'Stop'
$files = git diff --name-only --diff-filter=U
foreach ($f in $files) {
  $c = Get-Content $f -Raw
  if ($c -notmatch '<<<<<<<') { continue }
  # Bỏ marker, giữ cả 2 phía (ours rồi theirs)
  $c = $c -replace '(?s)<<<<<<<[^\n]*\r?\n', ''
  $c = $c -replace '(?s)=======\r?\n', "`r`n"
  $c = $c -replace '(?s)>>>>>>>[^\n]*\r?\n', ''
  Set-Content -Path $f -Value $c -NoNewline
  Write-Host "resolved: $f"
}
Write-Host "DONE"

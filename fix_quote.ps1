$f = "src\components\License\UpgradeModal.jsx"
$c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)

# Find the exact bad string - backtick followed by single-quote in the wrong place
$bad = "isFree ? (p.duration_months ? ``" + '${p.duration_months * 30} ng' + [char]0x00e0 + 'y` : `' + "d" + [char]0x00f9 + "ng th" + [char]0x1eed + "') : ``" + '${p.duration_months} th' + [char]0x00e1 + "ng``"
$good = "isFree ? (p.duration_months ? ``" + '${p.duration_months * 30} ng' + [char]0x00e0 + "y`` : 'd" + [char]0x00f9 + "ng th" + [char]0x1eed + "') : ``" + '${p.duration_months} th' + [char]0x00e1 + "ng``"

Write-Host ("bad found: " + $c.Contains($bad))
Write-Host ("bad length: " + $bad.Length)

if ($c.Contains($bad)) {
    $c = $c.Replace($bad, $good)
    [System.IO.File]::WriteAllText($f, $c, [System.Text.Encoding]::UTF8)
    Write-Host "Replaced OK"
} else {
    Write-Host "NOT FOUND - searching for clue..."
    # Search for the line with the issue
    $lines = $c -split "`n"
    for ($i=0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "duration_months \* 30") {
            Write-Host ("Line $($i+1): " + [System.Text.Encoding]::UTF8.GetBytes($lines[$i]).Count + " bytes")
            Write-Host $lines[$i]
        }
    }
}

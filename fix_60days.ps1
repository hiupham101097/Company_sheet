$f = "src\components\License\UpgradeModal.jsx"
$c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)

# Replace "60 ngay" in card duration display (line ~596)
$old1 = "isFree ? '60 ng" + [char]0x00e0 + "y' : ``" + '${p.duration_months} th' + [char]0x00e1 + "ng``"
$new1 = "isFree ? (p.duration_months ? ``" + '${p.duration_months * 30} ng' + [char]0x00e0 + 'y` : `' + "d" + [char]0x00f9 + "ng th" + [char]0x1eed + "') : ``" + '${p.duration_months} th' + [char]0x00e1 + "ng``"

# Replace "Tang mien phi 60 ngay trai nghiem" in card subtitle (line ~601)
$old2 = "? 'T" + [char]0x1eb7 + "ng mi" + [char]0x1ec5 + "n ph" + [char]0x00ed + " 60 ng" + [char]0x00e0 + "y tr" + [char]0x1ea3 + "i nghi" + [char]0x1ec7 + "m'"
$new2 = "? (p.duration_months ? ``T" + [char]0x1eb7 + "ng mi" + [char]0x1ec5 + "n ph" + [char]0x00ed + ' ${p.duration_months * 30} ng' + [char]0x00e0 + 'y tr' + [char]0x1ea3 + 'i nghi' + [char]0x1ec7 + 'm` : `' + "T" + [char]0x1eb7 + "ng mi" + [char]0x1ec5 + "n ph" + [char]0x00ed + " tr" + [char]0x1ea3 + "i nghi" + [char]0x1ec7 + "m``)"

Write-Host "Old1 found: $($c.Contains($old1))"
Write-Host "Old2 found: $($c.Contains($old2))"

$c = $c.Replace($old1, $new1)
$c = $c.Replace($old2, $new2)

[System.IO.File]::WriteAllText($f, $c, [System.Text.Encoding]::UTF8)
Write-Host "Done"

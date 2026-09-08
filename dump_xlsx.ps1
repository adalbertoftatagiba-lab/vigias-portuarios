param(
  [Parameter(Mandatory=$true)][string]$Path
)

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open($Path)

foreach ($ws in $wb.Worksheets) {
    Write-Output "===== SHEET: $($ws.Name) ====="
    $used = $ws.UsedRange
    $rows = $used.Rows.Count
    $cols = $used.Columns.Count
    $startRow = $used.Row
    $startCol = $used.Column

    for ($r = 0; $r -lt $rows; $r++) {
        $rowNum = $startRow + $r
        $line = @()
        for ($c = 0; $c -lt $cols; $c++) {
            $colNum = $startCol + $c
            $cell = $ws.Cells.Item($rowNum, $colNum)
            $formula = $cell.Formula
            $value = $cell.Text
            $addr = $cell.Address($false, $false)
            if ($formula -ne $null -and $formula.ToString().StartsWith("=")) {
                $line += "$addr=[$formula -> $value]"
            } elseif ($value -ne "") {
                $line += "$addr=$value"
            }
        }
        if ($line.Count -gt 0) {
            Write-Output ("R$rowNum : " + ($line -join " | "))
        }
    }
}

$wb.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null

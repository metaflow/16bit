function max($a, $b) {
  if ($a -ge $b) {
    $a
  } else {
    $b
  }
}
$failed = 0
iverilog -g2012 -o 74377-tb.vvp helper.v tbhelper.v 74377.v 74377-tb.v
vvp 74377-tb.vvp
$failed = max $failed $LASTEXITCODE
iverilog -g2012 -o 74245-tb.vvp helper.v tbhelper.v 74245.v 74245-tb.v
vvp 74245-tb.vvp
$failed = max $failed $LASTEXITCODE
if ($failed -ne 0) {
  Write-Host "FAILED"
} else {
  Write-Host "SUCCEDED"
}
exit $failed

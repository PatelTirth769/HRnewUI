$ErrorActionPreference='"'"'Stop'"'"'
$root='"'"'D:\preeshee Projects\HRnewUI-main'"'"'
$files=Get-ChildItem -Path $root -Recurse -File -Include *.js,*.ts,*.jsx,*.tsx,*.mjs,*.cjs | Where-Object { $_.FullName -notmatch '\\node_modules\\|\\dist\\|\\build\\|\\.git\\|\\coverage\\|\\.next\\|\\out\\|\\.cache\\|\\tmp\\' }
$results=@()
$pattern='"'"'\b(?<obj>router|app)\.(?<method>get|post)\s*\(\s*(?<q>["'"''"'"'])(?<path>[^"'"''"'"']+)\k<q>'"'"'
foreach($f in $files){
  $lines=Get-Content -Path $f.FullName
  for($i=0;$i -lt $lines.Count;$i++){
    $line=$lines[$i]
    $m=[regex]::Match($line,$pattern)
    if($m.Success){
      $rel=$f.FullName.Substring($root.Length+1) -replace '\\','"'"'/'"'"'
      $results += [pscustomobject]@{
        Method=$m.Groups['"'"'method'"'"'].Value.ToUpper()
        Obj=$m.Groups['"'"'obj'"'"'].Value
        Path=$m.Groups['"'"'path'"'"'].Value
        File=$rel
        Line=($i+1)
      }
    }
  }
}
$results | Sort-Object Method,File,Line | ConvertTo-Json -Depth 3

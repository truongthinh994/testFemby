$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice = $speaker.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -like 'en-*' } | Select-Object -First 1
if (-not $voice) { throw 'Install an English Windows speech voice before generating sample audio.' }
$speaker.SelectVoice($voice.VoiceInfo.Name)
$speaker.Rate = -1
$audioRoot = Join-Path (Get-Location) 'public/audio'
New-Item -ItemType Directory -Path $audioRoot -Force | Out-Null
$items = Get-Content -LiteralPath 'scripts/generated/audio.json' -Raw -Encoding UTF8 | ConvertFrom-Json
try {
 foreach ($item in $items) {
  $audioFile = Join-Path $audioRoot $item.file
  $speaker.SetOutputToWaveFile($audioFile)
  $speaker.Speak($item.text)
  $speaker.SetOutputToNull()
 }
} finally { $speaker.Dispose() }
Write-Output "Generated $($items.Count) audio files."

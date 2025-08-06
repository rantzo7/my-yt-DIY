import fs from 'fs'
import spawn from 'nano-spawn'

const subtitlesYTDLPArgs = [
  '--write-subs',
  '--write-auto-subs',
  '--sub-format',
  'vtt',
  '--convert-subs',
  'srt',
  '-k',
  '--verbose'
]
const videoYTDLPArgs = quality => [
  '--concurrent-fragments',
  '10',
  '--newline',
  '--progress',
  '--progress-delta',
  '1',
  '--sponsorblock-remove',
  'all,-filler',
  '--merge-output-format',
  'mp4',
  '-f',
  `bestvideo[height<=${quality}]+bestaudio/best`,
  '--check-formats',
  '--verbose'
]

export function video (id, quality) {
  const cookiesPath = getOptionalCookiesPath()
  const cookiesOption = cookiesPath ? ['--cookies', cookiesPath] : []
  return spawn('yt-dlp', [
    '-o',
    `./data/videos/${id}.%(ext)s`,
    ...cookiesOption,
    ...videoYTDLPArgs(quality),
    // ...subtitlesYTDLPArgs,
    '--',
    id
  ])
}
export function subtitles (id) {
  const cookiesPath = getOptionalCookiesPath()
  const cookiesOption = cookiesPath ? ['--cookies', cookiesPath] : []
  return spawn('yt-dlp', [
    '-o',
    `./data/videos/${id}`,
    '--skip-download',
    ...cookiesOption,
    ...subtitlesYTDLPArgs,
    '--',
    id
  ])
}

function getOptionalCookiesPath () {
  // Prioritize cookies.txt in the current working directory
  if (fs.existsSync('./cookies.txt')) return './cookies.txt'
  // Fallback to /app/cookies.txt (for Docker/deployment environments)
  if (fs.existsSync('/app/cookies.txt')) return '/app/cookies.txt'
  return null
}

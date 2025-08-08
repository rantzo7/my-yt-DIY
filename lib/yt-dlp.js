import fs from 'fs'
import spawn from 'nano-spawn'

const subtitlesYTDLPArgs = [
  '--write-subs',
  '--write-auto-subs',
  '--sub-format',
  'vtt',
  '--convert-subs', // Uncommented to convert subtitles to SRT
  'srt',            // Uncommented to convert subtitles to SRT
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
    // ...subtitlesYTDLPArgs, // Subtitles are handled by a separate call
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
  const localPath = './cookies.txt'
  const appPath = '/app/cookies.txt'

  if (fs.existsSync(localPath)) {
    console.log(`[yt-dlp] Using cookies file from: ${localPath}`)
    return localPath
  }
  if (fs.existsSync(appPath)) {
    console.log(`[yt-dlp] Using cookies file from: ${appPath}`)
    return appPath
  }
  console.log('[yt-dlp] No cookies.txt file found. Proceeding without cookies.')
  return null
}

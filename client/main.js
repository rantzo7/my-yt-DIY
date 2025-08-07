/* global EventSource, MutationObserver */
    window.state = {
      downloading: {},
      summarizing: {},
      sseConnected: false
    }
    let downloadLogTimeoutHandle

    window.eventSource = new EventSource('/')
    window.eventSource.onopen = () => {
      console.log('[sse] connection opened')
      window.state.sseConnected = true
      if (document.querySelector('sse-connection')) document.querySelector('sse-connection').dataset.connected = true
    }
    window.eventSource.onerror = (err) => {
      console.log('[sse] connection error', err)
      window.state.sseConnected = false
      if (document.querySelector('sse-connection')) document.querySelector('sse-connection').dataset.connected = false
    }
    window.eventSource.onmessage = (message) => {
      if (document.querySelector('sse-connection')) document.querySelector('sse-connection').dataset.connected = true
      window.state.sseConnected = true
      if (!message || !message.data) return console.error('skipping empty message')
      try {
        const data = JSON.parse(message.data)
        console.log('[sse] message', data)

        if (data.type === 'state' && data.state) {
          Object.assign(window.state, data.state)
          Object.keys(data.state.summarizing || {}).forEach((id) => {
            const videoElement = document.querySelector(`[data-id="${id}"]`)
            if (videoElement) videoElement.dataset.summarizing = 'true'
          })
          Object.keys(data.state.downloading || {}).forEach((id) => {
            const videoElement = document.querySelector(`[data-id="${id}"]`)
            if (videoElement) videoElement.dataset.downloading = 'true'
          })
          return
        }
        if (data.type === 'download-log-line' && data.line) {
          const $state = document.querySelector('.state')
          if (!$state) { return console.warn('missing $state') }
          if (downloadLogTimeoutHandle) clearTimeout(downloadLogTimeoutHandle)

          $state.classList.add('updated')
          downloadLogTimeoutHandle = setTimeout(() => $state.classList.remove('updated'), 10000)

          const $downloadLogLines = $state.querySelector(' .lines')
          $downloadLogLines.innerText += '\n' + data.line
          $downloadLogLines.scrollTop = $downloadLogLines.scrollHeight
          return
        }
        if (data.type === 'new-videos' && data.videos) {
          const $videosContainer = document.querySelector('videos-container')
          if (!$videosContainer) return
          let videos = JSON.parse($videosContainer.dataset.videos || '[]')
          videos = data.videos.concat(videos)
          $videosContainer.dataset.videos = JSON.stringify(videos)
          return
        }
        if (data.type === 'summary-error' && data.videoId) {
          const $videoElement = document.querySelector(`[data-video-id="${data.videoId}"]`)
          if ($videoElement) {
            $videoElement.dataset.summarizing = 'false'
            $videoElement.render && $videoElement.render()
          }
          return
        }
        if (data.type === 'summary' && data.videoId && data.summary && data.transcript) {
          ;[...document.querySelectorAll(`[data-video-id="${data.videoId}"]`)].forEach($video => {
            if (!$video.dataset.data) return
            const videoData = JSON.parse($video.dataset.data)
            Object.assign(videoData, { summary: data.summary, transcript: data.transcript })
            $video.dataset.data = JSON.stringify(videoData)
          })
          return
        }
        if (data.type === 'downloaded' && data.videoId && data.downloaded !== undefined) {
          ;[...document.querySelectorAll(`[data-video-id="${data.videoId}"]`)].forEach($video => {
            if (!$video.dataset.data) return
            const videoData = JSON.parse($video.dataset.data)
            videoData.downloaded = data.downloaded
            if (data.video) Object.assign(videoData, data.video)
            $video.dataset.data = JSON.stringify(videoData)
          })
          return
        }
        if (data.type === 'ignored' && data.videoId && data.ignored !== undefined) {
          ;[...document.querySelectorAll(`[data-video-id="${data.videoId}"]`)].forEach($video => {
            if (!$video.dataset.data) return
            const videoData = JSON.parse($video.dataset.data)
            videoData.ignored = data.ignored
            $video.dataset.data = JSON.stringify(videoData)
          })
          return
        }
        console.warn('unhandled', data)
      } catch (err) {
        console.error('sse parse error', err)
      }
    }

    const $summary = document.querySelector('dialog#summary')
    const $closeSummary = $summary.querySelector('button')
    $closeSummary.addEventListener('click', () => $summary.close())
    $summary.addEventListener('close', () => {})

    observeDialogOpenPreventScroll($summary)

    function observeDialogOpenPreventScroll (dialog) {
      new MutationObserver((mutationList, observer) => {
        for (const mutation of mutationList) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'open') {
            document.body.classList[mutation.target.open ? 'add' : 'remove']('dialog-opened')
          }
        }
      }).observe(dialog, { attributes: true, childList: true, subtree: true })
    }

    const $state = document.querySelector('details.state')
    if ($state) {
      new MutationObserver((mutationList, observer) => {
        for (const mutation of mutationList) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'open') $state.classList.remove('updated')
        }
      }).observe($state, { attributes: true, childList: false, subtree: false })
    }

    // Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle');

    function applyTheme(theme) {
      if (theme === 'dark') {
        document.body.classList.add('theme-dark');
        document.body.classList.remove('theme-light');
        themeToggleBtn.textContent = '☀️'; // Sun icon for light mode
      } else if (theme === 'light') {
        document.body.classList.add('theme-light');
        document.body.classList.remove('theme-dark');
        themeToggleBtn.textContent = '🌙'; // Moon icon for dark mode
      } else {
        // Default to system preference if no explicit theme is set
        document.body.classList.remove('theme-dark', 'theme-light');
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          themeToggleBtn.textContent = '☀️';
        } else {
          themeToggleBtn.textContent = '🌙';
        }
      }
    }

    // Load theme from localStorage or default to system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      applyTheme(savedTheme);
    } else {
      applyTheme(null); // Apply system preference
    }

    // Toggle theme on button click
    themeToggleBtn.addEventListener('click', () => {
      if (document.body.classList.contains('theme-dark')) {
        applyTheme('light');
        localStorage.setItem('theme', 'light');
      } else {
        applyTheme('dark');
        localStorage.setItem('theme', 'dark');
      }
    });

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only update if no explicit theme is set by the user
      if (!localStorage.getItem('theme')) {
        applyTheme(null); // Re-apply system preference
      }
    });

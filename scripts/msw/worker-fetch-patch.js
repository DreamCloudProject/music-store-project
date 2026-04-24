// @marker Project-specific: skip static

/* eslint-disable */

// @begin fetch-hook-prefix
  if (activeClientIds.size === 0) {
    return
  }

// @end fetch-hook-prefix

// @begin fetch-hook-body
  // Project-specific: skip static assets and non–same-origin
  const dest = event.request.destination
  const skipDestinations = [
    'script',
    'style',
    'image',
    'font',
    'manifest',
    'audio',
    'video',
    'track',
    'embed',
    'object',
  ]
  if (skipDestinations.includes(dest)) {
    return
  }

  try {
    const reqUrl = new URL(event.request.url)
    const workerOrigin = new URL(self.location.origin)
    const swPort = workerOrigin.port || (workerOrigin.protocol === 'https:' ? '443' : '80')
    const reqPort = reqUrl.port || (reqUrl.protocol === 'https:' ? '443' : '80')
    if (reqPort !== swPort) {
      return
    }
    const swHost = workerOrigin.hostname
    const reqHost = reqUrl.hostname
    const sameHost =
      swHost === reqHost ||
      (swHost === 'localhost' && reqHost === '127.0.0.1') ||
      (swHost === '127.0.0.1' && reqHost === 'localhost')
    if (!sameHost) {
      return
    }
  } catch (_) {
    return
  }

// @end fetch-hook-body

// @begin fetch-hook-suffix
  const requestId = crypto.randomUUID()
// @end fetch-hook-suffix

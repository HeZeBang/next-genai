import crypto from 'crypto'

const HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.188',
  'sec-ch-ua': '"Not/A)Brand";v="99", "Microsoft Edge";v="115", "Chromium";v="115"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
}

/** Parse a named hidden input value from the HTML */
function collectData(text: string, name: string, endTag: string): string {
  let startIdx: number
  if (name === 'pwdEncryptSalt') {
    startIdx = text.indexOf(`id="${name}"`)
  } else {
    startIdx = text.indexOf(`name="${name}"`)
  }
  if (startIdx === -1) return ''
  const endIdx = text.indexOf(endTag, startIdx)
  const raw = text.substring(startIdx, endIdx)
  const valueStart = raw.indexOf('value="') + 7
  const valueEnd = raw.indexOf('"', valueStart)
  return raw.substring(valueStart, valueEnd)
}

/** Parse `var service = ["..."]` from IDS HTML to get the service URL */
function getServiceUrl(text: string): string | null {
  const m = text.match(/var service = \["(.*?)"/)
  return m ? JSON.parse(`"${m[1]}"`) : null
}

/** AES-CBC encrypt password using Node.js crypto */
function encryptPassword(password: string, salt: string): string {
  const prefix = Buffer.from('Nu1L'.repeat(16))
  const combined = Buffer.concat([prefix, Buffer.from(password)])

  const blockSize = 16
  const padLen = blockSize - (combined.length % blockSize)
  const padded = Buffer.concat([combined, Buffer.alloc(padLen, padLen)])

  const iv = Buffer.from('Nu1L'.repeat(4))
  const key = Buffer.from(salt)
  const cipher = crypto.createCipheriv('aes-128-cbc', key, iv)
  cipher.setAutoPadding(false)
  const encrypted = Buffer.concat([cipher.update(padded), cipher.final()])
  return encrypted.toString('base64')
}

/** Merge Set-Cookie headers into a simple cookie-jar string */
function mergeSetCookies(existing: string, response: Response): string {
  const jar = new Map<string, string>()

  if (existing) {
    for (const part of existing.split('; ')) {
      const eq = part.indexOf('=')
      if (eq > 0) jar.set(part.substring(0, eq), part.substring(eq + 1))
    }
  }

  const setCookies = response.headers.getSetCookie?.() ?? []
  for (const sc of setCookies) {
    const cookiePart = sc.split(';')[0].trim()
    const eq = cookiePart.indexOf('=')
    if (eq > 0) {
      jar.set(cookiePart.substring(0, eq), cookiePart.substring(eq + 1))
    }
  }

  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

/**
 * Follow redirects manually, accumulating cookies across hops.
 * Returns early (without following) if a Location header contains `?token=`.
 */
async function fetchWithCookies(
  url: string,
  init: RequestInit & { cookieJar?: string } = {}
): Promise<{ response: Response; cookies: string; body: string; finalUrl: string }> {
  let currentUrl = url
  let cookies = init.cookieJar ?? ''
  let resp: Response
  let body = ''
  const maxRedirects = 10

  for (let i = 0; i <= maxRedirects; i++) {
    const headers: Record<string, string> = {
      ...HEADERS,
      ...(init.headers as Record<string, string>),
    }
    if (cookies) headers['Cookie'] = cookies

    resp = await fetch(currentUrl, {
      ...init,
      headers,
      redirect: 'manual',
    })

    cookies = mergeSetCookies(cookies, resp)

    const status = resp.status
    if (status >= 300 && status < 400) {
      const location = resp.headers.get('location')
      if (!location) break

      const resolvedLocation = new URL(location, currentUrl).href

      // Token found in redirect URL — capture it without following
      if (resolvedLocation.includes('?token=')) {
        return { response: resp, cookies, body: '', finalUrl: resolvedLocation }
      }

      currentUrl = resolvedLocation
      init = { ...init, method: 'GET', body: undefined }
      continue
    }

    body = await resp.text()
    return { response: resp, cookies, body, finalUrl: currentUrl }
  }

  body = await resp!.text()
  return { response: resp!, cookies, body, finalUrl: currentUrl }
}

/**
 * Log in to GenAI via ShanghaiTech IDS (统一身份认证).
 * Returns the GenAI API token on success.
 */
export async function loginGenAI(studentid: string, password: string): Promise<string> {
  let apiBaseUrl = process.env.GENAI_API_BASE_URL || 'https://genai.shanghaitech.edu.cn'
  if (apiBaseUrl.endsWith('/')) apiBaseUrl = apiBaseUrl.slice(0, -1)

  const genaiLoginUrl = `${apiBaseUrl}/htk/user/login`

  // Step 1: GET GenAI login entry — it may redirect to IDS immediately
  const initResp = await fetch(genaiLoginUrl, {
    redirect: 'manual',
    headers: HEADERS,
  })

  let idsLoginUrl: string
  let jar0 = mergeSetCookies('', initResp)

  if (initResp.status >= 300 && initResp.status < 400) {
    // Direct redirect to IDS — derive the IDS URL from Location header
    const location = initResp.headers.get('location')!
    idsLoginUrl = new URL(location, genaiLoginUrl).href
  } else {
    // Got an HTML body — parse the service URL from embedded JS
    const html = await initResp.text()
    const serviceUrl = getServiceUrl(html)
    if (!serviceUrl) throw new Error('Failed to determine IDS service URL from GenAI login page')
    idsLoginUrl = `https://ids.shanghaitech.edu.cn/authserver/login?service=${encodeURIComponent(serviceUrl)}`
  }

  // Step 2: GET the IDS login page — follow redirects to the actual login form URL
  const { body: idsHtml, cookies: jar1, finalUrl: idsFormUrl } = await fetchWithCookies(idsLoginUrl, {
    cookieJar: jar0,
  })

  // Step 3: Parse hidden form fields
  const lt = collectData(idsHtml, 'lt', '/>')
  const execution = collectData(idsHtml, 'execution', '/>')
  const salt = collectData(idsHtml, 'pwdEncryptSalt', '/>')

  if (!salt) throw new Error('Failed to get pwdEncryptSalt from IDS login page')
  if (!execution) throw new Error('Failed to get execution from IDS login page')

  // Step 4: Encrypt password
  const encryptedPwd = encryptPassword(password, salt)

  // Step 5: POST login form to the actual login form URL (may differ from idsLoginUrl after redirects)
  const formData = new URLSearchParams({
    username: studentid,
    password: encryptedPwd,
    lt,
    dllt: 'generalLogin',
    execution,
    _eventId: 'submit',
    rmShown: '1',
  })

  console.log('Posting login form to IDS at:', idsFormUrl)

  const { body: postBody, finalUrl } = await fetchWithCookies(idsFormUrl, {
    method: 'POST',
    body: formData.toString(),
    cookieJar: jar1,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  // Step 6: Check for login failure
  if (
    postBody.includes('authError') ||
    postBody.includes('用户名或密码') ||
    postBody.includes('incorrectPassword')
  ) {
    throw new Error('Username or password is incorrect, or an additional verification step is required (e.g. CAPTCHA).')
  }

  console.log('finalUrl after login POST:', finalUrl)

  // Step 7: Extract token from final redirect URL
  if (finalUrl && finalUrl.includes('?token=')) {
    const token = new URL(finalUrl).searchParams.get('token')
    if (token) return token
  }

  throw new Error('Login successful but failed to extract token, please check GenAI API configuration')
}

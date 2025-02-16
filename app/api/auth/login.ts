import axios from 'axios'
import { exec } from 'child_process'
import CryptoJS from 'crypto-js'

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.188',
  'sec-ch-ua': '"Not/A)Brand";v="99", "Microsoft Edge";v="115", "Chromium";v="115"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"'
}

const collectData = (text: string, name: string, endtag: string) => {
  let startIdx = text.indexOf(`name="${name}"`)
  if (name === 'pwdEncryptSalt') {
    startIdx = text.indexOf(`id="${name}"`)
  }
  const endIdx = text.indexOf(endtag, startIdx) + endtag.length
  const rawData = text.substring(startIdx, endIdx)
  const valueMatch = rawData.match(/value="([^"]+)"/)
  return valueMatch ? valueMatch[1] : null
}

const getServiceUrl = (text: string) => {
  const textMatch = text.match(/var service = \["(.*?)"/)
  return textMatch ? JSON.parse(`"${textMatch[1]}"`) : null
}

export const loginGenAI = async (studentid: string, password: string) => {
  // const url = 'https://ids.shanghaitech.edu.cn/authserver/login?service='
  const url = 'https://genai.shanghaitech.edu.cn/htk/user/login'

  const session = axios.create({
    baseURL: url,
    headers: headers,
    withCredentials: true,
  })

  try {
    await session.get(url).then((response) => {
      const text = response.data
      // response URL
      const serviceUrl = getServiceUrl(text)
      const idsUrl = `https://ids.shanghaitech.edu.cn/authserver/login?service=${encodeURIComponent(serviceUrl)}`
      const lt = ''
      const dllt = 'generalLogin'
      const execution = collectData(text, 'execution', '/>')
      const _eventId = 'submit'
      const rmShown = '1'
      const key = collectData(text, 'pwdEncryptSalt', '/>')

      if (key === null) {
        throw new Error('Failed to get encrypt key')
      }
      if (execution === null) {
        throw new Error('Failed to get execution')
      }
      const encryptedPassword = encryptPassword(
        password,
        key
      )

      const data = {
        username: studentid,
        password: encryptedPassword,
        lt: lt,
        dllt: dllt,
        execution: execution,
        _eventId: _eventId,
        rmShown: rmShown
      }

      if (idsUrl === null || serviceUrl === null) {
        throw new Error('Failed to get service URL')
      }
      return session.post(
        idsUrl,
        // type: application/x-www-form-urlencoded
        data,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            ...headers
          }
        }
      )
    })
      .then((response) => {
        console.log(response.data)
      })
  } catch (error) {
    console.error(error)
    throw error
  }
}

function encryptPassword(password: string, key: string): string {
  // Create initial padding of "Nu1L" repeated 16 times
  const initialPadding = CryptoJS.enc.Latin1.parse('Nu1L'.repeat(16));
  // Convert password to UTF-8 bytes
  const passwordBytes = CryptoJS.enc.Utf8.parse(password);
  // Concatenate initial padding and password bytes
  const paddedPassword = initialPadding.concat(passwordBytes);

  // Calculate required PKCS7 padding size
  const blockSize = 16;
  const currentLength = paddedPassword.sigBytes;
  let padSize = blockSize - (currentLength % blockSize);
  padSize = padSize === 0 ? blockSize : padSize;

  // Create padding string (e.g., 05 05 05 05 05 for padSize=5)
  const padStr = String.fromCharCode(padSize).repeat(padSize);
  const pkcs7Padding = CryptoJS.enc.Latin1.parse(padStr);
  // Apply PKCS7 padding
  const pkcs7PaddedPassword = paddedPassword.concat(pkcs7Padding);

  // Initialization vector "Nu1L" repeated 4 times
  const iv = CryptoJS.enc.Latin1.parse('Nu1L'.repeat(4));
  // Convert key to UTF-8 bytes
  const keyData = CryptoJS.enc.Utf8.parse(key);

  // AES-256-CBC encryption with no padding (already padded)
  const encrypted = CryptoJS.AES.encrypt(pkcs7PaddedPassword, keyData, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.NoPadding
  });

  // Return result as Base64 string
  return encrypted.toString();
}

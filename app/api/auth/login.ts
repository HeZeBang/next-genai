import axios, { AxiosResponse } from 'axios'
import CryptoJS from 'crypto-js'
import { NextResponse } from 'next/server'

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
  let apiUrl: string
  let apiBaseUrl = process.env.GENAI_API_BASE_URL || 'https://genai.shanghaitech.edu.cn'
  if (apiBaseUrl && apiBaseUrl.endsWith('/')) {
    apiBaseUrl = apiBaseUrl.slice(0, -1)
  }
  apiUrl = `${apiBaseUrl}/htk/user/login`

  const session = axios.create({
    baseURL: apiUrl,
    headers: headers,
    withCredentials: true
  })

  try {
    await session
      .get(apiUrl)
      .then((response) => {
        console.log(response.headers['set-cookie'])

        const text = response.data
        // response URL
        const serviceUrl = getServiceUrl(text)
        const idsUrl = `https://ids.shanghaitech.edu.cn/authserver/login?service=${encodeURIComponent(serviceUrl)}`
        const lt = ''
        const dllt = 'generalLogin'
        // const execution = collectData(text, 'execution', '/>')
        const execution = "a9c98394-0b5d-45b7-ac57-579745685949_ZXlKaGJHY2lPaUpJVXpVeE1pSjkuZ2JJaCtVWmxsZFVmanNqdUo0SmJiRzlCZGliU1ZNc1owdmtrbkxtNUFMOVM3ajA1dmUyQnkzYUM4RDlGcUlnV092WFNka2VlR0dRV0pTTlRBVHBhK240S0FZbTRHdDZ6dTBrU2Nlck5RNTdXa0JWS05KSGtUeExjV3VxR2hEQXU0WGs1bVBPRmlQQkVUbGJRQ1dOV2YrQldtOVZaS204Q0V1ekNpMWlFenNhQlBkR2d2TGFFc1ZzWFc4MWI0VXpzdUprckdyQ3RuSG1qOFZ4MTVPNFZ2dk1XK3RiQ0pEdW1PanREVUcwb1RMNGh3VktOK1NVUU5aUkFtNVNIdHlPUVdabmVMUkdqWVJaQktUdG1sTWlvTE5rQ3J3QXdTNzBKZkp4a0x2c1dwYXk5Yi8xUlh3Rk5zTVA3YUV0Sk0zT1FBOGxEUjhSRVRXUU9pOWZBenlBbUk1YlU2bWRxWVV3WGNjOHVCa2VobkNPSUpDbklhWjZocmIyUmRucTRkcTVDVG1rZ3pEeWZXL0EwM1ZzaU8vZFlMUXZTWFpUd3pJRmpsVG9CSlNScjMvQWsyLy9GYmJ6Zm9wOS8xQVFOV0N6QXIvSjYrTStacnRYWjVSRGY5aGpFZ0xQakorL0NvajFRNUt4dHZwTUZiaGdGaHd3ZGV1clFNQmVuSjZ2cGZCZm01amJHL0xvcTE0Q3dOM1ZCRHkxaml1ZmdtdldIZWpLeDBqcitQekZUWk1ieDdCdVRYbEd0SXp3ckthMm5udXJoV3kzUWN4bW94OGFNdi9KRTJQaVpuSXRWcWNuUXhYcjF6MCtsUzdLNkhGZkhSVytpTnNhMmh4Nk5GY3Z1cm9ySDFhQmFzN29OSU1SQU5pMTFYUDJiSitqUVU3YnJQbUNVM2JBUHhnSjN4dEhHdjVObEIweThoMHpyUXdvbXo0SXNBRUorVFByVjRmaklRd1k5cEk5VFN2SDgzMEVtcnRIa1doTGFoK1dwVklVaDVVK2RGUUpueUdlOC9PTkgzWWxlWXc4WUNWM29VQzlzWmZvendsZ3F3eW5Hd2RIV2xYVFllY002b29RYXIyRU5ZbW1RZ0lVRGkwbjMrQlMvQ1drdVdGRGZ4bnBXOTI0ZWZmcjc2SjByejRwMUREWXI5eXpMUjFERCs1dDFDOHEzYkV1RlIwek51bnhNTGV0Q1JKRlRkRlpOaWRkT01PRzQ3YzhDVFJPa2tyc2EyYmlSUER1Q29oeUlXWDJQS0k3SlBtNVdETUF2bzkrVVRCajY4WkluTG92S1JnSDBrOU9qaEZkSEtDcGdXV3Q0M3c4dngvMUwwbjFBRmNXRU9sQ09yNE9NSXVOK1V3WFRZMmJwVzB5QnRicXM0YWZDSXB5ZC8zNTFqU2NMWE9mS01KUHpwa01rT09DRGZhSFhCcXhZNW4xNXlWRTNIT0pMVEFtWm9vWFNnM3dWUHVyTG1PN0tiVFJqQVk4dmVCR0lHUVFUOWxxdENyZmNEcXFEb2d1ZkFjbG00VmVtd2svdFNSMnBJaWVtWnZlQXBRdVFzZXBzT3VSbnlWVFQxTzZ0eTVCYUVhZDJBZzlqaVVWbmtSSzYwNWNuWEdxcUpzeStBUWtuLzE5OEJGUXFxcWlreWpra3pBM0lzODFmSXRkUUdUc0JYdHlra1E3SWt5N0xJcVJEbEV3MHp2WTBDWXBoUTZiaW93Z0pqU1Y0amtyVXNZc25GQ2ZUMEdteVVxZGx2WHI2aWtSbEoxZy96TFZMUzlVTTNKME8yZUM3VGlUYlF4UG91Nkx1SmxuOGI5YkxURktacVBLbzJFaFJtd2I3bTZ2T0wrYUgrUGhTdmNhQ2xiYjBPRHNjZENkOWVWcEF1by96ZGRaN0xlL0dnZEdZL2FSYVdrTkJybmhWU0RiQ3hRUStZMDBsalV2Ny9OaThjZnphNTJRYTd1ZEU5Sk8vWU9TdmtpaXUwQUkyc3pGV21pN0p2MVFlUjlkbFhlei9mdG80eFJBbzU3WUlTOFRQUHlndTdNZ0xXNU9SSXJjQ2pDWDdUekhqZ3ZncTZQNEF2NEpMNnc0bG0rMjN6THVYRDdYOUltWk1pZkVNUEhjeHFCTT0uaWhoVXNCNjkwenZiTWY4TDRXZWI1ZWNWc3ljN2ltTE9ucEFRUXVtaTNnam4xVEMwUE9weWw5WTFiQ2lGNXlkeG9TMFkxZ0NzRWpQM0xyWklWZEQ4MWc="
        const _eventId = 'submit'
        const rmShown = '1'
        // const key = collectData(text, 'pwdEncryptSalt', '/>')
        const key = "T9FgeXnGebN1TlNc"

        if (key === null) {
          throw new Error('Failed to get encrypt key')
        }
        if (execution === null) {
          throw new Error('Failed to get execution')
        }
        const encryptedPassword = encryptPassword(password, key)

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

        const body = new URLSearchParams(data).toString()

        // return session.post(
        //   // idsUrl,
        //   // "http://127.0.0.1:4523/m1/5863826-5550269-default/test",
        //   "http://localhost:8080/",
        //   body,
        //   {
        //     headers: {
        //       ...headers,
        //       'Content-Type': 'application/x-www-form-urlencoded',
        //       'Cookie': response.headers['set-cookie'],
        //       'Content-Length': Buffer.byteLength(body).toString(),
        //       'user-agent': headers['User-Agent'],
        //     },
        //   },
        // )

        return fetch(
          // idsUrl,
          // "http://127.0.0.1:4523/m1/5863826-5550269-default/test",
          "http://localhost:8080/",
          // "http://localhost:3000/api/test",
          {
            method: 'POST',
            headers: {
              ...headers,
              'Content-Type': 'application/x-www-form-urlencoded',
              'Host': 'ids.shanghaitech.edu.cn'
              // 'Cookie': `${response.headers['set-cookie']}`,
              // 'Content-Length': Buffer.byteLength(body).toString(),
            },
            body: new URLSearchParams(data).toString(),
          },
        )
      })
      .then(res => res.text())
      .then((response) => {
        console.log(response)
        // console.log(response.data)
        // console.log(response.headers)
      })
      .catch((error) => {
        throw error
      })
  } catch (error: any) {
    const response = error.response as AxiosResponse<any>
    console.log(response.data)
    // console.error(`${error}`)
    // throw error
  }
}

function encryptPassword(password: string, key: string) {
  // Create initial padding of "Nu1L" repeated 16 times
  const initialPadding = CryptoJS.enc.Latin1.parse('Nu1L'.repeat(16))
  // Convert password to UTF-8 bytes
  const passwordBytes = CryptoJS.enc.Utf8.parse(password)
  // Concatenate initial padding and password bytes
  const paddedPassword = initialPadding.concat(passwordBytes)

  // Calculate required PKCS7 padding size
  const blockSize = 16
  const currentLength = paddedPassword.sigBytes
  let padSize = blockSize - (currentLength % blockSize)
  padSize = padSize === 0 ? blockSize : padSize

  // Create padding string (e.g., 05 05 05 05 05 for padSize=5)
  const padStr = String.fromCharCode(padSize).repeat(padSize)
  const pkcs7Padding = CryptoJS.enc.Latin1.parse(padStr)
  // Apply PKCS7 padding
  const pkcs7PaddedPassword = paddedPassword.concat(pkcs7Padding)

  // Initialization vector "Nu1L" repeated 4 times
  const iv = CryptoJS.enc.Latin1.parse('Nu1L'.repeat(4))
  // Convert key to UTF-8 bytes
  const keyData = CryptoJS.enc.Utf8.parse(key)

  // AES-256-CBC encryption with no padding (already padded)
  const encrypted = CryptoJS.AES.encrypt(pkcs7PaddedPassword, keyData, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.NoPadding
  })

  // Return result as Base64 bytes
  return encrypted.toString()
}

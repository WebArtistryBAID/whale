// ONLY required parameters need to go into the signature

import md5 from 'md5'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function signData(params: any): string {
    const key = process.env.WX_PAY_MCH_KEY
    const paramsArr = Object.keys(params)
    paramsArr.sort()
    const stringArr = []
    paramsArr.map(k => {
        stringArr.push(`${k}=${params[k]}`)
    })
    stringArr.push(`key=${key}`)
    return md5(stringArr.join('&')).toString().toUpperCase()
}

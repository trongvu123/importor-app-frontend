import { redirect } from 'next/navigation'
import { normalizePath } from './utils'

type CustomOptions = Omit<RequestInit, 'method'> & {
    baseUrl?: string | undefined
}

const ENTITY_ERROR_STATUS = 422

type EntityErrorPayload = {
    message: string
    errors: {
        field: string
        message: string
    }[]
}

export class HttpError extends Error {
    status: number
    payload: {
        message: string
        [key: string]: any
    }
    constructor({ status, payload, message = 'Lỗi HTTP' }: { status: number; payload: any; message?: string }) {
        super(message)
        this.status = status
        this.payload = payload
    }
}

export class EntityError extends HttpError {
    status: typeof ENTITY_ERROR_STATUS
    payload: EntityErrorPayload
    constructor({ status, payload }: { status: typeof ENTITY_ERROR_STATUS; payload: EntityErrorPayload }) {
        super({ status, payload, message: 'Lỗi thực thể' })
        this.status = status
        this.payload = payload
    }
}

const isClient = () => typeof window !== 'undefined'
const request = async <Response>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    options?: CustomOptions | undefined
) => {
    let body: FormData | string | undefined = undefined
    if (options?.body instanceof FormData) {
        body = options.body
    } else if (options?.body) {
        body = JSON.stringify(options?.body)
    }

    const baseHeaders: {
        [key: string]: string
    } =
        body instanceof FormData
            ? {}
            : {
                'Content-Type': 'application/json'
            }

    // Nếu không truyền baseUrl (hoặc baseUrl = undefined) thì lấy từ envConfig.NEXT_PUBLIC_API_URL
    // Nếu truyền baseUrl thì lấy giá trị truyền vào, truyền vào '' thì đồng nghĩa với việc chúng ta gọi API đến Next.js Server
    const baseUrl = options?.baseUrl === undefined ? process.env.NEXT_PUBLIC_URL_BACKEND : options.baseUrl
    const fullUrl = `${baseUrl}/${normalizePath(url)}`
    const res = await fetch(fullUrl, {
        ...options,
        headers: {
            ...baseHeaders,
            ...options?.headers
        },
        body,
        method
    })
    const payload: Response = await res.json()
    const data = {
        status: res.status,
        payload
    }
    // Interceptor là nời chúng ta xử lý request và response trước khi trả về cho phía component
    if (!res.ok) {
        if (res.status === ENTITY_ERROR_STATUS) {
            throw new EntityError(
                data as {
                    status: 422
                    payload: EntityErrorPayload
                }
            )
        } else {
            throw new HttpError(data)
        }
    }
    // Đảm bảo logic dưới đây chỉ chạy ở phía client (browser)

    return data
}

const http = {
    get<Response>(url: string, options?: Omit<CustomOptions, 'body'> | undefined) {
        return request<Response>('GET', url, options)
    },
    post<Response>(url: string, body: any, options?: Omit<CustomOptions, 'body'> | undefined) {
        return request<Response>('POST', url, { ...options, body })
    },
    put<Response>(url: string, body: any, options?: Omit<CustomOptions, 'body'> | undefined) {
        return request<Response>('PUT', url, { ...options, body })
    },
    delete<Response>(url: string, options?: Omit<CustomOptions, 'body'> | undefined) {
        return request<Response>('DELETE', url, { ...options })
    }
}

export default http

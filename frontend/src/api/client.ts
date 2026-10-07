export interface ApiErrorPayload {
  error?: {
    code?: string
    message?: string
  }
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

export interface ApiResponse<TResponse> {
  data: TResponse
  status: number
}

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  token?: string | null
  signal?: AbortSignal
}

const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '')

export async function apiRequestWithStatus<TResponse>(path: string, options: ApiRequestOptions = {}): Promise<ApiResponse<TResponse>> {
  const headers = new Headers({ Accept: 'application/json' })
  if (options.body !== undefined) headers.set('Content-Type', 'application/json')
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`)

  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    })
  } catch {
    throw new ApiRequestError('Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.', 0, 'network_error')
  }

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const apiError = payload as ApiErrorPayload | null
    throw new ApiRequestError(
      apiError?.error?.message || 'İşlem tamamlanamadı. Lütfen tekrar dene.',
      response.status,
      apiError?.error?.code,
    )
  }

  return { data: payload as TResponse, status: response.status }
}

export async function apiRequest<TResponse>(path: string, options: ApiRequestOptions = {}): Promise<TResponse> {
  const result = await apiRequestWithStatus<TResponse>(path, options)
  return result.data
}

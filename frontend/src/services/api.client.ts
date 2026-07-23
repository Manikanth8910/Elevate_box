export class ApiClient {
  private static baseURL = '/api/v1';
  private static isRefreshing = false;
  private static refreshSubscribers: ((token: string) => void)[] = [];

  private static subscribeTokenRefresh(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private static onRefreshed(token: string) {
    this.refreshSubscribers.forEach(cb => cb(token));
    this.refreshSubscribers = [];
  }

  static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const executeRequest = async (tokenOverride?: string) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      const token = tokenOverride || localStorage.getItem('access_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      const payload = await response.json();

      if (response.status === 401) {
        // Attempt refresh
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          try {
            const refreshRes = await fetch(`${this.baseURL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
            const refreshPayload = await refreshRes.json();
            
            if (!refreshRes.ok) throw new Error('Refresh failed');
            
            const newToken = refreshPayload.data.accessToken;
            localStorage.setItem('access_token', newToken);
            this.isRefreshing = false;
            this.onRefreshed(newToken);
            return executeRequest(newToken);
          } catch (err) {
            this.isRefreshing = false;
            localStorage.removeItem('access_token');
            // Hard redirect to login could happen here, or handled by React components catching the error
            throw new Error('Session expired');
          }
        } else {
          // Wait for refresh to complete
          return new Promise<T>((resolve) => {
            this.subscribeTokenRefresh((newToken) => {
              resolve(executeRequest(newToken));
            });
          });
        }
      }

      if (!response.ok) {
        throw new Error(payload.message || 'API request failed');
      }

      return payload.data as T;
    };

    return executeRequest();
  }

  static get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  static post<T>(endpoint: string, body: any) {
    return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }

  static put<T>(endpoint: string, body: any) {
    return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  }

  static delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

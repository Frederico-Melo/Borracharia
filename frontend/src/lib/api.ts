const configuredUrl = new URLSearchParams(window.location.search).get('api');
export const API_URL = configuredUrl || 'http://127.0.0.1:3333/api';

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Não foi possível concluir a operação.');
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function downloadBackup() {
  const response = await fetch(`${API_URL}/backups/export`);
  if (!response.ok) throw new Error('Não foi possível criar o backup.');
  const blob = await response.blob();
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `backup-pneu-pro-${new Date().toISOString().slice(0, 10)}.db`;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

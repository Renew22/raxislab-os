import { Client, SEED_CLIENTS } from './clients-data';

const STORAGE_KEY = 'raxislab_clients';

function initIfEmpty(): void {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_CLIENTS));
  }
}

export function getClients(): Client[] {
  if (typeof window === 'undefined') return SEED_CLIENTS;
  initIfEmpty();
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return SEED_CLIENTS;
  }
}

export function addClient(client: Client): void {
  const clients = getClients();
  clients.push(client);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

export function updateClient(id: string, data: Partial<Client>): void {
  const clients = getClients();
  const idx = clients.findIndex(c => c.id === id);
  if (idx !== -1) {
    clients[idx] = { ...clients[idx], ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  }
}

export function deleteClient(id: string): void {
  const clients = getClients().filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

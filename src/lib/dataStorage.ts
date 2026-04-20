// Data storage utilities using localStorage for CRUD operations
// This can be migrated to Supabase later

export interface DataRecord {
  id: string;
  [key: string]: any;
}

export interface DataTable {
  name: string;
  records: DataRecord[];
}

const STORAGE_KEY = 'pln_jarkom_data';

// Initialize data from localStorage
function getDatabase(): Record<string, DataTable> {
  if (typeof window === 'undefined') return {};
  
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
}

// Save database to localStorage
function saveDatabase(db: Record<string, DataTable>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// Get all records from a table
export function getTableData(tableName: string): DataRecord[] {
  const db = getDatabase();
  return db[tableName]?.records || [];
}

// Add new record
export function addRecord(tableName: string, record: Omit<DataRecord, 'id'>) {
  const db = getDatabase();
  
  if (!db[tableName]) {
    db[tableName] = { name: tableName, records: [] };
  }
  
  const newRecord: DataRecord = {
    id: `${tableName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...record,
  };
  
  db[tableName].records.push(newRecord);
  saveDatabase(db);
  
  return newRecord;
}

// Update existing record
export function updateRecord(tableName: string, id: string, updates: Partial<DataRecord>) {
  const db = getDatabase();
  
  if (!db[tableName]) return null;
  
  const index = db[tableName].records.findIndex(r => r.id === id);
  if (index === -1) return null;
  
  db[tableName].records[index] = {
    ...db[tableName].records[index],
    ...updates,
  };
  
  saveDatabase(db);
  return db[tableName].records[index];
}

// Delete record
export function deleteRecord(tableName: string, id: string) {
  const db = getDatabase();
  
  if (!db[tableName]) return false;
  
  const index = db[tableName].records.findIndex(r => r.id === id);
  if (index === -1) return false;
  
  db[tableName].records.splice(index, 1);
  saveDatabase(db);
  
  return true;
}

// Get single record by ID
export function getRecord(tableName: string, id: string): DataRecord | null {
  const db = getDatabase();
  return db[tableName]?.records.find(r => r.id === id) || null;
}

// Bulk import data (seeding from initial data)
export function importTableData(tableName: string, records: DataRecord[]) {
  const db = getDatabase();
  
  db[tableName] = {
    name: tableName,
    records: records.map((record, index) => ({
      id: record.id || `${tableName}_${index}`,
      ...record,
    })),
  };
  
  saveDatabase(db);
}

// Export table as CSV
export function exportTableAsCSV(tableName: string, records: DataRecord[]): string {
  if (records.length === 0) return '';
  
  const headers = Object.keys(records[0]);
  const csv = [
    headers.join(','),
    ...records.map(record =>
      headers.map(header => {
        const value = record[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    ),
  ].join('\n');
  
  return csv;
}

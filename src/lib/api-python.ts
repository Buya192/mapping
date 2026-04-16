// Endpoint FastAPI lokal
const PYTHON_API_URL = 'http://localhost:8000';

export interface PowerFlowResult {
  voltage_pu: Record<string, number>;
  line_loading_percent: Record<string, number>;
}

export interface GridSimulationResponse {
  status: string;
  results: PowerFlowResult;
  metrics?: {
    lowest_voltage_pu: number;
    highest_loading_percent: number;
    system_losses_kw: number;
    total_buses_simulated: number;
  };
}

/**
 * Ping backend Python
 */
export async function pingPythonEngine(): Promise<boolean> {
  try {
    const res = await fetch(`${PYTHON_API_URL}/`, { cache: 'no-store' });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'online';
  } catch (error) {
    console.error('Python Engine is unreachable:', error);
    return false;
  }
}

/**
 * Mengirim koordinat 13,000 titik tiang JTM ke Python
 * untuk direkonstruksi menjadi rute kabel menggunakan Minimum Spanning Tree (MST).
 */
export async function draw20kVTopology(poles: { id: string, lat: number, lng: number, penyulang?: string }[], maxDistM: number = 200.0) {
  try {
    const res = await fetch(`${PYTHON_API_URL}/api/topology/build-20kv`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nodes: poles,
        max_distance_m: maxDistM
      })
    });
    return await res.json();
  } catch (error) {
    console.error("Gagal menarik topologi 20kV dari Python:", error);
    return null;
  }
}


/**
 * Mendorong data topologi jaringan dan beban ke Python
 * untuk dijalankan perhitungan Load Flow (Aliran Daya) NR Pandas.
 */
export async function runLoadFlowSimulation(poles: { id: string, lat: number, lng: number, penyulang?: string }[], maxDistM: number = 200.0) {
  try {
    const res = await fetch(`${PYTHON_API_URL}/api/grid/simulate-power-flow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodes: poles,
        max_distance_m: maxDistM
      })
    });
    return await res.json();
  } catch (error) {
    console.error('Failed to run Power Flow on Python:', error);
    return null;
  }
}

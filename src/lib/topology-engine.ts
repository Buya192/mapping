/**
 * topology-engine.ts
 * 
 * Graph-based network topology engine for PLN grid.
 * Inspired by OpenLayers' pattern of: Feature → Graph → Traversal → Style Update
 * 
 * Uses `graphology` for BFS/DFS traversal to find downstream affected nodes
 * when a fault occurs at any point in the network.
 * 
 * Architecture (OpenLayers-inspired):
 * ┌─────────────┐    ┌──────────┐    ┌───────────┐    ┌──────────────┐
 * │ GeoJSON Data│───▶│ Graph    │───▶│ Traversal │───▶│ Affected Set │
 * │ (tiang,gardu)│    │ (nodes/ │    │ (BFS from │    │ (IDs to      │
 * │             │    │  edges)  │    │  fault)   │    │ highlight)   │
 * └─────────────┘    └──────────┘    └───────────┘    └──────────────┘
 */

import Graph from 'graphology';
import { bfsFromNode } from 'graphology-traversal';

// ===== TYPES =====
export interface NetworkNode {
  id: string;
  type: 'gardu' | 'tiang' | 'pembangkit';
  name: string;
  lat: number;
  lng: number;
  penyulang?: string;
  isSource?: boolean; // pembangkit / gardu induk = power source
  metadata?: Record<string, any>;
}

export interface NetworkEdge {
  source: string;
  target: string;
  distance: number; // meters
  conductorType?: string;
  lineId?: string;
}

export interface FaultResult {
  faultNodeId: string;
  faultNodeName: string;
  faultPenyulang: string;
  affectedNodeIds: Set<string>;
  affectedEdgeKeys: Set<string>;
  affectedNodes: NetworkNode[];
  totalAffectedTiang: number;
  totalAffectedGardu: number;
  estimatedCustomersAffected: number;
  totalAffectedCableKm: number;
  blackoutPolygon: [number, number][] | null;
}

// ===== HAVERSINE DISTANCE =====
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ===== CONVEX HULL (Gift wrapping for blackout polygon) =====
function convexHull(points: [number, number][]): [number, number][] {
  if (points.length < 3) return points;
  
  let start = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i][0] < points[start][0]) start = i;
  }
  
  const hull: [number, number][] = [];
  let current = start;
  let iterations = 0;
  const maxIter = points.length * 2;
  
  do {
    hull.push(points[current]);
    let next = 0;
    for (let i = 1; i < points.length; i++) {
      if (next === current) { next = i; continue; }
      const cross = (points[i][0] - points[current][0]) * (points[next][1] - points[current][1])
                  - (points[i][1] - points[current][1]) * (points[next][0] - points[current][0]);
      if (cross < 0) next = i;
    }
    current = next;
    iterations++;
  } while (current !== start && iterations < maxIter);
  
  if (hull.length > 0) hull.push(hull[0]);
  return hull;
}

// ===== BUILD NETWORK GRAPH =====
/**
 * Build a penyulang-aware graph from tiang and gardu data.
 * 
 * Strategy:
 * - Tiang with SAME penyulang are connected if within maxSpan.
 * - Gardu connect to nearest tiang of ANY penyulang (they're hubs).
 * - Pembangkit connect to nearest gardu (they're power sources).
 * 
 * Per-penyulang edge building produces realistic topology.
 */
export function buildNetworkGraph(
  tiangData: any[],
  garduData: any[],
  pembangkitData: any[] = [],
  maxSpanMeters: number = 120  // Tighter span: typical PLN span is 40-80m
): { graph: Graph; nodeMap: Map<string, NetworkNode> } {
  const graph = new Graph({ type: 'undirected', multi: false });
  const nodeMap = new Map<string, NetworkNode>();
  
  // 1. Add Pembangkit as source nodes
  pembangkitData.forEach(p => {
    const id = `pembangkit_${p.id || p.name}`;
    const node: NetworkNode = {
      id, type: 'pembangkit', name: p.name || p.id,
      lat: p.lat, lng: p.lng,
      isSource: true,
      metadata: p,
    };
    nodeMap.set(id, node);
    if (!graph.hasNode(id)) graph.addNode(id, node);
  });
  
  // 2. Add Gardu as hub/source nodes
  // In radial PLN network, gardu distribusi is the LOCAL source for its sub-network
  garduData.forEach(g => {
    const id = `gardu_${g.id || g.nama || g.namaGardu}`;
    const node: NetworkNode = {
      id, type: 'gardu', name: g.nama || g.namaGardu || g.name || g.id,
      lat: g.lat, lng: g.lng,
      penyulang: (g.feeder || g.namaPenyulang || '').toUpperCase(),
      isSource: true,  // Gardu is a source (distribusi point)
      metadata: g,
    };
    nodeMap.set(id, node);
    if (!graph.hasNode(id)) graph.addNode(id, node);
  });
  
  // 3. Add Tiang as network nodes
  tiangData.forEach(t => {
    const id = `tiang_${t.id || t.objectId || t.nama_tiang}`;
    const node: NetworkNode = {
      id, type: 'tiang', name: t.nama_tiang || t.name || t.id,
      lat: t.lat || t.latitude, lng: t.lng || t.longitude,
      penyulang: (t.penyulang || '').toUpperCase(),
      metadata: t,
      isSource: false,
    };
    nodeMap.set(id, node);
    if (!graph.hasNode(id)) graph.addNode(id, node);
  });
  
  // 4. Build edges PER-PENYULANG (realistic: tiang only connects within same penyulang)
  const tiangByPenyulang = new Map<string, NetworkNode[]>();
  const garduNodes: NetworkNode[] = [];

  nodeMap.forEach(node => {
    if (node.type === 'tiang') {
      const p = node.penyulang || 'UNKNOWN';
      if (!tiangByPenyulang.has(p)) tiangByPenyulang.set(p, []);
      tiangByPenyulang.get(p)!.push(node);
    } else if (node.type === 'gardu') {
      garduNodes.push(node);
    }
  });

  // 4a. Connect tiang within same penyulang using nearest-neighbor chain
  tiangByPenyulang.forEach((poles, penyulangName) => {
    if (poles.length < 2) return;
    
    // Build MST-like connections: each tiang connects to 1-2 nearest within same penyulang
    for (let i = 0; i < poles.length; i++) {
      const a = poles[i];
      const candidates: { node: NetworkNode; dist: number }[] = [];
      
      for (let j = 0; j < poles.length; j++) {
        if (i === j) continue;
        const d = haversine(a.lat, a.lng, poles[j].lat, poles[j].lng);
        if (d <= maxSpanMeters) {
          candidates.push({ node: poles[j], dist: d });
        }
      }
      
      candidates.sort((x, y) => x.dist - y.dist);
      // Connect to max 2 nearest (chain topology, not mesh)
      const maxConn = 2;
      for (let k = 0; k < Math.min(candidates.length, maxConn); k++) {
        if (!graph.hasEdge(a.id, candidates[k].node.id)) {
          try {
            graph.addEdge(a.id, candidates[k].node.id, { distance: candidates[k].dist });
          } catch { /* already exists */ }
        }
      }
    }
  });

  // 4b. Connect gardu to nearest tiang (cross-penyulang hub)
  garduNodes.forEach(gardu => {
    const allTiang = Array.from(nodeMap.values()).filter(n => n.type === 'tiang');
    let nearest: NetworkNode | null = null;
    let minDist = Infinity;
    
    allTiang.forEach(t => {
      const d = haversine(gardu.lat, gardu.lng, t.lat, t.lng);
      if (d < minDist && d <= maxSpanMeters * 2) { // Gardu has longer reach
        minDist = d;
        nearest = t;
      }
    });
    
    if (nearest && !graph.hasEdge(gardu.id, (nearest as NetworkNode).id)) {
      try {
        graph.addEdge(gardu.id, (nearest as NetworkNode).id, { distance: minDist });
      } catch { /* already exists */ }
    }
  });

  // 4c. Connect pembangkit to nearest gardu
  nodeMap.forEach(node => {
    if (node.type !== 'pembangkit') return;
    let nearest: NetworkNode | null = null;
    let minDist = Infinity;
    
    garduNodes.forEach(g => {
      const d = haversine(node.lat, node.lng, g.lat, g.lng);
      if (d < minDist) { minDist = d; nearest = g; }
    });
    
    if (nearest && !graph.hasEdge(node.id, (nearest as NetworkNode).id)) {
      try {
        graph.addEdge(node.id, (nearest as NetworkNode).id, { distance: minDist });
      } catch { /* already exists */ }
    }
  });
  
  console.log(`[TopologyEngine] Built graph: ${graph.order} nodes, ${graph.size} edges`);
  return { graph, nodeMap };
}

// ===== SIMULATE FAULT =====
/**
 * Simulate a fault at a specific node.
 * 
 * Uses BFS traversal (like OpenLayers' Select interaction propagation)
 * to find all downstream nodes that would lose power.
 * 
 * Logic: Remove the fault node from the graph.
 * BFS from all source nodes (gardu/pembangkit) to find what's still reachable.
 * Everything else = AFFECTED (no power).
 * 
 * IMPORTANT: Only nodes on the SAME penyulang as fault are considered.
 * This prevents cross-penyulang cascade (realistic for PLN radial network).
 */
export function simulateFault(
  faultNodeId: string,
  graph: Graph,
  nodeMap: Map<string, NetworkNode>,
  pelangganPerGardu: number = 35
): FaultResult {
  const faultNode = nodeMap.get(faultNodeId);
  if (!faultNode) {
    return {
      faultNodeId, faultNodeName: 'Unknown', faultPenyulang: '',
      affectedNodeIds: new Set(), affectedEdgeKeys: new Set(),
      affectedNodes: [], totalAffectedTiang: 0, totalAffectedGardu: 0,
      estimatedCustomersAffected: 0, totalAffectedCableKm: 0, blackoutPolygon: null,
    };
  }

  const faultPenyulang = faultNode.penyulang || '';
  
  // Step 1: Find all source nodes (gardu + pembangkit)
  const sourceNodes = new Set<string>();
  nodeMap.forEach((node, id) => {
    if (node.isSource && id !== faultNodeId) sourceNodes.add(id);
  });
  
  // Step 2: BFS from each source, NOT traversing through the fault node
  // "Reachable" = can get power without passing through the faulted node
  const reachableFromSource = new Set<string>();
  
  sourceNodes.forEach(sourceId => {
    bfsFromNode(graph, sourceId, (node) => {
      if (node === faultNodeId) return false; // Block traversal through fault
      reachableFromSource.add(node);
      return true;
    });
  });
  
  // Step 3: Affected = NOT reachable AND same penyulang (or tiang with no penyulang)
  const affectedNodeIds = new Set<string>();
  
  graph.forEachNode((nodeId) => {
    if (reachableFromSource.has(nodeId)) return;
    
    const node = nodeMap.get(nodeId);
    if (!node) return;
    
    // Only count nodes on the same penyulang or gardu nearby
    if (faultPenyulang && node.penyulang && node.penyulang !== faultPenyulang && node.type === 'tiang') {
      return; // Different penyulang tiang → not affected
    }
    
    affectedNodeIds.add(nodeId);
  });
  
  // Always include fault node
  affectedNodeIds.add(faultNodeId);
  
  // Step 4: Collect affected edges (both endpoints must be affected)
  const affectedEdgeKeys = new Set<string>();
  graph.forEachEdge((edgeKey, _attrs, source, target) => {
    if (affectedNodeIds.has(source) && affectedNodeIds.has(target)) {
      affectedEdgeKeys.add(edgeKey);
    }
  });
  
  // Step 5: Calculate statistics
  const affectedNodes: NetworkNode[] = [];
  let totalTiang = 0, totalGardu = 0, totalCableM = 0;
  const affectedPoints: [number, number][] = [];
  
  affectedNodeIds.forEach(id => {
    const node = nodeMap.get(id);
    if (node) {
      affectedNodes.push(node);
      affectedPoints.push([node.lng, node.lat]);
      if (node.type === 'tiang') totalTiang++;
      if (node.type === 'gardu') totalGardu++;
    }
  });
  
  affectedEdgeKeys.forEach(ek => {
    try {
      const attrs = graph.getEdgeAttributes(ek);
      totalCableM += attrs.distance || 0;
    } catch { /* edge may not exist */ }
  });
  
  const blackoutPolygon = affectedPoints.length >= 3 ? convexHull(affectedPoints) : null;
  
  return {
    faultNodeId,
    faultNodeName: faultNode.name,
    faultPenyulang,
    affectedNodeIds,
    affectedEdgeKeys,
    affectedNodes,
    totalAffectedTiang: totalTiang,
    totalAffectedGardu: totalGardu,
    estimatedCustomersAffected: totalGardu * pelangganPerGardu,
    totalAffectedCableKm: totalCableM / 1000,
    blackoutPolygon,
  };
}

// ===== FIND NEAREST NODE =====
export function findNearestNode(
  lat: number, lng: number,
  nodeMap: Map<string, NetworkNode>,
  maxRadius: number = 500
): NetworkNode | null {
  let nearest: NetworkNode | null = null;
  let minDist = Infinity;
  
  nodeMap.forEach(node => {
    const d = haversine(lat, lng, node.lat, node.lng);
    if (d < minDist && d <= maxRadius) {
      minDist = d;
      nearest = node;
    }
  });
  
  return nearest;
}

// ===== GET SUBNETWORK STATS =====
export function getSubnetworkStats(
  nodeId: string,
  graph: Graph,
  nodeMap: Map<string, NetworkNode>
): { tiangCount: number; garduCount: number; totalCableKm: number; connectedNodes: string[] } {
  const connected: string[] = [];
  let tiangCount = 0, garduCount = 0;
  
  bfsFromNode(graph, nodeId, (node) => {
    connected.push(node);
    const n = nodeMap.get(node);
    if (n?.type === 'tiang') tiangCount++;
    if (n?.type === 'gardu') garduCount++;
    return true;
  });
  
  let totalCableM = 0;
  graph.forEachEdge((_ek, attrs, source, target) => {
    if (connected.includes(source) && connected.includes(target)) {
      totalCableM += attrs.distance || 0;
    }
  });
  
  return { tiangCount, garduCount, totalCableKm: totalCableM / 1000, connectedNodes: connected };
}

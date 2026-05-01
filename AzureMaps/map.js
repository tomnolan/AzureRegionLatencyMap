// ─────────────────────────────────────────────
//  CSV parsing
// ─────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (vals[i] || '').trim(); });
    return obj;
  });
}

// Parse regions — populated by init()
let regionRows = [];
const regionMap = {};
const latencyLookup = {};
const connections = [];

// ─────────────────────────────────────────────
//  Map state
// ─────────────────────────────────────────────

let map = null;
let datasource = null;
let pointDatasource = null;
let initialized = false;
let selectedNode = null;
let selectedLine = null; // 'source|target' sorted key
let currentFiltered = [];
let pinnedTooltipGeo = null;    // [lon, lat] anchor for the pinned line tooltip
let pinnedTooltipOffset = null; // [dx, dy] offset from midpoint pixels to tooltip position
let pinnedNodeTooltipGeo = null;    // [lon, lat] anchor for the pinned node tooltip
let pinnedNodeTooltipOffset = null; // [dx, dy] offset for the pinned node tooltip

// ─────────────────────────────────────────────
//  Color by latency
// ─────────────────────────────────────────────

function latencyColor(ms) {
  if (ms < 50)  return '#00e676';
  if (ms < 100) return '#ffee58';
  if (ms < 200) return '#ffa726';
  return '#ef5350';
}

function latencyWidth(ms) {
  if (ms < 50)  return 5;
  if (ms < 100) return 4;
  if (ms < 200) return 3.5;
  return 2.5;
}

// ─────────────────────────────────────────────
//  Hierarchical tree filter
// ─────────────────────────────────────────────

function buildHierarchyData() {
  const h = {};
  regionRows.forEach(r => {
    if (!r.DisplayName) return;
    const gg  = r.GeographyGroup || '(Other)';
    const geo = r.Geography      || '(Other)';
    if (!h[gg]) h[gg] = {};
    if (!h[gg][geo]) h[gg][geo] = [];
    h[gg][geo].push(r.DisplayName);
  });
  const sorted = {};
  Object.keys(h).sort().forEach(gg => {
    sorted[gg] = {};
    Object.keys(h[gg]).sort().forEach(geo => {
      sorted[gg][geo] = h[gg][geo].sort();
    });
  });
  return sorted;
}

function buildTreePicker(containerId) {
  const treeId    = containerId;
  const toolbarId = containerId + '-toolbar';

  // Build toolbar
  const toolbar = document.getElementById(toolbarId);
  if (toolbar) {
    const actions = [
      { label: '✓ All',    fn: () => { document.querySelectorAll(`#${treeId} .tree-cb`).forEach(cb => { cb.checked = true; cb.indeterminate = false; }); } },
      { label: '✗ None',   fn: () => { document.querySelectorAll(`#${treeId} .tree-cb`).forEach(cb => { cb.checked = false; cb.indeterminate = false; }); } },
      { label: '⊞ Expand', fn: () => {
        document.querySelectorAll(`#${treeId} .tree-children`).forEach(ul => ul.classList.remove('tree-collapsed'));
        document.querySelectorAll(`#${treeId} .tree-toggle`).forEach(t => t.textContent = '▼');
      }},
      { label: '⊟ Collapse', fn: () => {
        document.querySelectorAll(`#${treeId} .tree-children`).forEach(ul => ul.classList.add('tree-collapsed'));
        document.querySelectorAll(`#${treeId} .tree-toggle`).forEach(t => t.textContent = '▶');
      }},
    ];
    actions.forEach(({ label, fn }) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.addEventListener('click', fn);
      toolbar.appendChild(btn);
    });
  }

  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const hierarchy = buildHierarchyData();
  const ul = document.createElement('ul');
  ul.className = 'tree-list';

  Object.entries(hierarchy).forEach(([gg, geos]) => {
    const ggLi = document.createElement('li');
    ggLi.className = 'tree-node';

    const ggRow = document.createElement('div');
    ggRow.className = 'tree-row tree-level-0';

    const ggCb = document.createElement('input');
    ggCb.type = 'checkbox'; ggCb.className = 'tree-cb'; ggCb.checked = false;

    const ggToggle = document.createElement('span');
    ggToggle.className = 'tree-toggle'; ggToggle.textContent = '▼';

    const ggLabel = document.createElement('span');
    ggLabel.className = 'tree-node-label'; ggLabel.textContent = gg;

    ggRow.appendChild(ggCb);
    ggRow.appendChild(ggToggle);
    ggRow.appendChild(ggLabel);
    ggLi.appendChild(ggRow);

    const geoUl = document.createElement('ul');
    geoUl.className = 'tree-children';

    Object.entries(geos).forEach(([geo, regions]) => {
      const geoLi = document.createElement('li');
      geoLi.className = 'tree-node';

      const geoRow = document.createElement('div');
      geoRow.className = 'tree-row tree-level-1';

      const geoCb = document.createElement('input');
      geoCb.type = 'checkbox'; geoCb.className = 'tree-cb'; geoCb.checked = false;

      const geoToggle = document.createElement('span');
      geoToggle.className = 'tree-toggle'; geoToggle.textContent = '▶';

      const geoLabel = document.createElement('span');
      geoLabel.className = 'tree-node-label'; geoLabel.textContent = geo;

      geoRow.appendChild(geoCb);
      geoRow.appendChild(geoToggle);
      geoRow.appendChild(geoLabel);
      geoLi.appendChild(geoRow);

      const regionUl = document.createElement('ul');
      regionUl.className = 'tree-children tree-collapsed';

      regions.forEach(name => {
        const regLi = document.createElement('li');
        regLi.className = 'tree-node';

        const regRow = document.createElement('div');
        regRow.className = 'tree-row tree-level-2';

        const regCb = document.createElement('input');
        regCb.type = 'checkbox'; regCb.className = 'tree-cb tree-region-cb';
        regCb.value = name; regCb.checked = false;

        const regLabel = document.createElement('span');
        regLabel.className = 'tree-node-label'; regLabel.textContent = name;

        regRow.appendChild(regCb);
        regRow.appendChild(regLabel);
        regLi.appendChild(regRow);
        regionUl.appendChild(regLi);

        regCb.addEventListener('change', () => updateAncestors(regCb));
        regLabel.addEventListener('click', () => { regCb.checked = !regCb.checked; regCb.dispatchEvent(new Event('change')); });
      });

      geoLi.appendChild(regionUl);
      geoUl.appendChild(geoLi);

      geoCb.addEventListener('change', () => {
        setDescendants(geoLi, geoCb.checked);
        updateAncestors(geoCb);
      });
      const toggleGeo = () => {
        const collapsed = regionUl.classList.toggle('tree-collapsed');
        geoToggle.textContent = collapsed ? '▶' : '▼';
      };
      geoToggle.addEventListener('click', toggleGeo);
      geoLabel.addEventListener('click', toggleGeo);
    });

    ggLi.appendChild(geoUl);
    ul.appendChild(ggLi);

    ggCb.addEventListener('change', () => setDescendants(ggLi, ggCb.checked));
    const toggleGg = () => {
      const collapsed = geoUl.classList.toggle('tree-collapsed');
      ggToggle.textContent = collapsed ? '▶' : '▼';
    };
    ggToggle.addEventListener('click', toggleGg);
    ggLabel.addEventListener('click', toggleGg);
  });

  container.appendChild(ul);
}

// Set all checkboxes in a subtree to checked/unchecked
function setDescendants(nodeLi, checked) {
  nodeLi.querySelectorAll('.tree-cb').forEach(cb => {
    cb.checked = checked;
    cb.indeterminate = false;
  });
}

// Walk up the tree updating parent checkbox states (checked / indeterminate / unchecked)
function updateAncestors(cb) {
  let currentLi = cb.closest('.tree-node');
  let parentUl  = currentLi.parentElement;
  while (parentUl && parentUl.classList.contains('tree-children')) {
    const parentLi = parentUl.parentElement;
    if (!parentLi || !parentLi.classList.contains('tree-node')) break;
    const parentCb  = parentLi.querySelector(':scope > .tree-row > .tree-cb');
    const childCbs  = [...parentUl.querySelectorAll(':scope > .tree-node > .tree-row > .tree-cb')];
    const allOn     = childCbs.every(c => c.checked && !c.indeterminate);
    const allOff    = childCbs.every(c => !c.checked && !c.indeterminate);
    parentCb.checked       = allOn;
    parentCb.indeterminate = !allOn && !allOff;
    currentLi = parentLi;
    parentUl  = currentLi.parentElement;
  }
}

// Returns null (all selected) or a Set of checked region DisplayNames
// Returns null (all selected), an empty Set (none selected), or a Set of checked region DisplayNames
function getTreeSelectedRegions(containerId) {
  const allCbs = [...document.querySelectorAll(`#${containerId} .tree-region-cb`)];
  const checkedCbs = allCbs.filter(cb => cb.checked);
  if (checkedCbs.length === allCbs.length) return null; // null = all
  return new Set(checkedCbs.map(cb => cb.value)); // empty set when none checked
}

// Reset a tree to all-checked
function resetTree(containerId) {
  document.querySelectorAll(`#${containerId} .tree-cb`).forEach(cb => {
    cb.checked = false; cb.indeterminate = false;
  });
}

// ─────────────────────────────────────────────
//  Map rendering
// ─────────────────────────────────────────────

// After a style change Azure Maps may return raw GeoJSON Features (with .properties)
// instead of atlas.Shape instances (with .getProperties()). Handle both.
function getShapeProps(shape) {
  return typeof shape.getProperties === 'function' ? shape.getProperties() : shape.properties;
}

// Build a quadratic-Bézier approximation between two lon/lat points.
// The control point is offset perpendicular to the midpoint, giving a subtle arc.
function curvedLine(lon1, lat1, lon2, lat2, steps = 48, curvature = 0.15) {
  const mx = (lon1 + lon2) / 2;
  const my = (lat1 + lat2) / 2;
  const dx = lon2 - lon1;
  const dy = lat2 - lat1;
  // Perpendicular unit direction scaled by curvature
  const cx = mx - dy * curvature;
  const cy = my + dx * curvature;
  const coords = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    coords.push([
      u * u * lon1 + 2 * u * t * cx + t * t * lon2,
      u * u * lat1 + 2 * u * t * cy + t * t * lat2,
    ]);
  }
  return coords;
}

function renderConnections() {
  if (!datasource) return;

  datasource.clear();
  pointDatasource.clear();

  const srcSet = getTreeSelectedRegions('src-tree'); // null = all, empty Set = none
  const dstSet = getTreeSelectedRegions('dst-tree');

  // Nothing selected on either side → render nothing
  if ((srcSet !== null && srcSet.size === 0) || (dstSet !== null && dstSet.size === 0)) {
    document.getElementById('stat-lines').textContent = '0';
    document.getElementById('stat-regions').textContent = '0';
    currentFiltered = [];
    return;
  }

  const latMin = parseFloat(document.getElementById('lat-min').value) || null;
  const latMax = parseFloat(document.getElementById('lat-max').value) || null;

  // Filter connections: one endpoint must match src filter, other must match dst filter
  const filtered = connections.filter(c => {
    const inSrc = r => !srcSet || srcSet.has(r);
    const inDst = r => !dstSet || dstSet.has(r);
    if (!((inSrc(c.source) && inDst(c.target)) || (inSrc(c.target) && inDst(c.source)))) return false;
    if (latMin !== null && c.latency < latMin) return false;
    if (latMax !== null && c.latency > latMax) return false;
    return true;
  });

  // Track which regions appear in filtered connections
  const activeRegionNames = new Set();
  filtered.forEach(c => { activeRegionNames.add(c.source); activeRegionNames.add(c.target); });

  // Add line features — deduplicate pairs so only one line is drawn per pair
  const drawnPairs = new Set();
  filtered.forEach(c => {
    const pairKey = [c.source, c.target].sort().join('|');
    if (drawnPairs.has(pairKey)) return;
    drawnPairs.add(pairKey);

    const srcReg = regionMap[c.source];
    const tgtReg = regionMap[c.target];
    if (!srcReg || !tgtReg) return;

    const srcLon = parseFloat(srcReg.Longitude);
    const srcLat = parseFloat(srcReg.Latitude);
    const tgtLon = parseFloat(tgtReg.Longitude);
    const tgtLat = parseFloat(tgtReg.Latitude);

    if (isNaN(srcLon) || isNaN(srcLat) || isNaN(tgtLon) || isNaN(tgtLat)) return;

    const connectedToNode = selectedNode !== null && (c.source === selectedNode || c.target === selectedNode);
    const isSelectedLine = selectedLine !== null && [c.source, c.target].sort().join('|') === selectedLine;
    // Line selection takes priority over node selection for dimming
    const dimmed = selectedLine !== null ? !isSelectedLine
                 : selectedNode !== null ? !connectedToNode
                 : false;
    const fwdLatency = latencyLookup[c.source]?.[c.target];
    const revLatency = latencyLookup[c.target]?.[c.source];
    // Use the average for color/width when both directions exist
    const repLatency = (fwdLatency !== undefined && revLatency !== undefined)
      ? Math.round((fwdLatency + revLatency) / 2)
      : (fwdLatency ?? revLatency ?? c.latency);
    datasource.add(new atlas.data.Feature(
      new atlas.data.LineString(curvedLine(srcLon, srcLat, tgtLon, tgtLat)),
      {
        source: c.source,
        target: c.target,
        latency: fwdLatency,
        latencyReverse: revLatency,
        color: dimmed ? '#333333' : latencyColor(repLatency),
        strokeWidth: latencyWidth(repLatency),
        opacity: dimmed ? 0.2 : 0.65,
      }
    ));
  });

  // Add point features for active regions
  regionRows.forEach(r => {
    if (!activeRegionNames.has(r.DisplayName)) return;
    const lon = parseFloat(r.Longitude);
    const lat = parseFloat(r.Latitude);
    if (isNaN(lon) || isNaN(lat)) return;

    pointDatasource.add(new atlas.data.Feature(
      new atlas.data.Point([lon, lat]),
      {
        name: r.DisplayName,
        geography: r.Geography,
        geoGroup: r.GeographyGroup,
        physicalLocation: r.PhysicalLocation,
        pairedRegion: r.PairedRegion,
        azCount: r.AvailabilityZoneCount,
        specialAccess: r['Special Access'],
        longitude: lon,
        latitude: lat,
      }
    ));
  });

  document.getElementById('stat-lines').textContent = filtered.length.toLocaleString();
  document.getElementById('stat-regions').textContent = activeRegionNames.size;
  currentFiltered = filtered.slice();
}

// ─────────────────────────────────────────────
//  Initialize map
// ─────────────────────────────────────────────

function initMap(apiKey) {
  map = new atlas.Map('map', {
    authOptions: {
      authType: 'subscriptionKey',
      subscriptionKey: apiKey,
    },
    style: 'night',
    center: [20, 20],
    zoom: 1.8,
    language: 'en-US',
  });

  map.events.add('ready', () => {
    document.getElementById('loading').style.display = 'none';

    map.controls.add(new atlas.control.StyleControl({
      mapStyles: ['night', 'road', 'grayscale_dark', 'grayscale_light'],
      layout: 'list',
    }), { position: 'top-left' });

    datasource = new atlas.source.DataSource();
    pointDatasource = new atlas.source.DataSource();
    map.sources.add(datasource);
    map.sources.add(pointDatasource);

    // Line layer
    const lineLayer = new atlas.layer.LineLayer(datasource, 'lines', {
      strokeColor: ['get', 'color'],
      strokeWidth: ['get', 'strokeWidth'],
      strokeOpacity: ['get', 'opacity'],
    });

    // Point layer
    const pointLayer = new atlas.layer.BubbleLayer(pointDatasource, 'points', {
      radius: 5,
      color: [
        'case',
        ['>', ['to-number', ['get', 'azCount'], 0], 1], '#1955EC',
        '#707687'
      ],
      strokeColor: '#ffffff',
      strokeWidth: 1.5,
      opacity: 0.9,
    });

    map.layers.add(lineLayer);
    map.layers.add(pointLayer);

    // Hover on lines
    map.events.add('mousemove', lineLayer, (e) => {
      if (e.shapes && e.shapes.length > 0) {
        const props = getShapeProps(e.shapes[0]);
        const pairKey = [props.source, props.target].sort().join('|');
        const connectedToNode = selectedNode !== null && (props.source === selectedNode || props.target === selectedNode);
        const isSelectedLine = selectedLine !== null && pairKey === selectedLine;
        const dimmed = selectedLine !== null ? !isSelectedLine
                     : selectedNode !== null ? !connectedToNode
                     : false;
        if (dimmed) { if (!selectedLine) hideTooltip(); map.getCanvas().style.cursor = ''; return; }
        // When a line is pinned, hover on any line just shows cursor — don't overwrite the pinned tooltip
        if (selectedLine) { map.getCanvas().style.cursor = 'pointer'; return; }
        // Hide any unpinned node hover tooltip while hovering a line
        if (selectedNode === null) hideNodeTooltip();
        showTooltip(e, props, false);
        map.getCanvas().style.cursor = 'pointer';
      }
    });

    map.events.add('mouseleave', lineLayer, () => {
      // Only hide tooltip if no line is pinned
      if (!selectedLine) hideTooltip();
      map.getCanvas().style.cursor = '';
    });

    // Click on a line to pin/unpin its tooltip and gray out everything else
    map.events.add('click', lineLayer, (e) => {
      // Mark synchronously so the background click handler skips this event
      if (e.originalEvent) e.originalEvent._lineHandled = true;
      // Defer so pointLayer click fires first and can set _nodeHandled
      setTimeout(() => {
        if (e.originalEvent && e.originalEvent._nodeHandled) return;
        if (e.shapes && e.shapes.length > 0) {
          const props = getShapeProps(e.shapes[0]);
          const pairKey = [props.source, props.target].sort().join('|');
          if (selectedLine === pairKey) {
            selectedLine = null;
            hideTooltip();
          } else {
            selectedLine = pairKey;
            // If the selected node isn't connected to this path, clear it
            if (selectedNode !== null && props.source !== selectedNode && props.target !== selectedNode) {
              selectedNode = null;
              hideNodeTooltip();
            }
            showTooltip(e, props, true);
          }
          renderConnections();
        }
      }, 0);
    });

    // Hover on points
    map.events.add('mousemove', pointLayer, (e) => {
      if (e.shapes && e.shapes.length > 0) {
        map.getCanvas().style.cursor = 'pointer';
        const props = getShapeProps(e.shapes[0]);
        // Always hide unpinned line hover tooltip when entering a node
        if (selectedLine === null) hideTooltip();
        if (selectedNode === null) {
          // No pinned node — use dedicated node tooltip
          showPointTooltip(e, props);
        } else if (props.name !== selectedNode && selectedLine === null) {
          // Node is pinned but hovering a different one, no path pinned — borrow #tooltip
          showNodeDataInPathTooltip(e, props);
        }
      }
    });

    map.events.add('mouseleave', pointLayer, () => {
      map.getCanvas().style.cursor = '';
      if (selectedNode === null) {
        hideNodeTooltip();
      } else if (selectedLine === null) {
        // Was using #tooltip for node hover — hide it
        hideTooltip();
      }
    });

    // Click on a point node to pin/unpin its tooltip and highlight its connections
    map.events.add('click', pointLayer, (e) => {
      if (e.shapes && e.shapes.length > 0) {
        if (e.originalEvent) e.originalEvent._nodeHandled = true;
        const props = getShapeProps(e.shapes[0]);
        const name = props.name;
        if (selectedNode === name) {
          selectedNode = null;
          hideNodeTooltip();
        } else {
          selectedNode = name;
          // If the pinned path doesn't connect to this node, clear it
          if (selectedLine !== null) {
            const [lineA, lineB] = selectedLine.split('|');
            if (lineA !== name && lineB !== name) {
              selectedLine = null;
              hideTooltip();
            }
          }
          pinNodeTooltip(e, props);
        }
        renderConnections();
      }
    });

    // Click on map background to clear all selections
    map.events.add('click', (e) => {
      if (e.originalEvent && (e.originalEvent._nodeHandled || e.originalEvent._lineHandled)) return;
      if (selectedNode !== null || selectedLine !== null) {
        selectedNode = null;
        selectedLine = null;
        hideTooltip();
        hideNodeTooltip();
        renderConnections();
      }
    });

    // Reposition pinned tooltips as the map moves
    map.events.add('move', () => {
      if (selectedLine !== null && pinnedTooltipGeo && tooltip.style.display !== 'none') {
        placeTooltipAtGeo(pinnedTooltipGeo);
      }
      if (selectedNode !== null && pinnedNodeTooltipGeo && tooltipNode.style.display !== 'none') {
        placeNodeTooltipAtGeo(pinnedNodeTooltipGeo);
      }
    });

    initialized = true;
    renderConnections();
  });

  map.events.add('error', (err) => {
    console.error('Azure Maps error:', err);
    document.getElementById('loading').style.display = 'none';
  });

  map.events.add('stylechange', () => {
    if (initialized) renderConnections();
  });
}

// ─────────────────────────────────────────────
//  Tooltip
// ─────────────────────────────────────────────

const tooltip = document.getElementById('tooltip');
const tooltipNode = document.getElementById('tooltip-node');
const ttClose = document.getElementById('tt-close');
const ttNodeClose = document.getElementById('tt-node-close');

ttClose.addEventListener('click', () => {
  selectedLine = null;
  hideTooltip();
  renderConnections();
});

ttNodeClose.addEventListener('click', () => {
  selectedNode = null;
  hideNodeTooltip();
  renderConnections();
});

function bringToFront(el) {
  tooltip.style.zIndex     = el === tooltip     ? '11' : '10';
  tooltipNode.style.zIndex = el === tooltipNode ? '11' : '10';
}

function showTooltip(e, props, pinned = false) {
  document.getElementById('tt-title').textContent = `${props.source} \u2194 ${props.target}`;
  document.getElementById('tt-latency').textContent = '';
  document.getElementById('tt-latency-rev').textContent = '';
  document.getElementById('tt-sub').textContent = '';

  const details = document.getElementById('tt-details');
  details.innerHTML = '';
  const rows = [];
  if (props.latency !== undefined)
    rows.push([`${props.source} \u2192 ${props.target}`, `${props.latency} ms`, props.latency]);
  if (props.latencyReverse !== undefined)
    rows.push([`${props.target} \u2192 ${props.source}`, `${props.latencyReverse} ms`, props.latencyReverse]);
  rows.forEach(([k, v, ms]) => {
    const dk = document.createElement('span');
    dk.className = 'tt-dk';
    dk.textContent = k;
    const dv = document.createElement('span');
    dv.className = 'tt-dv tt-dv-latency';
    dv.textContent = v;
    dv.style.color = latencyColor(ms);
    details.appendChild(dk);
    details.appendChild(dv);
  });

  // Place at mouse cursor first, then record the offset from the geographic midpoint
  tooltip.style.display = 'block';
  ttClose.style.display = pinned ? 'block' : 'none';
  bringToFront(tooltip);
  positionTooltip(e);

  const srcReg = regionMap[props.source];
  const tgtReg = regionMap[props.target];
  if (srcReg && tgtReg) {
    pinnedTooltipGeo = [
      (parseFloat(srcReg.Longitude) + parseFloat(tgtReg.Longitude)) / 2,
      (parseFloat(srcReg.Latitude)  + parseFloat(tgtReg.Latitude))  / 2,
    ];
    const pixels = map.positionsToPixels([pinnedTooltipGeo]);
    if (pixels && pixels[0]) {
      pinnedTooltipOffset = [
        parseFloat(tooltip.style.left)  - pixels[0][0],
        parseFloat(tooltip.style.top)   - pixels[0][1],
      ];
    } else {
      pinnedTooltipOffset = null;
    }
  } else {
    pinnedTooltipGeo = null;
    pinnedTooltipOffset = null;
  }
}

function showPointTooltip(e, props) {
  document.getElementById('tt-node-title').textContent = props.name;
  const loc = [props.physicalLocation, props.geography, props.geoGroup].filter(Boolean).join(' \\ ');
  document.getElementById('tt-node-sub').textContent = loc;
  const details = document.getElementById('tt-node-details');
  details.innerHTML = '';
  const rows = [
    ['Location', `${props.latitude?.toFixed(4) ?? ''}, ${props.longitude?.toFixed(4) ?? ''}`],
    ['Paired Region', props.pairedRegion || '—'],
    ['Availability Zones', props.azCount || '—'],
    ['Special Access', props.specialAccess === 'TRUE' ? 'Yes' : 'No'],
  ];
  rows.forEach(([k, v]) => {
    const dk = document.createElement('span');
    dk.className = 'tt-dk';
    dk.textContent = k;
    const dv = document.createElement('span');
    dv.className = 'tt-dv';
    dv.textContent = v;
    details.appendChild(dk);
    details.appendChild(dv);
  });
  positionNodeTooltip(e);
  tooltipNode.style.display = 'block';
  ttNodeClose.style.display = 'none';
  bringToFront(tooltipNode);
}

// Show node info in the path tooltip element (#tooltip) — used for hover when a node is already pinned
function showNodeDataInPathTooltip(e, props) {
  document.getElementById('tt-title').textContent = props.name;
  document.getElementById('tt-latency').textContent = '';
  document.getElementById('tt-latency-rev').textContent = '';
  const loc = [props.physicalLocation, props.geography, props.geoGroup].filter(Boolean).join(' \\ ');
  document.getElementById('tt-sub').textContent = loc;
  const details = document.getElementById('tt-details');
  details.innerHTML = '';
  const rows = [
    ['Location', `${props.latitude?.toFixed(4) ?? ''}, ${props.longitude?.toFixed(4) ?? ''}`],
    ['Paired Region', props.pairedRegion || '—'],
    ['Availability Zones', props.azCount || '—'],
    ['Special Access', props.specialAccess === 'TRUE' ? 'Yes' : 'No'],
  ];
  rows.forEach(([k, v]) => {
    const dk = document.createElement('span'); dk.className = 'tt-dk'; dk.textContent = k;
    const dv = document.createElement('span'); dv.className = 'tt-dv'; dv.textContent = v;
    details.appendChild(dk); details.appendChild(dv);
  });
  positionTooltip(e);
  tooltip.style.display = 'block';
  ttClose.style.display = 'none';
  bringToFront(tooltip);
}

function pinNodeTooltip(e, props) {
  document.getElementById('tt-node-title').textContent = props.name;
  const loc = [props.physicalLocation, props.geography, props.geoGroup].filter(Boolean).join(' \\ ');
  document.getElementById('tt-node-sub').textContent = loc;
  const details = document.getElementById('tt-node-details');
  details.innerHTML = '';
  const rows = [
    ['Location', `${props.latitude?.toFixed(4) ?? ''}, ${props.longitude?.toFixed(4) ?? ''}`],
    ['Paired Region', props.pairedRegion || '—'],
    ['Availability Zones', props.azCount || '—'],
    ['Special Access', props.specialAccess === 'TRUE' ? 'Yes' : 'No'],
  ];
  rows.forEach(([k, v]) => {
    const dk = document.createElement('span');
    dk.className = 'tt-dk';
    dk.textContent = k;
    const dv = document.createElement('span');
    dv.className = 'tt-dv';
    dv.textContent = v;
    details.appendChild(dk);
    details.appendChild(dv);
  });
  positionNodeTooltip(e);
  tooltipNode.style.display = 'block';
  ttNodeClose.style.display = 'block';
  bringToFront(tooltipNode);
  // Store geo anchor so tooltip tracks map panning
  pinnedNodeTooltipGeo = [props.longitude, props.latitude];
  const pixels = map.positionsToPixels([pinnedNodeTooltipGeo]);
  if (pixels && pixels[0]) {
    pinnedNodeTooltipOffset = [
      parseFloat(tooltipNode.style.left) - pixels[0][0],
      parseFloat(tooltipNode.style.top)  - pixels[0][1],
    ];
  } else {
    pinnedNodeTooltipOffset = null;
  }
}

function hideNodeTooltip() {
  tooltipNode.style.display = 'none';
  ttNodeClose.style.display = 'none';
  pinnedNodeTooltipGeo = null;
  pinnedNodeTooltipOffset = null;
  document.getElementById('tt-node-details').innerHTML = '';
}

function positionNodeTooltip(e) {
  const mapContainer = document.getElementById('map-container');
  const rect = mapContainer.getBoundingClientRect();
  let x = e.originalEvent.clientX - rect.left + 14;
  let y = e.originalEvent.clientY - rect.top - 10;
  const tw = tooltipNode.offsetWidth || 200;
  const th = tooltipNode.offsetHeight || 80;
  if (x + tw > mapContainer.offsetWidth - 10) x = x - tw - 28;
  if (y + th > mapContainer.offsetHeight - 10) y = mapContainer.offsetHeight - th - 10;
  tooltipNode.style.left = x + 'px';
  tooltipNode.style.top  = y + 'px';
}

function placeNodeTooltipAtGeo(lonLat) {
  if (!pinnedNodeTooltipOffset) return;
  const pixels = map.positionsToPixels([lonLat]);
  if (!pixels || !pixels[0]) return;
  tooltipNode.style.left = (pixels[0][0] + pinnedNodeTooltipOffset[0]) + 'px';
  tooltipNode.style.top  = (pixels[0][1] + pinnedNodeTooltipOffset[1]) + 'px';
}

function positionTooltip(e) {
  const mapContainer = document.getElementById('map-container');
  const rect = mapContainer.getBoundingClientRect();
  let x = e.originalEvent.clientX - rect.left + 14;
  let y = e.originalEvent.clientY - rect.top - 10;

  const tw = tooltip.offsetWidth || 200;
  const th = tooltip.offsetHeight || 80;
  if (x + tw > mapContainer.offsetWidth - 10) x = x - tw - 28;
  if (y + th > mapContainer.offsetHeight - 10) y = mapContainer.offsetHeight - th - 10;

  tooltip.style.left = x + 'px';
  tooltip.style.top  = y + 'px';
}

function placeTooltipAtGeo(lonLat) {
  if (!pinnedTooltipOffset) return;
  const pixels = map.positionsToPixels([lonLat]);
  if (!pixels || !pixels[0]) return;
  tooltip.style.left = (pixels[0][0] + pinnedTooltipOffset[0]) + 'px';
  tooltip.style.top  = (pixels[0][1] + pinnedTooltipOffset[1]) + 'px';
}

function hideTooltip() {
  tooltip.style.display = 'none';
  ttClose.style.display = 'none';
  pinnedTooltipGeo = null;
  pinnedTooltipOffset = null;
  document.getElementById('tt-latency-rev').textContent = '';
  document.getElementById('tt-details').innerHTML = '';
}

// ─────────────────────────────────────────────
//  Table modal
// ─────────────────────────────────────────────

function openTableModal() {
  const rows = selectedNode
    ? currentFiltered.filter(c => c.source === selectedNode || c.target === selectedNode)
    : currentFiltered;
  const title = selectedNode
    ? `Connections for ${selectedNode}`
    : `All Connections (${rows.length.toLocaleString()})`;
  document.getElementById('table-modal-title').textContent = title;

  // Collect unique sorted sources and destinations
  const sources = [...new Set(rows.map(c => c.source))].sort();
  const dests   = [...new Set(rows.map(c => c.target))].sort();

  // Build lookup: source → dest → latency
  const lookup = {};
  rows.forEach(c => {
    if (!lookup[c.source]) lookup[c.source] = {};
    lookup[c.source][c.target] = c.latency;
  });

  // Build header row
  const thead = document.getElementById('data-table-head');
  thead.innerHTML = '';
  const hr = document.createElement('tr');
  const th0 = document.createElement('th');
  th0.textContent = 'Source';
  th0.className = 'col-source';
  hr.appendChild(th0);
  dests.forEach(d => {
    const th = document.createElement('th');
    th.textContent = d;
    th.className = 'col-dest';
    hr.appendChild(th);
  });
  thead.appendChild(hr);

  // Build body rows
  const tbody = document.getElementById('data-table-body');
  tbody.innerHTML = '';
  sources.forEach(src => {
    const tr = document.createElement('tr');
    const td0 = document.createElement('td');
    td0.textContent = src;
    td0.className = 'src-cell';
    tr.appendChild(td0);
    dests.forEach(dst => {
      const td = document.createElement('td');
      const lat = lookup[src] && lookup[src][dst];
      if (lat !== undefined) {
        td.textContent = lat;
        td.style.color = latencyColor(lat);
        td.className = 'lat-cell';
      } else {
        td.textContent = '–';
        td.className = 'lat-cell empty-cell';
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  document.getElementById('table-modal').style.display = 'flex';
}

document.getElementById('btn-table').addEventListener('click', openTableModal);

document.getElementById('btn-table-close').addEventListener('click', () => {
  document.getElementById('table-modal').style.display = 'none';
});

document.getElementById('table-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('table-modal')) {
    document.getElementById('table-modal').style.display = 'none';
  }
});

// ─────────────────────────────────────────────
//  Filter button handlers
// ─────────────────────────────────────────────

document.getElementById('btn-apply').addEventListener('click', () => {
  if (initialized) renderConnections();
});

document.getElementById('btn-reset').addEventListener('click', () => {
  document.getElementById('lat-min').value = '';
  document.getElementById('lat-max').value = '';
  resetTree('src-tree');
  resetTree('dst-tree');
  if (initialized) renderConnections();
});

// ─────────────────────────────────────────────
//  Boot
// ─────────────────────────────────────────────

async function init() {
  const [regionsCsv, latencyCsv] = await Promise.all([
    fetch('../Data/regions.csv').then(r => r.text()),
    fetch('../Data/latency.csv').then(r => r.text()),
  ]);

  // Parse regions
  regionRows = parseCSV(regionsCsv);
  regionRows.forEach(r => { regionMap[r.DisplayName] = r; });

  // Parse latency
  const latencyLines = latencyCsv.trim().split('\n');
  const latencyHeaders = latencyLines[0].split(',').slice(1).map(h => h.trim());
  latencyLines.slice(1).forEach(line => {
    const vals = line.split(',');
    const source = vals[0].trim();
    latencyHeaders.forEach((target, i) => {
      const raw = (vals[i + 1] || '').trim();
      if (raw === '' || source === target) return;
      const ms = parseInt(raw, 10);
      if (isNaN(ms)) return;
      if (!latencyLookup[source]) latencyLookup[source] = {};
      latencyLookup[source][target] = ms;
      connections.push({ source, target, latency: ms });
    });
  });

  buildTreePicker('src-tree');
  buildTreePicker('dst-tree');
  initMap(sessionStorage.getItem('azureMapsKey'));
}

function showApiKeyPrompt() {
  const modal = document.getElementById('api-key-modal');
  modal.style.display = 'flex';
  document.getElementById('api-key-input').focus();

  document.getElementById('api-key-submit').addEventListener('click', submitKey);
  document.getElementById('api-key-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitKey();
  });

  function submitKey() {
    const key = document.getElementById('api-key-input').value.trim();
    if (!key) {
      document.getElementById('api-key-error').style.display = 'block';
      return;
    }
    sessionStorage.setItem('azureMapsKey', key);
    modal.style.display = 'none';
    init();
  }
}

const storedKey = sessionStorage.getItem('azureMapsKey');
if (storedKey) {
  init().catch(err => {
    console.error('Failed to load data:', err);
    document.getElementById('loading').innerHTML =
      '<p style="color:#ef5350;padding:20px">Failed to load data files. Open via a local web server (e.g. VS Code Live Server).</p>';
  });
} else {
  document.getElementById('loading').style.display = 'none';
  showApiKeyPrompt();
}

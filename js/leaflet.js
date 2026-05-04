// Data — populated by init()
let regionRows = [];
const regionMap = {};
const latencyLookup = {};
const connections = [];

// ─────────────────────────────────────────────
//  Map state
// ─────────────────────────────────────────────

let map = null;
let lineLayerGroup = null;
let nodeLayerGroup = null;
let initialized = false;
let selectedNode = null;
let selectedLine = null; // 'source|target' sorted key
let currentFiltered = [];
let pinnedTooltipGeo = null;    // [lat, lon] anchor for the pinned line tooltip
let pinnedTooltipOffset = null; // [dx, dy] offset from midpoint pixels to tooltip position
let pinnedNodeTooltipGeo = null;    // [lat, lon] anchor for the pinned node tooltip
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
    ggToggle.className = 'tree-toggle'; ggToggle.textContent = '▶';

    const ggLabel = document.createElement('span');
    ggLabel.className = 'tree-node-label'; ggLabel.textContent = gg;

    ggRow.appendChild(ggCb);
    ggRow.appendChild(ggToggle);
    ggRow.appendChild(ggLabel);
    ggLi.appendChild(ggRow);

    const geoUl = document.createElement('ul');
    geoUl.className = 'tree-children tree-collapsed';

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

function setDescendants(nodeLi, checked) {
  nodeLi.querySelectorAll('.tree-cb').forEach(cb => {
    cb.checked = checked;
    cb.indeterminate = false;
  });
}

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

function getTreeSelectedRegions(containerId) {
  const allCbs = [...document.querySelectorAll(`#${containerId} .tree-region-cb`)];
  const checkedCbs = allCbs.filter(cb => cb.checked);
  if (checkedCbs.length === allCbs.length) return null; // null = all
  return new Set(checkedCbs.map(cb => cb.value));
}

function resetTree(containerId) {
  document.querySelectorAll(`#${containerId} .tree-cb`).forEach(cb => {
    cb.checked = false; cb.indeterminate = false;
  });
}

// ─────────────────────────────────────────────
//  Map rendering
// ─────────────────────────────────────────────

// Build a quadratic-Bézier approximation between two lon/lat points.
function curvedLine(lon1, lat1, lon2, lat2, steps = 48, curvature = 0.15) {
  const mx = (lon1 + lon2) / 2;
  const my = (lat1 + lat2) / 2;
  const dx = lon2 - lon1;
  const dy = lat2 - lat1;
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

function renderConnections(options = {}) {
  if (!lineLayerGroup) return;

  lineLayerGroup.clearLayers();
  nodeLayerGroup.clearLayers();

  const srcSet = getTreeSelectedRegions('src-tree');
  const dstSet = getTreeSelectedRegions('dst-tree');

  if ((srcSet !== null && srcSet.size === 0) || (dstSet !== null && dstSet.size === 0)) {
    document.getElementById('stat-lines').textContent = '0';
    document.getElementById('stat-regions').textContent = '0';
    currentFiltered = [];
    return;
  }

  const latMin = parseFloat(document.getElementById('lat-min').value) || null;
  const latMax = parseFloat(document.getElementById('lat-max').value) || null;

  const filtered = connections.filter(c => {
    const inSrc = r => !srcSet || srcSet.has(r);
    const inDst = r => !dstSet || dstSet.has(r);
    if (!((inSrc(c.source) && inDst(c.target)) || (inSrc(c.target) && inDst(c.source)))) return false;
    if (latMin !== null && c.latency < latMin) return false;
    if (latMax !== null && c.latency > latMax) return false;
    return true;
  });

  const activeRegionNames = new Set();
  filtered.forEach(c => { activeRegionNames.add(c.source); activeRegionNames.add(c.target); });

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
    const isSelectedLine = selectedLine !== null && pairKey === selectedLine;
    const dimmed = selectedLine !== null ? !isSelectedLine
                 : selectedNode !== null ? !connectedToNode
                 : false;

    const fwdLatency = latencyLookup[c.source]?.[c.target];
    const revLatency = latencyLookup[c.target]?.[c.source];
    const repLatency = (fwdLatency !== undefined && revLatency !== undefined)
      ? Math.round((fwdLatency + revLatency) / 2)
      : (fwdLatency ?? revLatency ?? c.latency);

    // curvedLine returns [[lon, lat], ...] — Leaflet needs [[lat, lon], ...]
    const coords = curvedLine(srcLon, srcLat, tgtLon, tgtLat);
    const latLngCoords = coords.map(([lon, lat]) => [lat, lon]);

    const lineProps = {
      source: c.source,
      target: c.target,
      latency: fwdLatency,
      latencyReverse: revLatency,
      pairKey,
    };

    const poly = L.polyline(latLngCoords, {
      color: dimmed ? '#333333' : latencyColor(repLatency),
      weight: latencyWidth(repLatency),
      opacity: dimmed ? 0.2 : 0.65,
      interactive: !dimmed,
    });

    if (!dimmed) {
      poly.on('mouseover', (e) => {
        if (selectedLine) return; // pinned, don't overwrite
        if (selectedNode === null) hideNodeTooltip();
        showTooltip(e, lineProps, false);
        map.getContainer().style.cursor = 'pointer';
      });

      poly.on('mouseout', () => {
        if (!selectedLine) hideTooltip();
        map.getContainer().style.cursor = '';
      });

      poly.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (lineProps.pairKey === selectedLine) {
          selectedLine = null;
          hideTooltip();
        } else {
          selectedLine = lineProps.pairKey;
          if (selectedNode !== null && lineProps.source !== selectedNode && lineProps.target !== selectedNode) {
            selectedNode = null;
            hideNodeTooltip();
          }
          showTooltip(e, lineProps, true);
        }
        renderConnections();
      });
    }

    lineLayerGroup.addLayer(poly);
  });

  // Add node markers for active regions
  regionRows.forEach(r => {
    if (!activeRegionNames.has(r.DisplayName)) return;
    const lat = parseFloat(r.Latitude);
    const lon = parseFloat(r.Longitude);
    if (isNaN(lat) || isNaN(lon)) return;

    const azCount = r.AvailabilityZoneCount || 0;
    const fillColor = azCount > 1 ? '#1955EC' : '#707687';

    const nodeProps = {
      name: r.DisplayName,
      geography: r.Geography,
      geoGroup: r.GeographyGroup,
      physicalLocation: r.PhysicalLocation,
      pairedRegion: r.PairedRegion,
      azCount: r.AvailabilityZoneCount,
      restrictedAccess: r.RestrictedAccess,
      longitude: lon,
      latitude: lat,
    };

    const marker = L.circleMarker([lat, lon], {
      radius: 5,
      fillColor,
      color: r.RestrictedAccess ? '#ff0000' : '#ffffff',
      weight: 1.5,
      dashArray: r.RestrictedAccess ? '1,3' : null,
      dashOffset: null,
      lineCap: r.RestrictedAccess ? 'square' : 'round',
      lineJoin: r.RestrictedAccess ? 'miter' : 'round',
      fillOpacity: 0.9,
      opacity: 1,
      interactive: true,
    });

    marker.on('mouseover', (e) => {
      map.getContainer().style.cursor = 'pointer';
      if (selectedLine === null) hideTooltip();
      if (selectedNode === null) {
        showPointTooltip(e, nodeProps);
      } else if (nodeProps.name !== selectedNode && selectedLine === null) {
        showNodeDataInPathTooltip(e, nodeProps);
      }
    });

    marker.on('mouseout', () => {
      map.getContainer().style.cursor = '';
      if (selectedNode === null) {
        hideNodeTooltip();
      } else if (selectedLine === null) {
        hideTooltip();
      }
    });

    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      const name = nodeProps.name;
      if (selectedNode === name) {
        selectedNode = null;
        hideNodeTooltip();
      } else {
        selectedNode = name;
        if (selectedLine !== null) {
          const [lineA, lineB] = selectedLine.split('|');
          if (lineA !== name && lineB !== name) {
            selectedLine = null;
            hideTooltip();
          }
        }
        pinNodeTooltip(e, nodeProps);
      }
      renderConnections();
    });

    nodeLayerGroup.addLayer(marker);
  });

  document.getElementById('stat-lines').textContent = drawnPairs.size.toLocaleString();
  document.getElementById('stat-regions').textContent = activeRegionNames.size;
  currentFiltered = filtered.slice();

  if (options.fitBounds && activeRegionNames.size > 0) {
    const points = [];
    activeRegionNames.forEach(name => {
      const r = regionMap[name];
      if (!r) return;
      const lat = parseFloat(r.Latitude);
      const lon = parseFloat(r.Longitude);
      if (!isNaN(lat) && !isNaN(lon)) points.push([lat, lon]);
    });
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 6 });
    }
  }
}

// ─────────────────────────────────────────────
//  Initialize map
// ─────────────────────────────────────────────

function initMap() {
  const tileLayers = {
    dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }),
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }),
    voyager: L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }),
    positron: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }),
  };

  map = L.map('map', {
    center: [20, 20],
    zoom: 2,
    layers: [tileLayers.dark],
  });

  // Move attribution to bottom-left so it doesn't overlap the legend
  map.attributionControl.setPosition('bottomleft');

  lineLayerGroup = L.layerGroup().addTo(map);
  nodeLayerGroup = L.layerGroup().addTo(map);

  // Built-in basemap selector
  L.control.layers({
    'Dark Matter': tileLayers.dark,
    'OpenStreetMap': tileLayers.osm,
    'Voyager': tileLayers.voyager,
    'Positron (Light)': tileLayers.positron,
  }, null, { position: 'topright' }).addTo(map);

  // Background click to clear all selections
  map.on('click', () => {
    if (selectedNode !== null || selectedLine !== null) {
      selectedNode = null;
      selectedLine = null;
      hideTooltip();
      hideNodeTooltip();
      renderConnections();
    }
  });

  // Reposition pinned tooltips as the map moves
  map.on('move', () => {
    if (selectedLine !== null && pinnedTooltipGeo && tooltip.style.display !== 'none') {
      placeTooltipAtGeo(pinnedTooltipGeo);
    }
    if (selectedNode !== null && pinnedNodeTooltipGeo && tooltipNode.style.display !== 'none') {
      placeNodeTooltipAtGeo(pinnedNodeTooltipGeo);
    }
  });

  document.getElementById('loading').style.display = 'none';
  initialized = true;
  renderConnections();
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

function makeDraggable(el, getGeo, setOffset) {
  let dragging = false;
  let didDrag  = false;
  let startMouseX, startMouseY, startLeft, startTop;

  el.addEventListener('mousedown', (e) => {
    if (!el.classList.contains('tt-pinned')) return;
    e.stopPropagation(); // always prevent map drag when tooltip is pinned
    if (e.target.classList.contains('tt-close')) return;
    dragging = true;
    didDrag  = false;
    startMouseX = e.clientX;
    startMouseY = e.clientY;
    startLeft = parseFloat(el.style.left) || 0;
    startTop  = parseFloat(el.style.top)  || 0;
    map.dragging.disable();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startMouseX;
    const dy = e.clientY - startMouseY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didDrag = true;
    el.style.left = (startLeft + dx) + 'px';
    el.style.top  = (startTop  + dy) + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    map.dragging.enable();
    if (didDrag) {
      const geo = getGeo();
      if (geo) {
        const pt = map.latLngToContainerPoint(geo);
        if (pt) setOffset([parseFloat(el.style.left) - pt.x, parseFloat(el.style.top) - pt.y]);
      }
    }
  });

  el.addEventListener('click', (e) => {
    if (didDrag) { e.stopPropagation(); didDrag = false; }
  });
}

makeDraggable(tooltip,     () => pinnedTooltipGeo,     (o) => { pinnedTooltipOffset = o; });
makeDraggable(tooltipNode, () => pinnedNodeTooltipGeo, (o) => { pinnedNodeTooltipOffset = o; });

function bringToFront(el) {
  tooltip.style.zIndex     = el === tooltip     ? '1101' : '1100';
  tooltipNode.style.zIndex = el === tooltipNode ? '1101' : '1100';
}

function _buildNodeDetailRows(detailsEl, props) {
  detailsEl.innerHTML = '';
  const rows = [
    ['Location', `${props.latitude?.toFixed(4) ?? ''}, ${props.longitude?.toFixed(4) ?? ''}`],
    ['Paired Region', props.pairedRegion || '—'],
    ['Availability Zones', props.azCount || '—'],
    ['Restricted Access', props.restrictedAccess === true ? 'Yes' : 'No'],
  ];
  rows.forEach(([k, v]) => {
    const dk = document.createElement('span'); dk.className = 'tt-dk'; dk.textContent = k;
    const dv = document.createElement('span'); dv.className = 'tt-dv'; dv.textContent = v;
    detailsEl.appendChild(dk);
    detailsEl.appendChild(dv);
  });
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

  tooltip.style.display = 'block';
  ttClose.style.display = pinned ? 'block' : 'none';
  tooltip.classList.toggle('tt-pinned', pinned);
  bringToFront(tooltip);
  positionTooltip(e);

  // Store geographic midpoint and offset for pan tracking
  const srcReg = regionMap[props.source];
  const tgtReg = regionMap[props.target];
  if (srcReg && tgtReg) {
    pinnedTooltipGeo = [
      (parseFloat(srcReg.Latitude)  + parseFloat(tgtReg.Latitude))  / 2,
      (parseFloat(srcReg.Longitude) + parseFloat(tgtReg.Longitude)) / 2,
    ];
    const pt = map.latLngToContainerPoint(pinnedTooltipGeo);
    if (pt) {
      pinnedTooltipOffset = [
        parseFloat(tooltip.style.left) - pt.x,
        parseFloat(tooltip.style.top)  - pt.y,
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
  _buildNodeDetailRows(document.getElementById('tt-node-details'), props);
  positionNodeTooltip(e);
  tooltipNode.style.display = 'block';
  ttNodeClose.style.display = 'none';
  bringToFront(tooltipNode);
}

function showNodeDataInPathTooltip(e, props) {
  document.getElementById('tt-title').textContent = props.name;
  document.getElementById('tt-latency').textContent = '';
  document.getElementById('tt-latency-rev').textContent = '';
  const loc = [props.physicalLocation, props.geography, props.geoGroup].filter(Boolean).join(' \\ ');
  document.getElementById('tt-sub').textContent = loc;
  _buildNodeDetailRows(document.getElementById('tt-details'), props);
  positionTooltip(e);
  tooltip.style.display = 'block';
  ttClose.style.display = 'none';
  bringToFront(tooltip);
}

function pinNodeTooltip(e, props) {
  document.getElementById('tt-node-title').textContent = props.name;
  const loc = [props.physicalLocation, props.geography, props.geoGroup].filter(Boolean).join(' \\ ');
  document.getElementById('tt-node-sub').textContent = loc;
  _buildNodeDetailRows(document.getElementById('tt-node-details'), props);
  positionNodeTooltip(e);
  tooltipNode.style.display = 'block';
  ttNodeClose.style.display = 'block';
  tooltipNode.classList.add('tt-pinned');
  bringToFront(tooltipNode);
  // Store geo anchor so tooltip tracks map panning
  pinnedNodeTooltipGeo = [props.latitude, props.longitude];
  const pt = map.latLngToContainerPoint(pinnedNodeTooltipGeo);
  if (pt) {
    pinnedNodeTooltipOffset = [
      parseFloat(tooltipNode.style.left) - pt.x,
      parseFloat(tooltipNode.style.top)  - pt.y,
    ];
  } else {
    pinnedNodeTooltipOffset = null;
  }
}

function hideNodeTooltip() {
  tooltipNode.style.display = 'none';
  tooltipNode.classList.remove('tt-pinned');
  ttNodeClose.style.display = 'none';
  pinnedNodeTooltipGeo = null;
  pinnedNodeTooltipOffset = null;
  document.getElementById('tt-node-details').innerHTML = '';
}

function positionTooltip(e) {
  const mapContainer = document.getElementById('map-container');
  let x = e.containerPoint.x + 14;
  let y = e.containerPoint.y - 10;
  const tw = tooltip.offsetWidth || 200;
  const th = tooltip.offsetHeight || 80;
  if (x + tw > mapContainer.offsetWidth - 10) x = x - tw - 28;
  if (y + th > mapContainer.offsetHeight - 10) y = mapContainer.offsetHeight - th - 10;
  tooltip.style.left = x + 'px';
  tooltip.style.top  = y + 'px';
}

function positionNodeTooltip(e) {
  const mapContainer = document.getElementById('map-container');
  let x = e.containerPoint.x + 14;
  let y = e.containerPoint.y - 10;
  const tw = tooltipNode.offsetWidth || 200;
  const th = tooltipNode.offsetHeight || 80;
  if (x + tw > mapContainer.offsetWidth - 10) x = x - tw - 28;
  if (y + th > mapContainer.offsetHeight - 10) y = mapContainer.offsetHeight - th - 10;
  tooltipNode.style.left = x + 'px';
  tooltipNode.style.top  = y + 'px';
}

function placeTooltipAtGeo(latLon) {
  if (!pinnedTooltipOffset) return;
  const pt = map.latLngToContainerPoint(latLon);
  if (!pt) return;
  tooltip.style.left = (pt.x + pinnedTooltipOffset[0]) + 'px';
  tooltip.style.top  = (pt.y + pinnedTooltipOffset[1]) + 'px';
}

function placeNodeTooltipAtGeo(latLon) {
  if (!pinnedNodeTooltipOffset) return;
  const pt = map.latLngToContainerPoint(latLon);
  if (!pt) return;
  tooltipNode.style.left = (pt.x + pinnedNodeTooltipOffset[0]) + 'px';
  tooltipNode.style.top  = (pt.y + pinnedNodeTooltipOffset[1]) + 'px';
}

function hideTooltip() {
  tooltip.style.display = 'none';
  tooltip.classList.remove('tt-pinned');
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

  const empty = rows.length === 0;
  document.getElementById('table-empty-msg').style.display = empty ? 'block' : 'none';
  document.getElementById('data-table').style.display      = empty ? 'none'  : '';

  const sources = [...new Set(rows.map(c => c.source))].sort();
  const dests   = [...new Set(rows.map(c => c.target))].sort();

  const lookup = {};
  rows.forEach(c => {
    if (!lookup[c.source]) lookup[c.source] = {};
    lookup[c.source][c.target] = c.latency;
  });

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
  document.getElementById('btn-copy-csv').style.display = empty ? 'none' : '';

  // Store current CSV data for the copy button
  if (!empty) {
    const csvLines = [['Source', ...dests].map(v => `"${v}"`).join(',')];
    sources.forEach(src => {
      const row = [src, ...dests.map(dst => {
        const lat = lookup[src] && lookup[src][dst];
        return lat !== undefined ? lat : '';
      })];
      csvLines.push(row.map((v, i) => i === 0 ? `"${v}"` : v).join(','));
    });
    document.getElementById('btn-copy-csv')._csvData = csvLines.join('\n');
  }
}

document.getElementById('btn-table').addEventListener('click', openTableModal);

document.getElementById('btn-copy-csv').addEventListener('click', () => {
  const btn = document.getElementById('btn-copy-csv');
  const csv = btn._csvData;
  if (!csv) return;
  navigator.clipboard.writeText(csv).then(() => {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy Data'; btn.classList.remove('copied'); }, 2000);
  });
});

// ─────────────────────────────────────────────
//  Info modal
// ─────────────────────────────────────────────

function formatDateTime(iso) {
  if (!iso) return 'Unknown';
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return iso; }
}

fetch('Data/lastUpdated.json')
  .then(r => r.ok ? r.json() : null)
  .then(data => {
    if (!data) return;
    const latencyMeta = document.getElementById('info-latency-meta');
    const regionsMeta = document.getElementById('info-regions-meta');
    if (latencyMeta) {
      const parts = [];
      if (data.LatencyDatasetDate) parts.push(`Dataset date: ${data.LatencyDatasetDate}`);
      if (data.LatencyRetrievedAt) parts.push(`Last retrieved: ${formatDateTime(data.LatencyRetrievedAt)}`);
      latencyMeta.textContent = parts.join('  ·  ');
    }
    if (regionsMeta && data.RegionsRetrievedAt) {
      regionsMeta.textContent = `Last retrieved: ${formatDateTime(data.RegionsRetrievedAt)}`;
    }
  })
  .catch(() => {});

fetch('Data/version.json')
  .then(r => r.ok ? r.json() : null)
  .then(data => {
    const el = document.getElementById('info-version-meta');
    if (!el) return;
    if (!data) { el.textContent = 'Unknown'; return; }
    const parts = [];
    if (data.version)     parts.push(`v${data.version}`);
    if (data.lastUpdated) parts.push(`Updated: ${formatDateTime(data.lastUpdated)}`);
    el.textContent = parts.join('  ·  ') || 'Unknown';
  })
  .catch(() => {
    const el = document.getElementById('info-version-meta');
    if (el) el.textContent = 'Unknown';
  });

document.getElementById('btn-info').addEventListener('click', () => {
  document.getElementById('info-modal').style.display = 'flex';
});

document.getElementById('btn-info-close').addEventListener('click', () => {
  document.getElementById('info-modal').style.display = 'none';
});

document.getElementById('info-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('info-modal')) {
    document.getElementById('info-modal').style.display = 'none';
  }
});

document.getElementById('btn-table-close').addEventListener('click', () => {
  document.getElementById('table-modal').style.display = 'none';
});

document.getElementById('table-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('table-modal')) {
    document.getElementById('table-modal').style.display = 'none';
  }
});

function copyTree(fromId, toId) {
  const fromCbs = [...document.querySelectorAll(`#${fromId} .tree-region-cb`)];
  const checkedValues = new Set(fromCbs.filter(cb => cb.checked).map(cb => cb.value));
  const toCbs = [...document.querySelectorAll(`#${toId} .tree-region-cb`)];
  toCbs.forEach(cb => {
    cb.checked = checkedValues.has(cb.value);
    cb.indeterminate = false;
    updateAncestors(cb);
  });
}

document.getElementById('btn-copy-src-to-dst').addEventListener('click', (e) => {
  e.preventDefault();
  copyTree('src-tree', 'dst-tree');
});

document.getElementById('btn-copy-dst-to-src').addEventListener('click', (e) => {
  e.preventDefault();
  copyTree('dst-tree', 'src-tree');
});

// ─────────────────────────────────────────────
//  Filter button handlers
// ─────────────────────────────────────────────

document.getElementById('btn-apply').addEventListener('click', () => {
  if (!initialized) return;

  const srcSet = getTreeSelectedRegions('src-tree');
  const dstSet = getTreeSelectedRegions('dst-tree');
  const autoMsgEl = document.getElementById('filter-auto-msg');

  let autoMsg = null;
  if (srcSet !== null && srcSet.size > 0 && dstSet !== null && dstSet.size === 0) {
    copyTree('src-tree', 'dst-tree');
    autoMsg = 'No destination selected — source selection was automatically applied to destination.';
  } else if (dstSet !== null && dstSet.size > 0 && srcSet !== null && srcSet.size === 0) {
    copyTree('dst-tree', 'src-tree');
    autoMsg = 'No source selected — destination selection was automatically applied to source.';
  }

  autoMsgEl.textContent = autoMsg || '';
  autoMsgEl.style.display = autoMsg ? '' : 'none';

  renderConnections({ fitBounds: true });
});

document.getElementById('btn-reset').addEventListener('click', () => {
  document.getElementById('lat-min').value = '';
  document.getElementById('lat-max').value = '';
  resetTree('src-tree');
  resetTree('dst-tree');
  const autoMsgEl = document.getElementById('filter-auto-msg');
  autoMsgEl.textContent = '';
  autoMsgEl.style.display = 'none';
  if (initialized) renderConnections();
});

// ─────────────────────────────────────────────
//  Boot
// ─────────────────────────────────────────────

async function init() {
  const [regionsJson, latencyCsv] = await Promise.all([
    fetch('Data/regions.json').then(r => r.json()),
    fetch('Data/latency.csv').then(r => r.text()),
  ]);

  // Parse latency CSV first so we know which display names are covered
  const latencyLines = latencyCsv.trim().split('\n');
  const latencyHeaders = latencyLines[0].split(',').slice(1).map(h => h.trim());
  const latencyNames = new Set(latencyHeaders);

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

  // Map JSON region objects to the internal shape used throughout the app,
  // excluding regions with no coordinates or no latency data
  regionRows = regionsJson
    .filter(r => {
      const lat = parseFloat(r.metadata?.latitude);
      const lon = parseFloat(r.metadata?.longitude);
      if (isNaN(lat) || isNaN(lon)) return false;
      if (!latencyNames.has(r.displayName)) return false;
      return true;
    })
    .map(r => ({
      DisplayName:           r.displayName,
      Geography:             r.metadata?.geography      || '',
      GeographyGroup:        r.metadata?.geographyGroup || '',
      Latitude:              r.metadata?.latitude       || '',
      Longitude:             r.metadata?.longitude      || '',
      PhysicalLocation:      r.metadata?.physicalLocation || '',
      PairedRegion:          (r.metadata?.pairedRegion ?? []).map(p => p.name).join(', '),
      AvailabilityZoneCount: (r.availabilityZoneMappings ?? []).length,
      RestrictedAccess:      r.RestrictedAccessRegion === true,
    }));

  regionRows.forEach(r => { regionMap[r.DisplayName] = r; });

  buildTreePicker('src-tree');
  buildTreePicker('dst-tree');
  initMap();
}

init().catch(err => {
  console.error('Failed to load data:', err);
  document.getElementById('loading').innerHTML =
    '<p style="color:#ef5350;padding:20px">Failed to load data files. Open via a local web server (e.g. VS Code Live Server).</p>';
});

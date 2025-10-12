import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './SimulationPage.css';
import { MdSearch, MdDelete, MdDeleteForever, MdWarning, MdInfo, MdCheckCircle, MdCancel, MdSettings, MdUndo, MdRedo, MdClear, MdImage } from 'react-icons/md';
import plantSpacingData from '../data/plant_spacing.json';

const API_URL = 'https://netzero-vigrow-api.duckdns.org/iter3/plants/filter';


// Map UI values -> API values
const normalizeSeason = (s) => {
  if (!s) return 'All season';
  if (s.startsWith('Summer')) return 'Summer';
  if (s.startsWith('Autumn')) return 'Autumn';
  if (s.startsWith('Winter')) return 'Winter';
  if (s.startsWith('Spring')) return 'Spring';
  return s; // 'All season'
};
const normalizeType = (t) => {
  if (!t || t === 'Plants' || t === 'All Categories') return undefined;
  if (t === 'Vegetables' || t === 'Vegetable') return 'Vegetable';
  if (t === 'Herbs' || t === 'Herb') return 'Herb';
  if (t === 'Flowers' || t === 'Flower') return 'Flower';
  return undefined;
};
const normalizeSpacing = (idx) => {
  if (idx === null || idx === undefined) return undefined;
  switch (idx) {
    case 0: return '20';
    case 1: return '40';
    case 2: return '60';
    case 3: return '80';
    default: return undefined;
  }
};
const normalizeHardiness = (h) => {
  if (!h || h === 'All Hardiness') return undefined;
  return h; // "Frost Hardy" | "Frost Tender" | "Half Hardy"
};
const normalizeSunshine = (s) => s || 'All';

// Plant spacing utilities
const getPlantSpacing = (plantName) => {
  const plant = plantSpacingData.find(p => p.plant_name === plantName);
  return plant ? plant.plant_spacing_cm : null;
};

// Calculate required cells for a plant (each cell is 20x20cm)
const getRequiredCells = (plantName) => {
  const spacing = getPlantSpacing(plantName);
  if (!spacing) return 1; // Default to 1 cell if no spacing requirement
  return Math.ceil(spacing / 20); // Convert cm to cells (20cm per cell)
};

// Check if there's enough space for a plant at a given position
const checkSpaceAvailability = (plantName, startIndex, cells, cols, rows, excludeIndices = []) => {
  const requiredCells = getRequiredCells(plantName);
  const startRow = Math.floor(startIndex / cols);
  const startCol = startIndex % cols;
  
  // For 1x1 plants (20cm), always return valid
  if (requiredCells === 1) {
    if (cells[startIndex] === null || excludeIndices.includes(startIndex)) {
      return { isValid: true, requiredIndices: [startIndex] };
    } else {
      return { isValid: false, reason: `Space occupied` };
    }
  }
  
  // For larger plants, try different directions: right-down, right-up, left-up, left-down
  const directions = [
    { name: 'right-down', rowOffset: 0, colOffset: 0 },
    { name: 'right-up', rowOffset: -(requiredCells - 1), colOffset: 0 },
    { name: 'left-up', rowOffset: -(requiredCells - 1), colOffset: -(requiredCells - 1) },
    { name: 'left-down', rowOffset: 0, colOffset: -(requiredCells - 1) }
  ];
  
  for (const direction of directions) {
    const baseRow = startRow + direction.rowOffset;
    const baseCol = startCol + direction.colOffset;
    
    // Check if the required area fits within the grid
    if (baseRow < 0 || baseCol < 0 || 
        baseRow + requiredCells > rows || 
        baseCol + requiredCells > cols) {
      continue; // Try next direction
    }
    
    // Check if all required cells are empty or excluded
    const requiredIndices = [];
    let hasOccupiedCell = false;
    
    for (let row = baseRow; row < baseRow + requiredCells; row++) {
      for (let col = baseCol; col < baseCol + requiredCells; col++) {
        const index = row * cols + col;
        requiredIndices.push(index);
        // Check if cell is occupied by other plants (not excluded)
        if (cells[index] !== null && !excludeIndices.includes(index)) {
          hasOccupiedCell = true;
          break;
        }
      }
      if (hasOccupiedCell) break;
    }
    
    if (!hasOccupiedCell) {
      return { isValid: true, requiredIndices };
    }
  }
  
  return { isValid: false, reason: `No suitable space found in any direction` };
};

export default function SimulationPage(){
  // ---------- Garden Setup Modal (3-step wizard) ----------
  const [bedWidth, setBedWidth]   = useState(null);   // cm
  const [bedLength, setBedLength] = useState(null);   // cm
  const [season, setSeason]       = useState(null);   // 'All season' | 'Summer' ...
  const [sunshine, setSunshine]   = useState(null);   // 'All' | 'Full sun' ...
  const [showSetup, setShowSetup] = useState(false);
  const [setupStep, setSetupStep] = useState(1);

  const DEFAULTS = useMemo(() => ({
    bedWidth: 60,
    bedLength: 60,
    season: 'All season',
    sunshine: 'All',
  }), []);

  // On first enter, if any of the setup fields are null, show the setup modal
  useEffect(() => {
    if (bedWidth === null || bedLength === null || season === null || sunshine === null) {
      setShowSetup(true);
    }
  }, [bedWidth, bedLength, season, sunshine]);

  // Close the setup modal; if any of the setup fields are null, set the default values
  const closeSetup = () => {
    if (bedWidth === null)  setBedWidth(DEFAULTS.bedWidth);
    if (bedLength === null) setBedLength(DEFAULTS.bedLength);
    if (season === null)    setSeason(DEFAULTS.season);
    if (sunshine === null)  setSunshine(DEFAULTS.sunshine);
    setShowSetup(false);
    // Load initial plants after setup is complete
    handleFilter();
  };

  // Next/Previous step
  const nextStep = () => setSetupStep((s) => Math.min(3, s + 1));
  const prevStep = () => setSetupStep((s) => Math.max(1, s - 1));

  // Utility: format cm display
  const cm = (v) => `${v} cm`;

  // Main page button: open the setup modal
  const openSetup = () => setShowSetup(true);


  // ---------- Left panel: filters & plant inventory ----------
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSpacing, setSelectedSpacing] = useState(null);
  const [selectedHardiness, setSelectedHardiness] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [plants, setPlants] = useState([]); // array of { name, ... }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFilter = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const body = {
        season: normalizeSeason(season ?? DEFAULTS.season),
        sunshine: normalizeSunshine(sunshine ?? DEFAULTS.sunshine),
      };
      const type = normalizeType(selectedCategory);
      const spacing = normalizeSpacing(selectedSpacing);
      const hardiness = normalizeHardiness(selectedHardiness);
      if (type) body.type = type;
      if (spacing) body.spacing = spacing;
      if (hardiness) body.hardiness = hardiness;

      console.log('Sending API request:', body); // Debug log

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log('API response:', data); // Debug log
      // Expecting an array with plant objects that include a 'plant_name' field
      setPlants(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('API Error:', e); // Debug log
      setError(`Failed to load plants. ${e.message}`);
      setPlants([]);
    } finally {
      setLoading(false);
    }
  }, [season, sunshine, selectedCategory, selectedSpacing, selectedHardiness, DEFAULTS]);

  // Load plants when component mounts and setup is complete
  useEffect(() => {
    if (bedWidth !== null && bedLength !== null && season !== null && sunshine !== null) {
      handleFilter();
    }
  }, [bedWidth, bedLength, season, sunshine, handleFilter]);

  // ---------- Right panel: garden bed grid & drag/drop ----------
  // Calculate grid dimensions based on bed size, but let CSS handle the actual sizing
  const cols = Math.max(1, Math.round((bedWidth ?? DEFAULTS.bedWidth) / 20));
  const rows = Math.max(1, Math.round((bedLength ?? DEFAULTS.bedLength) / 20));
  const size = cols * rows;

  const [cells, setCells] = useState([]); // array of plant instances or null
  const [hoveredIndices, setHoveredIndices] = useState([]); // indices being hovered for planting
  const [hoveredPlant, setHoveredPlant] = useState(null); // plant being hovered
  const [plantInstances, setPlantInstances] = useState(new Map()); // Map of plantId -> plant data
  const [alertMessage, setAlertMessage] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null); // Custom alert message
  
  // === Recommendations ===
  const [recs, setRecs] = useState([]);           // ['Basil','Carrot','Onion']
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState('');
  const RECOMMEND_API = 'https://netzero-vigrow-api.duckdns.org/iter3/plants/recommend';
  
  // History management for undo/redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isPerformingAction, setIsPerformingAction] = useState(false);

  // Reset grid when bed size changes
  useEffect(() => {
    setCells(Array(size).fill(null));
    setHoveredIndices([]);
    setHoveredPlant(null);
    setPlantInstances(new Map());
    // Reset history when bed size changes
    setHistory([]);
    setHistoryIndex(-1);
  }, [size]);

  // Initialize history with empty state
  useEffect(() => {
    if (history.length === 0) {
      const initialState = {
        cells: Array(size).fill(null),
        plantInstances: new Map(),
        timestamp: Date.now()
      };
      setHistory([initialState]);
      setHistoryIndex(0);
      console.log('History initialized with empty state');
    }
  }, [size, history.length]);

  // Debug log for history state changes
  useEffect(() => {
    console.log('History state changed - length:', history.length, 'index:', historyIndex);
  }, [history.length, historyIndex]);

  // Save state to history
  const saveToHistory = useCallback((newCells, newPlantInstances) => {
    if (isPerformingAction) return; // Don't save during undo/redo
    
    const newState = {
      cells: [...newCells],
      plantInstances: new Map(newPlantInstances),
      timestamp: Date.now()
    };
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      console.log('Saving to history, new length:', newHistory.length); // Debug log
      // Limit history to 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
        setHistoryIndex(prev => prev - 1); // Adjust index when removing oldest state
        return newHistory;
      }
      return newHistory;
    });
    
    setHistoryIndex(prev => {
      const newIndex = Math.min(prev + 1, 49);
      console.log('History index updated to:', newIndex); // Debug log
      return newIndex;
    });
  }, [historyIndex, isPerformingAction]);

  // Undo function
  const undo = () => {
    if (historyIndex > 0 && history.length > 0) {
      setIsPerformingAction(true);
      const prevState = history[historyIndex - 1];
      if (prevState && prevState.cells && prevState.plantInstances) {
        setCells(prevState.cells);
        setPlantInstances(prevState.plantInstances);
        setHistoryIndex(prev => prev - 1);
      }
      setTimeout(() => setIsPerformingAction(false), 100);
    }
  };

  // Redo function
  const redo = () => {
    if (historyIndex < history.length - 1 && history.length > 0) {
      setIsPerformingAction(true);
      const nextState = history[historyIndex + 1];
      if (nextState && nextState.cells && nextState.plantInstances) {
        setCells(nextState.cells);
        setPlantInstances(nextState.plantInstances);
        setHistoryIndex(prev => prev + 1);
      }
      setTimeout(() => setIsPerformingAction(false), 100);
    }
  };

  // Clear garden function
  const clearGarden = async () => {
    const confirmed = await showConfirm('Are you sure you want to clear all plants from the garden?');
    if (confirmed) {
      setCells(Array(size).fill(null));
      setPlantInstances(new Map());
      setHoveredIndices([]);
      setHoveredPlant(null);
      showAlert('Garden cleared successfully!');
    }
  };

  // Generate unique plant ID
  const generatePlantId = () => {
    return `plant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Custom alert function
  const showAlert = (message) => {
    setAlertMessage(message);
    setTimeout(() => {
      setAlertMessage(null);
    }, 2000);
  };

  // Custom confirm dialog function
  const showConfirm = (message, onConfirm, onCancel = null) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        message,
        onConfirm: () => {
          setConfirmDialog(null);
          if (onConfirm) onConfirm();
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          if (onCancel) onCancel();
          resolve(false);
        }
      });
    });
  };

  // 从当前花床中提取唯一的已种植物名数组
  const getPlantedNames = useCallback(() => {
    const names = new Set();
    plantInstances.forEach(p => { if (p?.name) names.add(p.name); });
    return Array.from(names);
  }, [plantInstances]);

  // 请求推荐（只要 plant_name 就行）
  const fetchRecommendations = useCallback(async () => {
    try {
      setRecLoading(true);
      setRecError('');
      const body = { plants: getPlantedNames() };
      const res = await fetch(RECOMMEND_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const top3 = Array.isArray(data?.candidates)
        ? data.candidates.slice(0, 3).map(c => c.plant_name)
        : [];
      setRecs(top3);
    } catch (e) {
      setRecError('Failed to load recommendations');
      setRecs([]);
    } finally {
      setRecLoading(false);
    }
  }, [getPlantedNames]);

  // 已种植物变化时自动刷新推荐（也可点卡片右上角刷新）
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Download garden layout as image
  const downloadGardenLayout = async (format = 'jpg') => {
    try {
      const gardenContainer = document.querySelector('.simulation-garden-container');
      if (!gardenContainer) {
        showAlert('Garden container not found');
        return;
      }

      // Use html2canvas to capture the garden
      const { default: html2canvas } = await import('html2canvas');
      
      const canvas = await html2canvas(gardenContainer, {
        backgroundColor: '#f5f5f5',
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        width: gardenContainer.offsetWidth,
        height: gardenContainer.offsetHeight
      });

      // Convert canvas to blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, format === 'pdf' ? 'image/png' : `image/${format}`, 0.9);
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `garden-layout-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showAlert(`Garden layout downloaded as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Download error:', error);
      showAlert('Failed to download garden layout. Please try again.');
    }
  };


  const dragInfoRef = useRef({});

  const onDragStartInventory = (e, plantName) => {
    dragInfoRef.current = { kind: 'inventory', plantName };
    e.dataTransfer.setData('text/plain', plantName);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const onDragStartCell = (e, index) => {
    const plantId = cells[index];
    if (!plantId) return; // nothing planted
    
    const plantInstance = plantInstances.get(plantId);
    if (!plantInstance) return;
    
    // Find all cells occupied by this plant instance
    const plantIndices = [];
    cells.forEach((cell, idx) => {
      if (cell === plantId) {
        plantIndices.push(idx);
      }
    });
    
    dragInfoRef.current = { 
      kind: 'cell', 
      from: index, 
      plantId: plantId,
      plantName: plantInstance.name,
      plantIndices: plantIndices,
      requiredCells: getRequiredCells(plantInstance.name)
    };
    e.dataTransfer.setData('text/plain', plantInstance.name);
    e.dataTransfer.effectAllowed = 'move';
  };

  const [overIndex, setOverIndex] = useState(null);

  const onCellDragOver = (e, index) => {
    e.preventDefault();              // 关键：保证 dragover 持续触发
    const info = dragInfoRef.current;
    if (!info) return;
    setOverIndex(index);
    const plantName = info.plantName;
    
    let spaceCheck;
    if (info.kind === 'inventory') {
      spaceCheck = checkSpaceAvailability(plantName, index, cells, cols, rows);
      e.dataTransfer.dropEffect = 'copy';
    } else { // moving from cell
      // For moving plants, exclude only the current plant's positions
      spaceCheck = checkSpaceAvailability(plantName, index, cells, cols, rows, info.plantIndices);
      e.dataTransfer.dropEffect = 'move';
    }
    
    if (spaceCheck.isValid) {
      setHoveredIndices(spaceCheck.requiredIndices);
      setHoveredPlant(plantName);
    } else {
      setHoveredIndices([]);
      setHoveredPlant(plantName);
    }
  };
  
  const onCellDragLeave = () => {
    // Do not depend on overIndex for cleanup; rely on dragend event
    };
    
     useEffect(() => {
       const handleDragEnd = () => {
         setOverIndex(null);
         setHoveredIndices([]);
         setHoveredPlant(null);
         setTrashHot(false);
       };
       window.addEventListener('dragend', handleDragEnd);
       return () => window.removeEventListener('dragend', handleDragEnd);
     }, []);

  const onCellDrop = (e, index) => {
    e.preventDefault();
    const info = dragInfoRef.current;
    const name = e.dataTransfer.getData('text/plain') || info.plantName;
    if (!name) return;

    // Check space availability for new plants from inventory
    if (info.kind === 'inventory') {
      const spaceCheck = checkSpaceAvailability(name, index, cells, cols, rows);
      if (!spaceCheck.isValid) {
        showAlert(`${name} needs ${getRequiredCells(name)}×${getRequiredCells(name)} cells (${getPlantSpacing(name) || 20}×${getPlantSpacing(name) || 20}cm) space`);
        setOverIndex(null);
        setHoveredIndices([]);
        setHoveredPlant(null);
        return;
      }
      
      // Create new plant instance
      const plantId = generatePlantId();
      const plantInstance = {
        id: plantId,
        name: name,
        spacing: getPlantSpacing(name),
        plantedAt: new Date().toISOString()
      };
      
      let newCells, newPlantInstances;
      
      setCells((prev) => {
        const next = [...prev];
        spaceCheck.requiredIndices.forEach(cellIndex => {
          next[cellIndex] = plantId;
        });
        newCells = next;
        return next;
      });
      
      setPlantInstances((prev) => {
        const next = new Map(prev);
        next.set(plantId, plantInstance);
        newPlantInstances = next;
        return next;
      });
      
      // Save to history after state updates
      setTimeout(() => {
        if (newCells && newPlantInstances) {
          saveToHistory(newCells, newPlantInstances);
        }
      }, 0);
    } else if (info.kind === 'cell') {
      // Moving existing plant (multiple cells)
      const spaceCheck = checkSpaceAvailability(name, index, cells, cols, rows, info.plantIndices);
      if (!spaceCheck.isValid) {
        showAlert(`${name} needs ${getRequiredCells(name)}×${getRequiredCells(name)} cells (${getPlantSpacing(name) || 20}×${getPlantSpacing(name) || 20}cm) space`);
        setOverIndex(null);
        setHoveredIndices([]);
        setHoveredPlant(null);
        return;
      }
      
      let newCells;
      
      setCells((prev) => {
        const next = [...prev];
        
        // Clear original plant cells
        info.plantIndices.forEach(originalIndex => {
          next[originalIndex] = null;
        });
        
        // Plant in new location with same plant ID
        spaceCheck.requiredIndices.forEach(cellIndex => {
          next[cellIndex] = info.plantId;
        });
        
        newCells = next;
        return next;
      });
      
      // Save to history after state updates
      setTimeout(() => {
        if (newCells) {
          setPlantInstances(currentInstances => {
            saveToHistory(newCells, currentInstances);
            return currentInstances;
          });
        }
      }, 0);
    }
    
    setOverIndex(null);
    setHoveredIndices([]);
    setHoveredPlant(null);
  };

  // Trash dropzone to delete plants dragged from cells
  const [trashHot, setTrashHot] = useState(false);
  const onTrashDragOver = (e) => {
    // Only allow if dragging from a cell
    if (dragInfoRef.current.kind === 'cell') {
      e.preventDefault();
      setTrashHot(true);
    }
  };
  const onTrashDragLeave = () => setTrashHot(false);
  const onTrashDrop = (e) => {
    e.preventDefault();
    const info = dragInfoRef.current;
    if (info.kind === 'cell' && info.plantIndices) {
      let newCells, newPlantInstances;
      
      setCells((prev) => {
        const next = [...prev];
        // Delete all cells occupied by the plant
        info.plantIndices.forEach(index => {
          next[index] = null;
        });
        newCells = next;
        return next;
      });
      
      // Remove plant instance from map
      setPlantInstances((prev) => {
        const next = new Map(prev);
        next.delete(info.plantId);
        newPlantInstances = next;
        return next;
      });
      
      // Save to history after state updates
      setTimeout(() => {
        if (newCells && newPlantInstances) {
          saveToHistory(newCells, newPlantInstances);
        }
      }, 0);
    }
    setTrashHot(false);
    // Clear visual feedback after dropping in trash
    setOverIndex(null);
    setHoveredIndices([]);
    setHoveredPlant(null);
  };
  
  return (
    <div className="simulation-page">
      <section className="simulation-panel-section">
        <div className="simulation-plant-inventory">
          <div className="plant-filter-search-bar">
            <button 
              className={`simulation-filter-toggle-btn ${showFilters ? 'expanded' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <span className="simulation-filter-icon">▼</span>
              Filter
            </button>
            
            <div className="simulation-search-container">
              <span className="simulation-search-icon"><MdSearch /></span>
              <input 
                type="text"
                className="simulation-search-input"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {showFilters && (
            <div className="simulation-filters-container">
              <div className="simulation-filters-content">
                <h3 className="simulation-filters-title">Plant Filter</h3>
                
                <div className="simulation-filter-section">
                  <h4 className="simulation-filter-category">Category</h4>
                  <div className="simulation-filter-options">
                    <button 
                      className={`simulation-filter-option ${selectedCategory === 'Vegetables' ? 'selected' : ''}`}
                      onClick={() => setSelectedCategory(selectedCategory === 'Vegetables' ? '' : 'Vegetables')}
                    >
                      Vegetable
                    </button>
                    <button 
                      className={`simulation-filter-option ${selectedCategory === 'Herbs' ? 'selected' : ''}`}
                      onClick={() => setSelectedCategory(selectedCategory === 'Herbs' ? '' : 'Herbs')}
                    >
                      Herb
                    </button>
                    <button 
                      className={`simulation-filter-option ${selectedCategory === 'Flowers' ? 'selected' : ''}`}
                      onClick={() => setSelectedCategory(selectedCategory === 'Flowers' ? '' : 'Flowers')}
                    >
                      Flower
                    </button>
                  </div>
                </div>

                <div className="simulation-filter-section">
                  <h4 className="simulation-filter-category">Hardiness</h4>
                  <div className="simulation-filter-options">
                    <button 
                      className={`simulation-filter-option ${selectedHardiness === 'Frost Hardy' ? 'selected' : ''}`}
                      onClick={() => setSelectedHardiness(selectedHardiness === 'Frost Hardy' ? '' : 'Frost Hardy')}
                    >
                      Frost Hardy
                    </button>
                    <button 
                      className={`simulation-filter-option ${selectedHardiness === 'Frost Tender' ? 'selected' : ''}`}
                      onClick={() => setSelectedHardiness(selectedHardiness === 'Frost Tender' ? '' : 'Frost Tender')}
                    >
                      Frost Tender
                    </button>
                    <button 
                      className={`simulation-filter-option ${selectedHardiness === 'Half Hardy' ? 'selected' : ''}`}
                      onClick={() => setSelectedHardiness(selectedHardiness === 'Half Hardy' ? '' : 'Half Hardy')}
                    >
                      Half Hardy
                    </button>
                  </div>
                </div>

                <div className="simulation-filter-section">
                  <h4 className="simulation-filter-category">Plant Spacing</h4>
                  <div className="simulation-filter-options">
                    <button 
                      className={`simulation-filter-option ${selectedSpacing === 0 ? 'selected' : ''}`}
                      onClick={() => setSelectedSpacing(selectedSpacing === 0 ? null : 0)}
                    >
                      20 cm
                    </button>
                    <button 
                      className={`simulation-filter-option ${selectedSpacing === 1 ? 'selected' : ''}`}
                      onClick={() => setSelectedSpacing(selectedSpacing === 1 ? null : 1)}
                    >
                      40 cm
                    </button>
                    <button 
                      className={`simulation-filter-option ${selectedSpacing === 2 ? 'selected' : ''}`}
                      onClick={() => setSelectedSpacing(selectedSpacing === 2 ? null : 2)}
                    >
                      60 cm
                    </button>
                    <button 
                      className={`simulation-filter-option ${selectedSpacing === 3 ? 'selected' : ''}`}
                      onClick={() => setSelectedSpacing(selectedSpacing === 3 ? null : 3)}
                    >
                      ≥ 80 cm
                    </button>
                  </div>
                </div>

                <div className="simulation-filter-footer">
                  <span className="simulation-plant-count">Available Plants: {plants.length}</span>
                </div>

                <div className="simulation-filter-actions">
                  <button className="simulation-reset-btn" onClick={() => {
                    setSelectedCategory('');
                    setSelectedHardiness('');
                    setSelectedSpacing(null);
                  }}>
                    Reset All
                  </button>
                  <button 
                    className="apply-filter-btn" 
                    onClick={() => {
                      handleFilter();
                      setShowFilters(false); // 关闭filter栏
                    }} 
                    disabled={loading}
                  >
                    Apply Filters({[selectedCategory, selectedHardiness, selectedSpacing].filter(Boolean).length})
                  </button>
                </div>

                {error && <div className="error-banner">{error}</div>}
              </div>
            </div>
          )}

          <div className="plant-display-area">
            <div className="plant-list-header">
              <h3>Available Plants ({plants.length})</h3>
              {loading && <span className="loading-indicator">Loading...</span>}
            </div>

            <div className="simulation-plant-list">
            {plants.length === 0 && !loading ? (
              <div className="no-plants-message">
                <p>No plants found matching your criteria.</p>
                <p>Try adjusting your filters or click "Apply filters" to search again.</p>
              </div>
            ) : (
              plants.map((p, i) => {
                const name = p.plant_name;
                const src = `/images/cute-plants/${name}.png`;
                return (
                  <div key={name + i} className="simulation-plant-card">
                    <img
                      src={src}
                      alt={name}
                      draggable
                      onDragStart={(e) => onDragStartInventory(e, name)}
                    />
                    <div className="simulation-plant-name" title={name}>{name}</div>
                  </div>
                );
              })
            )}
            </div>
          </div>
        </div>
      </section>

      <section className="simulation-garden-section">
        <div className="simulation-tools-container">
          <div className="tools-grid">
            
            {/* Left: Top Recommendations */}
            <section className="tools-card rec-card">
              <div className="card-head">
                <h4>Top Recommendations</h4>
              </div>

              {recLoading ? (
                <div className="card-empty">Loading…</div>
              ) : recError ? (
                <div className="card-empty">{recError}</div>
              ) : recs.length === 0 ? (
                <div className="card-empty">No suggestions yet</div>
              ) : (
                <ul className="rec-list">
                  {recs.map((name) => (
                    <li key={name} className="rec-item" onClick={() => setSearchTerm(name)}>
                      <img
                        src={`/images/cute-plants/${name}.png`}
                        alt={name}
                        onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
                      />
                      <span className="rec-name">{name}</span>
                      <span className="rec-chevron">›</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Middle: Tools */}
            <section className="tools-card tools-card--actions">
              <div className="card-head"><h4>Tools</h4></div>
              <div className="tool-actions">
                <button
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  title="Undo"
                >
                  <MdUndo />
                  <span>Undo</span>
                </button>

                <button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  title="Redo"
                >
                  <MdRedo />
                  <span>Redo</span>
                </button>

                <button onClick={clearGarden} title="Clear all">
                  <MdClear />
                  <span>Clear</span>
                </button>

                <button onClick={() => downloadGardenLayout('jpg')}>
                  <MdImage />
                  <span>Download</span>
                </button>

                <button
                  className="full-width"
                  onClick={openSetup}
                  title="Edit garden setup"
                >
                  <MdSettings />
                  <span>Edit setup</span>
                </button>
              </div>
            </section>

            {/* Right: Trash can */}
            <section className="tools-card trash-card">
              <div className="card-head"><h4>Trash can</h4></div>
              <div
                className={`trash-dropzone block ${trashHot ? 'hot' : ''}`}
                onDragOver={onTrashDragOver}
                onDragLeave={onTrashDragLeave}
                onDrop={onTrashDrop}
                title="Drag a planted item here to remove it"
                aria-label="Trash bin"
              >
                {trashHot ? <MdDeleteForever className="trash-icon" /> : <MdDelete className="trash-icon" />}
                <div className="trash-label">Delete?</div>
              </div>
            </section>

          </div>
        </div>

        <div className="garden-wrapper">
          <div className="simulation-garden-container">
            <div className="simulation-garden-scroll">
                <div 
                className="garden-grid"
                style={{
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, minmax(60px, 1fr))`,
                }}
                >
                {Array.from({ length: size }).map((_, idx) => {
                const plantId = cells[idx];
                const plantInstance = plantId ? plantInstances.get(plantId) : null;
                const isOver = overIndex === idx;
                const isHovered = hoveredIndices.includes(idx);
                const isValidHover = isHovered && hoveredPlant;
                const isInvalidHover = isOver && hoveredPlant && !isHovered;
                
                const tooltipText = plantInstance 
                  ? `${plantInstance.name}${plantInstance.spacing ? ` (${plantInstance.spacing}×${plantInstance.spacing}cm)` : ''}`
                  : isInvalidHover && hoveredPlant
                    ? `${hoveredPlant} needs ${getRequiredCells(hoveredPlant)}×${getRequiredCells(hoveredPlant)} cells (${getPlantSpacing(hoveredPlant) || 20}×${getPlantSpacing(hoveredPlant) || 20}cm) space`
                    : '';
                
                return (
                    <div
                    key={idx}
                    className={`garden-cell ${isOver ? 'over' : ''} ${isValidHover ? 'valid-hover' : ''} ${isInvalidHover ? 'invalid-hover' : ''}`}
                    onDragOver={(e) => onCellDragOver(e, idx)}
                    onDragLeave={() => onCellDragLeave(idx)}
                    onDrop={(e) => onCellDrop(e, idx)}
                    title={tooltipText}
                    >
                    {plantInstance && (
                        <img
                        src={`/images/cute-plants/${plantInstance.name}.png`}
                        alt={plantInstance.name}
                        draggable
                        onDragStart={(e) => onDragStartCell(e, idx)}
                        className="planted-img"
                        title={`${plantInstance.name}${plantInstance.spacing ? ` (${plantInstance.spacing}×${plantInstance.spacing}cm)` : ''}`}
                        />
                    )}
              </div>
                );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {showSetup && (
        <div className="setup-modal-overlay" role="dialog" aria-modal="true">
          <div className="setup-modal">
            <button className="setup-close" aria-label="Close" onClick={closeSetup}>✕</button>

            <h2 className="setup-title">
              <span>Give us your</span>
              <strong>Garden Setup</strong>
            </h2>
            <div className="setup-progress">
              <div
                className="setup-progress-bar"
                style={{ width: `${(setupStep / 3) * 100}%` }}
              />
            </div>
            <div className="setup-step-indicator">Step {setupStep} / 3</div>

            {setupStep === 1 && (
              <div className="setup-panel">
                <h3 className="setup-panel-title">Choose your bed size</h3>
                <p className="setup-panel-sub">Tell us how big your garden is (e.g., 20 × 20cm).</p>

                <div className="size-grid">
                  <div className="size-field">
                    <label>Width</label>
                    <input
                      type="range"
                      min="60" max="160" step="20"
                      value={bedWidth ?? 60}
                      onChange={(e) => setBedWidth(parseInt(e.target.value, 10))}
                    />
                  </div>

                  <div className="size-field">
                    <label>Length</label>
                    <input
                      type="range"
                      min="60" max="360" step="20"
                      value={bedLength ?? 60}
                      onChange={(e) => setBedLength(parseInt(e.target.value, 10))}
                    />
                  </div>
                  
                  <div className="size-value">{cm(bedWidth ?? 60)} × {cm(bedLength ?? 60)}</div>
                </div>
              </div>
            )}

            {setupStep === 2 && (
              <div className="setup-panel">
                <h3 className="setup-panel-title">Choose your season</h3>
                <p className="setup-panel-sub">We’ll recommend plants that thrive right now.</p>

                <div className="field">
                  <label>Season</label>
                  <select
                    value={season ?? 'All season'}
                    onChange={(e) => setSeason(e.target.value)}
                  >
                    <option>All season</option>
                    <option>Summer (Dec–Feb)</option>
                    <option>Autumn (Mar–May)</option>
                    <option>Winter (Jun–Aug)</option>
                    <option>Spring (Sep–Nov)</option>
                  </select>
                </div>
              </div>
            )}

            {setupStep === 3 && (
              <div className="setup-panel">
                <h3 className="setup-panel-title">Choose sun exposure</h3>
                <p className="setup-panel-sub">Full sun, partial shade, or mostly shade.</p>

                <div className="field">
                  <div className="label-with-info">
                    <label>Sun Exposure</label>
                    <span className="info" aria-label="info" tabIndex={0}>
                      <MdInfo />
                      <span className="tooltip">
                        You can choose based on your experience; for more professional/accurate measurements, the following standards are provided as reference:<br/>
                        Full sun: ≥ 5 kWh·m⁻²<br/>
                        Part sun: 3 – 6 kWh·m⁻²<br/>
                        Part shade: 2 – 5 kWh·m⁻²<br/>
                        Full shade: ≤ 3 kWh·m⁻²
                      </span>
                    </span>
                  </div>

                  <select
                    value={sunshine ?? 'All'}
                    onChange={(e) => setSunshine(e.target.value)}
                  >
                    <option>All</option>
                    <option>Full sun</option>
                    <option>Part sun</option>
                    <option>Part shade</option>
                    <option>Full shade</option>
                  </select>
                </div>
              </div>
            )}

            <div className="setup-actions">
              <button
                className="btn-secondary"
                onClick={setupStep === 1 ? closeSetup : prevStep}
              >
                {setupStep === 1 ? 'Close' : 'Previous'}
              </button>

              <button
                className="btn-primary"
                onClick={setupStep === 3 ? closeSetup : nextStep}
              >
                {setupStep === 3 ? 'Save' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {alertMessage && (
        <div className="custom-alert-overlay">
          <div className="custom-alert">
            <div className="custom-alert-icon">
              <MdWarning />
            </div>
            <div className="custom-alert-message">{alertMessage}</div>
          </div>
        </div>
      )}

      {/* Custom Confirm Dialog */}
      {confirmDialog && (
        <div className="custom-confirm-overlay">
          <div className="custom-confirm">
            <div className="custom-confirm-icon">
              <MdWarning />
            </div>
            <div className="custom-confirm-message">
              {confirmDialog.message}
            </div>
            <div className="custom-confirm-buttons">
              <button 
                className="custom-confirm-cancel"
                onClick={confirmDialog.onCancel}
              >
                <MdCancel />
                Cancel
              </button>
              <button 
                className="custom-confirm-ok"
                onClick={confirmDialog.onConfirm}
              >
                <MdCheckCircle />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


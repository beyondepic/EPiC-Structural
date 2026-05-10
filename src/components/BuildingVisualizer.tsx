import React, { useRef, useEffect, useCallback, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import FullscreenButton from './FullscreenButton';
import './BuildingVisualizer.css';

const STRUCTURE_TYPE_ALIASES = {
  shearwall: "shearwall",
  shearwallcore: "shearwall",
  "shear-wall": "shearwall",
  outriggerbelt: "outriggerbelt",
  "outriggerandbelt": "outriggerbelt",
  bracedtube: "bracedtube",
  "braced-tube": "bracedtube",
  frame: "frame",
  steel: "steel",
  concrete: "concrete",
  timber: "timber"
};

const normalizeStructureType = (input, fallback = "frame") => {
  if (!input) return fallback;
  const cleaned = String(input).replace(/\s+/g, "").toLowerCase();
  return STRUCTURE_TYPE_ALIASES[cleaned] || fallback;
};

const areOptionsEqual = (prev = [], next = []) => {
  if (prev === next) return true;
  if (!Array.isArray(prev) || !Array.isArray(next)) return false;
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i += 1) {
    const prevOption = prev[i];
    const nextOption = next[i];
    if (prevOption?.value !== nextOption?.value || prevOption?.label !== nextOption?.label) {
      return false;
    }
  }
  return true;
};

function getMaterial(materialType, structureType) {
  console.log('Getting material - Type:', materialType, 'Structure:', structureType);
  
  // Unified blue color for all structural elements to match columns and contrast with white floors
  const unifiedColor = "#4A90E2"; // Blue color for all structures
  
  return new THREE.MeshStandardMaterial({ 
    color: unifiedColor,
    roughness: 0.7,
    metalness: 0.2 
  });
}

// Generate building geometry
function createBuilding({ storeys, floorHeight, width, depth, widthSpans, depthSpans, structureType, materialType, flowData }) {
  console.log('Creating building with:', { storeys, floorHeight, width, depth, widthSpans, depthSpans, structureType, materialType });
  
  const group = new THREE.Group();
  const widthSpanSize = width / widthSpans;
  const depthSpanSize = depth / depthSpans;
  const mat = getMaterial(materialType, structureType);

  const slabMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Pure white
    roughness: 0.3, // Much lower rBuildingVisualizeroughness for brighter appearance
    metalness: 0.0, // Non-metallic
    transparent: false,
    emissive: 0x808080 // Much stronger emissive for very bright white appearance
  });
  
  // Add debug logging to confirm material creation
  console.log('Slab material created with color:', slabMaterial.color.getHexString());
  console.log('Slab material roughness:', slabMaterial.roughness);
  console.log('Slab material emissive:', slabMaterial.emissive.getHexString());

  // Add floor slabs for all levels (ground to top)
  for (let i = 0; i < storeys; i++) {
    const currentY = i * floorHeight;
    const floorGeometry = new THREE.BoxGeometry(width, 0.2, depth);
    // Force all floor slabs to use white material
    const floorMaterial = slabMaterial;
    
    console.log(`Floor ${i}: Using slab material with color:`, floorMaterial.color.getHexString());
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = currentY;
    floor.castShadow = true;
    floor.receiveShadow = true;
    
    // Force material update
    floorMaterial.needsUpdate = true;
    
    group.add(floor);

    // Add structural elements (columns, beams, etc.) for each level
    const isTopFloor = i === storeys - 1;
    
    // Only add columns if not on top floor to avoid extra layer of columns
    if (!isTopFloor) {
      const columnHeight = floorHeight;
      
      for (let w = 0; w <= widthSpans; w++) {
        for (let d = 0; d <= depthSpans; d++) {
          const colGeometry = new THREE.BoxGeometry(0.3, columnHeight, 0.3);
          const column = new THREE.Mesh(colGeometry, mat);
          column.position.x = -width / 2 + w * widthSpanSize;
          column.position.z = -depth / 2 + d * depthSpanSize;
          column.position.y = currentY + columnHeight / 2;
          column.castShadow = true;
          column.receiveShadow = true;
          group.add(column);
        }
      }
    }

    // Handle different structural systems (lowercase values from App.jsx)
    if (structureType === "frame" || structureType === "steel" || structureType === "concrete" || structureType === "timber") {
      // Traditional frame structure - beams and columns
      if (!isTopFloor) {
        // Horizontal beams (width direction)
        for (let w = 0; w < widthSpans; w++) {
          for (let d = 0; d <= depthSpans; d++) {
            const beamGeometry = new THREE.BoxGeometry(widthSpanSize - 0.1, 0.2, 0.3);
            const beam = new THREE.Mesh(beamGeometry, mat);
            beam.position.x = -width / 2 + w * widthSpanSize + widthSpanSize / 2;
            beam.position.z = -depth / 2 + d * depthSpanSize;
            beam.position.y = currentY + floorHeight;
            beam.castShadow = true;
            beam.receiveShadow = true;
            group.add(beam);
          }
        }
        // Horizontal beams (depth direction)
        for (let w = 0; w <= widthSpans; w++) {
          for (let d = 0; d < depthSpans; d++) {
            const beamGeometry = new THREE.BoxGeometry(0.3, 0.2, depthSpanSize - 0.1);
            const beam = new THREE.Mesh(beamGeometry, mat);
            beam.position.x = -width / 2 + w * widthSpanSize;
            beam.position.z = -depth / 2 + d * depthSpanSize + depthSpanSize / 2;
            beam.position.y = currentY + floorHeight;
            beam.castShadow = true;
            beam.receiveShadow = true;
            group.add(beam);
          }
        }
      }
    } else if (structureType === "shearwall") {
      // Enhanced shear wall system - continuous cross-shaped core walls and continuous perimeter walls
      const wallHeight = floorHeight - 0.1;
      const coreWallThickness = 0.6; // Increased thickness
      const perimeterWallThickness = 0.4;
      
      // Central cross-shaped shear walls - continuous through all floors (built on each floor for continuous effect)
      // Longitudinal core shear wall (north-south direction)
      const longitudinalWallGeometry = new THREE.BoxGeometry(coreWallThickness, wallHeight, depth * 0.8);
      const longitudinalWall = new THREE.Mesh(longitudinalWallGeometry, mat);
      longitudinalWall.position.x = 0;
      longitudinalWall.position.z = 0;
      longitudinalWall.position.y = currentY + wallHeight/2 + 0.05;
      longitudinalWall.castShadow = true;
      longitudinalWall.receiveShadow = true;
      group.add(longitudinalWall);
      
      // Transverse core shear wall (east-west direction)
      const transverseWallGeometry = new THREE.BoxGeometry(width * 0.8, wallHeight, coreWallThickness);
      const transverseWall = new THREE.Mesh(transverseWallGeometry, mat);
      transverseWall.position.x = 0;
      transverseWall.position.z = 0;
      transverseWall.position.y = currentY + wallHeight/2 + 0.05;
      transverseWall.castShadow = true;
      transverseWall.receiveShadow = true;
      group.add(transverseWall);
      
      // Continuous perimeter shear walls - continuous thick walls with window openings
      const windowSpacing = widthSpanSize;
      const windowWidth = widthSpanSize * 0.6;
      
      // Front and back perimeter walls (north-south walls) - continuous walls with windows
      for (let side = 0; side < 2; side++) {
        const wallZ = side === 0 ? depth/2 - perimeterWallThickness/2 : -depth/2 + perimeterWallThickness/2;
        
        // Continuous wall segments, leaving window openings
        for (let w = 0; w < widthSpans; w++) {
          // Wall segments (between windows)
          const wallSegmentWidth = windowSpacing - windowWidth;
          if (wallSegmentWidth > 0.1) { // Only create when wall segment is wide enough
            const wallSegmentGeometry = new THREE.BoxGeometry(wallSegmentWidth, wallHeight, perimeterWallThickness);
            const wallSegment = new THREE.Mesh(wallSegmentGeometry, mat);
            wallSegment.position.x = -width/2 + w * windowSpacing + wallSegmentWidth/2;
            wallSegment.position.z = wallZ;
            wallSegment.position.y = currentY + wallHeight/2 + 0.05;
            wallSegment.castShadow = true;
            wallSegment.receiveShadow = true;
            group.add(wallSegment);
          }
          
          // Lintels and sills (connecting wall segments to maintain continuity)
          if (w < widthSpans - 1) {
            const lintelHeight = wallHeight * 0.2;
            const lintelGeometry = new THREE.BoxGeometry(windowWidth, lintelHeight, perimeterWallThickness);
            
            // Lintel
            const lintel = new THREE.Mesh(lintelGeometry, mat);
            lintel.position.x = -width/2 + (w + 1) * windowSpacing - windowWidth/2;
            lintel.position.z = wallZ;
            lintel.position.y = currentY + wallHeight - lintelHeight/2;
            lintel.castShadow = true;
            lintel.receiveShadow = true;
            group.add(lintel);
            
            // Sill
            const sill = new THREE.Mesh(lintelGeometry, mat);
            sill.position.x = -width/2 + (w + 1) * windowSpacing - windowWidth/2;
            sill.position.z = wallZ;
            sill.position.y = currentY + lintelHeight/2 + 0.05;
            sill.castShadow = true;
            sill.receiveShadow = true;
            group.add(sill);
          }
        }
      }
      
      // Left and right perimeter walls (east-west walls) - continuous walls with windows
      for (let side = 0; side < 2; side++) {
        const wallX = side === 0 ? width/2 - perimeterWallThickness/2 : -width/2 + perimeterWallThickness/2;
        
        for (let d = 0; d < depthSpans; d++) {
          const wallSegmentDepth = depthSpanSize - (depthSpanSize * 0.6);
          if (wallSegmentDepth > 0.1) {
            const wallSegmentGeometry = new THREE.BoxGeometry(perimeterWallThickness, wallHeight, wallSegmentDepth);
            const wallSegment = new THREE.Mesh(wallSegmentGeometry, mat);
            wallSegment.position.x = wallX;
            wallSegment.position.z = -depth/2 + d * depthSpanSize + wallSegmentDepth/2;
            wallSegment.position.y = currentY + wallHeight/2 + 0.05;
            wallSegment.castShadow = true;
            wallSegment.receiveShadow = true;
            group.add(wallSegment);
          }
        }
      }
    } else if (structureType === "outriggerbelt") {
      // Enhanced outrigger and belt system - truss design
      const coreSize = Math.min(width, depth) * 0.3;
      const wallHeight = floorHeight - 0.2;
      
      // Core structure (unchanged)
      const coreGeometry = new THREE.BoxGeometry(coreSize, wallHeight, coreSize);
      const core = new THREE.Mesh(coreGeometry, mat);
      core.position.x = 0;
      core.position.z = 0;
      core.position.y = currentY + wallHeight/2 + 0.1;
      core.castShadow = true;
      core.receiveShadow = true;
      group.add(core);
      
      // Outrigger trusses - every 4 floors, X-type and K-type diagonal braces
      if (i % 4 === 0) { 
        const outriggerY = currentY + floorHeight * 0.7;
        const braceRadius = 0.12;
        
        // East-west outrigger trusses
        for (let side = -1; side <= 1; side += 2) {
          const baseX = side * coreSize / 2;
          const endX = side * (width / 2 - 0.5);
          const trussLength = Math.abs(endX - baseX);
          
          // Main chord (top chord)
          const topChordGeometry = new THREE.CylinderGeometry(braceRadius, braceRadius, trussLength, 8);
          const topChord = new THREE.Mesh(topChordGeometry, mat);
          topChord.position.x = (baseX + endX) / 2;
          topChord.position.z = 0;
          topChord.position.y = outriggerY + 0.4;
          topChord.rotation.z = Math.PI / 2;
          topChord.castShadow = true;
          topChord.receiveShadow = true;
          group.add(topChord);
          
          // Main chord (bottom chord)
          const bottomChord = new THREE.Mesh(topChordGeometry, mat);
          bottomChord.position.x = (baseX + endX) / 2;
          bottomChord.position.z = 0;
          bottomChord.position.y = outriggerY - 0.4;
          bottomChord.rotation.z = Math.PI / 2;
          bottomChord.castShadow = true;
          bottomChord.receiveShadow = true;
          group.add(bottomChord);
          
          // X-type diagonal braces
          const segments = 4;
          for (let seg = 0; seg < segments; seg++) {
            const segmentLength = trussLength / segments;
            const startX = baseX + seg * segmentLength;
            const endX_seg = baseX + (seg + 1) * segmentLength;
            const diagLength = Math.sqrt(segmentLength ** 2 + 0.8 ** 2);
            
            // Positive diagonal
            const diag1Geometry = new THREE.CylinderGeometry(braceRadius * 0.7, braceRadius * 0.7, diagLength, 8);
            const diag1 = new THREE.Mesh(diag1Geometry, mat);
            diag1.position.x = (startX + endX_seg) / 2;
            diag1.position.z = 0;
            diag1.position.y = outriggerY;
            diag1.rotation.z = side * Math.atan2(0.8, segmentLength);
            diag1.castShadow = true;
            diag1.receiveShadow = true;
            group.add(diag1);
            
            // Negative diagonal
            const diag2 = new THREE.Mesh(diag1Geometry, mat);
            diag2.position.x = (startX + endX_seg) / 2;
            diag2.position.z = 0;
            diag2.position.y = outriggerY;
            diag2.rotation.z = -side * Math.atan2(0.8, segmentLength);
            diag2.castShadow = true;
            diag2.receiveShadow = true;
            group.add(diag2);
          }
        }
        
        // North-south outrigger trusses (similar structure)
        for (let side = -1; side <= 1; side += 2) {
          const baseZ = side * coreSize / 2;
          const endZ = side * (depth / 2 - 0.5);
          const trussLength = Math.abs(endZ - baseZ);
          
          const topChordGeometry = new THREE.CylinderGeometry(braceRadius, braceRadius, trussLength, 8);
          const topChord = new THREE.Mesh(topChordGeometry, mat);
          topChord.position.x = 0;
          topChord.position.z = (baseZ + endZ) / 2;
          topChord.position.y = outriggerY + 0.4;
          topChord.rotation.x = Math.PI / 2;
          topChord.castShadow = true;
          topChord.receiveShadow = true;
          group.add(topChord);
          
          const bottomChord = new THREE.Mesh(topChordGeometry, mat);
          bottomChord.position.x = 0;
          bottomChord.position.z = (baseZ + endZ) / 2;
          bottomChord.position.y = outriggerY - 0.4;
          bottomChord.rotation.x = Math.PI / 2;
          bottomChord.castShadow = true;
          bottomChord.receiveShadow = true;
          group.add(bottomChord);
        }
      }
      
      // Ring belt trusses - every 6 floors, continuously around perimeter
      if (i % 6 === 0) {
        const beltY = currentY + floorHeight * 0.85;
        const beltRadius = 0.1;
        const beltHeight = 0.8;
        
        // Perimeter ring trusses - four sides forming continuous trusses
        const perimeterPoints = [
          { x: width/2 - 0.3, z: depth/2 - 0.3 },
          { x: -width/2 + 0.3, z: depth/2 - 0.3 },
          { x: -width/2 + 0.3, z: -depth/2 + 0.3 },
          { x: width/2 - 0.3, z: -depth/2 + 0.3 }
        ];
        
        for (let p = 0; p < perimeterPoints.length; p++) {
          const currentPoint = perimeterPoints[p];
          const nextPoint = perimeterPoints[(p + 1) % perimeterPoints.length];
          
          const segmentLength = Math.sqrt(
            (nextPoint.x - currentPoint.x) ** 2 + 
            (nextPoint.z - currentPoint.z) ** 2
          );
          
          // Top chord
          const topChordGeometry = new THREE.CylinderGeometry(beltRadius, beltRadius, segmentLength, 8);
          const topChord = new THREE.Mesh(topChordGeometry, mat);
          topChord.position.x = (currentPoint.x + nextPoint.x) / 2;
          topChord.position.z = (currentPoint.z + nextPoint.z) / 2;
          topChord.position.y = beltY + beltHeight/2;
          
          if (Math.abs(nextPoint.x - currentPoint.x) > Math.abs(nextPoint.z - currentPoint.z)) {
            topChord.rotation.z = Math.PI / 2;
          } else {
            topChord.rotation.x = Math.PI / 2;
          }
          
          topChord.castShadow = true;
          topChord.receiveShadow = true;
          group.add(topChord);
          
          // Bottom chord
          const bottomChord = new THREE.Mesh(topChordGeometry, mat);
          bottomChord.position.x = (currentPoint.x + nextPoint.x) / 2;
          bottomChord.position.z = (currentPoint.z + nextPoint.z) / 2;
          bottomChord.position.y = beltY - beltHeight/2;
          
          if (Math.abs(nextPoint.x - currentPoint.x) > Math.abs(nextPoint.z - currentPoint.z)) {
            bottomChord.rotation.z = Math.PI / 2;
          } else {
            bottomChord.rotation.x = Math.PI / 2;
          }
          
          bottomChord.castShadow = true;
          bottomChord.receiveShadow = true;
          group.add(bottomChord);
          
          // Vertical webs
          const segments = Math.floor(segmentLength / 2);
          for (let s = 0; s <= segments; s++) {
            const ratio = s / segments;
            const webX = currentPoint.x + (nextPoint.x - currentPoint.x) * ratio;
            const webZ = currentPoint.z + (nextPoint.z - currentPoint.z) * ratio;
            
            const webGeometry = new THREE.CylinderGeometry(beltRadius * 0.7, beltRadius * 0.7, beltHeight, 8);
            const web = new THREE.Mesh(webGeometry, mat);
            web.position.x = webX;
            web.position.z = webZ;
            web.position.y = beltY;
            web.castShadow = true;
            web.receiveShadow = true;
            group.add(web);
          }
        }
      }
    } else if (structureType === "bracedtube") {
      // Enhanced braced tube system - continuous X-grid, every 2-3 floors
      const braceRadius = 0.12;
      const braceEveryFloors = 2; // Set braces every 2 floors
      
      if (i % braceEveryFloors === 0) {
        // Continuous X-grid on front and back facades
        for (let face = 0; face < 2; face++) {
          const faceZ = face === 0 ? depth/2 : -depth/2;
          
          // Create continuous X-grid - X-type braces for each span
          for (let w = 0; w < widthSpans; w++) {
            const startX = -width/2 + w * widthSpanSize;
            const endX = -width/2 + (w + 1) * widthSpanSize;
            const spanWidth = endX - startX;
            const braceHeight = floorHeight * braceEveryFloors;
            const braceLength = Math.sqrt(spanWidth ** 2 + braceHeight ** 2);
            
            // X-type diagonal braces - positive diagonal (\)
            const brace1Geometry = new THREE.CylinderGeometry(braceRadius, braceRadius, braceLength, 8);
            const brace1 = new THREE.Mesh(brace1Geometry, mat);
            brace1.position.x = (startX + endX) / 2;
            brace1.position.z = faceZ;
            brace1.position.y = currentY + braceHeight / 2;
            brace1.rotation.z = Math.atan2(braceHeight, spanWidth);
            brace1.castShadow = true;
            brace1.receiveShadow = true;
            group.add(brace1);
            
            // X-type diagonal braces - negative diagonal (/)
            const brace2 = new THREE.Mesh(brace1Geometry, mat);
            brace2.position.x = (startX + endX) / 2;
            brace2.position.z = faceZ;
            brace2.position.y = currentY + braceHeight / 2;
            brace2.rotation.z = -Math.atan2(braceHeight, spanWidth);
            brace2.castShadow = true;
            brace2.receiveShadow = true;
            group.add(brace2);
            
            // Horizontal connecting rods (creating grid effect)
            if (w < widthSpans - 1) {
              const connectionGeometry = new THREE.CylinderGeometry(braceRadius * 0.8, braceRadius * 0.8, spanWidth * 0.3, 8);
              const connection = new THREE.Mesh(connectionGeometry, mat);
              connection.position.x = endX;
              connection.position.z = faceZ;
              connection.position.y = currentY + braceHeight / 2;
              connection.rotation.z = Math.PI / 2;
              connection.castShadow = true;
              connection.receiveShadow = true;
              group.add(connection);
            }
          }
        }
        
        // Continuous X-grid on left and right facades
        for (let face = 0; face < 2; face++) {
          const faceX = face === 0 ? width/2 : -width/2;
          
          for (let d = 0; d < depthSpans; d++) {
            const startZ = -depth/2 + d * depthSpanSize;
            const endZ = -depth/2 + (d + 1) * depthSpanSize;
            const spanDepth = endZ - startZ;
            const braceHeight = floorHeight * braceEveryFloors;
            const braceLength = Math.sqrt(spanDepth ** 2 + braceHeight ** 2);
            
            // X-type diagonal braces
            const brace1Geometry = new THREE.CylinderGeometry(braceRadius, braceRadius, braceLength, 8);
            const brace1 = new THREE.Mesh(brace1Geometry, mat);
            brace1.position.x = faceX;
            brace1.position.z = (startZ + endZ) / 2;
            brace1.position.y = currentY + braceHeight / 2;
            brace1.rotation.x = Math.atan2(braceHeight, spanDepth);
            brace1.castShadow = true;
            brace1.receiveShadow = true;
            group.add(brace1);
            
            const brace2 = new THREE.Mesh(brace1Geometry, mat);
            brace2.position.x = faceX;
            brace2.position.z = (startZ + endZ) / 2;
            brace2.position.y = currentY + braceHeight / 2;
            brace2.rotation.x = -Math.atan2(braceHeight, spanDepth);
            brace2.castShadow = true;
            brace2.receiveShadow = true;
            group.add(brace2);
          }
        }
        
        // Corner reinforcement braces - forming complete tubular structure
        const corners = [
          { x: width/2, z: depth/2 },
          { x: -width/2, z: depth/2 },
          { x: -width/2, z: -depth/2 },
          { x: width/2, z: -depth/2 }
        ];
        
        for (let c = 0; c < corners.length; c++) {
          const corner = corners[c];
          const nextCorner = corners[(c + 1) % corners.length];
          
          const cornerDistance = Math.sqrt(
            (nextCorner.x - corner.x) ** 2 + 
            (nextCorner.z - corner.z) ** 2
          );
          const braceHeight = floorHeight * braceEveryFloors;
          const cornerBraceLength = Math.sqrt(cornerDistance ** 2 + braceHeight ** 2) * 0.3;
          
          const cornerBraceGeometry = new THREE.CylinderGeometry(braceRadius * 0.9, braceRadius * 0.9, cornerBraceLength, 8);
          const cornerBrace = new THREE.Mesh(cornerBraceGeometry, mat);
          cornerBrace.position.x = corner.x * 0.8;
          cornerBrace.position.z = corner.z * 0.8;
          cornerBrace.position.y = currentY + braceHeight / 2;
          
          // Complex 3D rotation
          cornerBrace.rotation.x = Math.atan2(braceHeight, cornerDistance) * 0.3;
          cornerBrace.rotation.z = Math.atan2(nextCorner.z - corner.z, nextCorner.x - corner.x) * 0.3;
          cornerBrace.castShadow = true;
          cornerBrace.receiveShadow = true;
          group.add(cornerBrace);
        }
      }
    }
  } // End of storeys for loop

  // Add top ceiling
  const topFloorY = storeys * floorHeight;
  const ceilingGeometry = new THREE.BoxGeometry(width, 0.2, depth);
  const ceiling = new THREE.Mesh(ceilingGeometry, slabMaterial);
  ceiling.position.y = topFloorY;
  ceiling.castShadow = true;
  ceiling.receiveShadow = true;
  
  console.log('Ceiling created with material color:', slabMaterial.color.getHexString());
  // Force material update for ceiling
  slabMaterial.needsUpdate = true;
  
  group.add(ceiling);
  
  // Recenter building group to its bounding box center, but keep bottom at ground level
  const groupBox = new THREE.Box3().setFromObject(group);
  const groupCenter = groupBox.getCenter(new THREE.Vector3());
  const groupMin = groupBox.min;
  
  // Only center X and Z, but keep Y aligned to ground (bottom at Y=0)
  group.position.x -= groupCenter.x;
  group.position.z -= groupCenter.z;
  group.position.y -= groupMin.y; // Move so bottom is at Y=0
  
  return group;
}


const BuildingVisualizer = ({
  storeys = 5,
  floorHeight = 3,
  width = 12,
  depth = 8,
  widthSpans = 3,
  depthSpans = 2,
  structureType = "frame",
  materialType = "steel",
  flowData = [],
  isAuthenticated = true,
  // Structural system selector props
  showStructuralSelector = false,
  currentStructuralSystem = null,
  availableStructuralSystems = [], // Options list from left panel selected items
  onStructuralSystemChange = null // Single select change handler
}) => {
  const mountRef = useRef();
  const buildingRef = useRef();
  const rendererRef = useRef();
  const sceneRef = useRef();
  const cameraRef = useRef();
  const controlsRef = useRef();
  const zoomAnimationRef = useRef(null);
  const isFirstUpdateRef = useRef(true);
  const prevParamsRef = useRef(null);
  const dimensionParamsRef = useRef({
    storeys,
    width,
    depth,
    widthSpans,
    depthSpans
  });

  const availableSystemValues = useMemo(
    () => availableStructuralSystems.map((option) => option.value),
    [availableStructuralSystems]
  );
  const hasStructuralSelector = showStructuralSelector && availableSystemValues.length > 0;
  const structuralSystemIsValid = hasStructuralSelector
    ? availableSystemValues.includes(currentStructuralSystem)
    : true;
  const fallbackStructuralSystem = hasStructuralSelector ? availableSystemValues[0] : null;
  const effectiveStructuralSystem = hasStructuralSelector
    ? (structuralSystemIsValid ? currentStructuralSystem : fallbackStructuralSystem)
    : currentStructuralSystem || structureType;
  const effectiveStructureType = useMemo(
    () => normalizeStructureType(effectiveStructuralSystem || structureType),
    [effectiveStructuralSystem, structureType]
  );

  useEffect(() => {
    if (!hasStructuralSelector) return;
    if (structuralSystemIsValid) return;
    if (!fallbackStructuralSystem) return;
    if (!onStructuralSystemChange) return;

    onStructuralSystemChange(fallbackStructuralSystem);
  }, [
    hasStructuralSelector,
    structuralSystemIsValid,
    fallbackStructuralSystem,
    onStructuralSystemChange
  ]);

  // Debug: Log props when they change
  useEffect(() => {
    console.log('BuildingVisualizer Props:', {
      showStructuralSelector,
      currentStructuralSystem,
      availableStructuralSystems,
      effectiveStructuralSystem,
      effectiveStructureType
    });
  }, [
    showStructuralSelector,
    currentStructuralSystem,
    availableStructuralSystems,
    effectiveStructuralSystem,
    effectiveStructureType
  ]);

  // Auto-zoom/refit core function
  const autoZoomToFitBuilding = useCallback((building, camera, controls, options = {}) => {
    if (!building || !camera || !controls) return;

    const {
      fillRatio = 0.8,
      duration = 800,
      animate = true
    } = options;

    const safeFillRatio = Math.min(Math.max(fillRatio, 0.1), 0.95);

    const boundingBox = new THREE.Box3().setFromObject(building);
    const buildingCenter = boundingBox.getCenter(new THREE.Vector3());

    const boundingSphere = new THREE.Sphere();
    boundingBox.getBoundingSphere(boundingSphere);
    const radius = Math.max(boundingSphere.radius, 0.1);

    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const aspect = camera.aspect > 0 ? camera.aspect : 1;
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);

    const distanceForHeight = radius / (Math.tan(verticalFov / 2) * safeFillRatio);
    const distanceForWidth = radius / (Math.tan(horizontalFov / 2) * safeFillRatio);
    const idealDistance = Math.max(distanceForHeight, distanceForWidth);

    const direction = new THREE.Vector3()
      .subVectors(camera.position, controls.target)
      .normalize();

    if (!Number.isFinite(direction.lengthSq()) || direction.lengthSq() === 0) {
      direction.set(0, 0, 1);
    }

    const newCameraPosition = new THREE.Vector3()
      .copy(buildingCenter)
      .add(direction.multiplyScalar(idealDistance));

    const minDistance = Math.max(radius * 0.4, 2);
    const maxDistance = Math.max(radius * 20, idealDistance * 4);

    controls.minDistance = minDistance;
    controls.maxDistance = maxDistance;

    camera.near = Math.min(Math.max(idealDistance - radius * 4, 0.1), idealDistance);
    camera.far = Math.max(idealDistance + radius * 20, camera.near + 100);
    camera.updateProjectionMatrix();

    if (!animate || duration <= 0) {
      if (zoomAnimationRef.current) {
        cancelAnimationFrame(zoomAnimationRef.current);
        zoomAnimationRef.current = null;
      }
      camera.position.copy(newCameraPosition);
      controls.target.copy(buildingCenter);
      controls.update();
      return;
    }

    if (zoomAnimationRef.current) {
      cancelAnimationFrame(zoomAnimationRef.current);
      zoomAnimationRef.current = null;
    }

    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    const startTime = performance.now();

    const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const animateFrame = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = easeInOutCubic(progress);

      camera.position.lerpVectors(startPosition, newCameraPosition, eased);
      controls.target.lerpVectors(startTarget, buildingCenter, eased);
      controls.update();

      if (progress < 1) {
        zoomAnimationRef.current = requestAnimationFrame(animateFrame);
      } else {
        zoomAnimationRef.current = null;
      }
    };

    zoomAnimationRef.current = requestAnimationFrame(animateFrame);
  }, []);

  // Initialize Three.js scene - only reinitialize when collapse state and auth state change
  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const { clientWidth, clientHeight } = container;

    if (clientWidth < 10 || clientHeight < 10) return;
    if (rendererRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#ffffff");
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, clientWidth / clientHeight, 0.1, 10000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true, // keep buffer for reliable canvas snapshots (PDF export)
    });
    renderer.setSize(clientWidth, clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = true;
    renderer.shadowMap.needsUpdate = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const building = createBuilding({
      storeys,
      floorHeight,
      width,
      depth,
      widthSpans,
      depthSpans,
      structureType: effectiveStructureType,
      materialType,
      flowData
    });

    scene.add(building);
    buildingRef.current = building;

    const box = new THREE.Box3().setFromObject(building);
    const buildingCenter = box.getCenter(new THREE.Vector3());
    const buildingSize = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(buildingSize.x, buildingSize.z, buildingSize.y);

    const baseDistance = Math.max(maxDimension * 3, 50);
    camera.position.set(
      buildingCenter.x + baseDistance * 0.6,
      buildingCenter.y + buildingSize.y * 0.8,
      buildingCenter.z + baseDistance * 0.6
    );
    camera.lookAt(buildingCenter);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x606060, 0.7);
    scene.add(hemisphereLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    const lightDistance = Math.max(maxDimension * 3, buildingSize.y * 2, 100);
    dirLight.position.set(lightDistance, buildingSize.y * 1.8, lightDistance);
    dirLight.target.position.set(0, 0, 0);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 8192;
    dirLight.shadow.mapSize.height = 8192;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = lightDistance * 3;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.05;
    dirLight.shadow.radius = 5;

    const shadowSize = Math.max(maxDimension * 3, buildingSize.y * 1.5, 120);
    dirLight.shadow.camera.left = -shadowSize;
    dirLight.shadow.camera.right = shadowSize;
    dirLight.shadow.camera.top = shadowSize;
    dirLight.shadow.camera.bottom = -shadowSize;
    scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.2);
    dirLight2.position.set(-maxDimension, buildingSize.y * 0.8, -maxDimension);
    scene.add(dirLight2);

    const topLight = new THREE.DirectionalLight(0xffffff, 0.3);
    topLight.position.set(0, buildingSize.y * 3, 0);
    topLight.target.position.set(0, 0, 0);
    scene.add(topLight);

    const groundSize = Math.max(maxDimension * 8, 300);
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMaterial = new THREE.ShadowMaterial({
      opacity: 0.35,
      transparent: true,
      color: 0x444444
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    ground.castShadow = false;
    ground.name = 'shadowReceiver';
    scene.add(ground);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.enableRotate = true;
    controls.rotateSpeed = 1.0;
    controls.enableZoom = true;
    controls.zoomSpeed = 1.2;
    controls.target.copy(buildingCenter);
    controlsRef.current = controls;

    dimensionParamsRef.current = {
      storeys,
      width,
      depth,
      widthSpans,
      depthSpans
    };

    requestAnimationFrame(() => {
      autoZoomToFitBuilding(building, camera, controls, { animate: false, duration: 0 });
    });

    let frameId;
    const animateLoop = () => {
      if (controls && renderer && scene && camera) {
        controls.update();
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animateLoop);
      }
    };
    animateLoop();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (zoomAnimationRef.current) {
        cancelAnimationFrame(zoomAnimationRef.current);
        zoomAnimationRef.current = null;
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current = null;
      }
      sceneRef.current = null;
      buildingRef.current = null;
      controlsRef.current = null;
      cameraRef.current = null;
    };
  }, [
    autoZoomToFitBuilding,
    storeys,
    floorHeight,
    width,
    depth,
    widthSpans,
    depthSpans,
    effectiveStructureType,
    materialType,
    flowData
  ]);

  // Building update useEffect - enhanced auto-zoom logic
  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;

    const nextParams = {
      storeys,
      floorHeight,
      width,
      depth,
      widthSpans,
      depthSpans,
      structureType: effectiveStructureType,
      materialType,
      flowData
    };

    if (isFirstUpdateRef.current) {
      prevParamsRef.current = nextParams;
      isFirstUpdateRef.current = false;
      return;
    }

    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    prevParamsRef.current = nextParams;

    if (!scene || !camera || !controls || !buildingRef.current) {
      return;
    }

    scene.remove(buildingRef.current);
    buildingRef.current.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose && material.dispose());
        } else if (child.material && child.material.dispose) {
          child.material.dispose();
        }
      }
    });

    const newBuilding = createBuilding({
      storeys,
      floorHeight,
      width,
      depth,
      widthSpans,
      depthSpans,
      structureType: effectiveStructureType,
      materialType,
      flowData
    });

    scene.add(newBuilding);
    buildingRef.current = newBuilding;

    const dimensionParams = {
      storeys,
      width,
      depth,
      widthSpans,
      depthSpans
    };

    const dimensionChanged = Object.keys(dimensionParams).some((key) => {
      const prevValue = dimensionParamsRef.current?.[key];
      const nextValue = dimensionParams[key];
      return prevValue !== nextValue;
    });

    dimensionParamsRef.current = dimensionParams;

    if (dimensionChanged) {
      requestAnimationFrame(() => {
        autoZoomToFitBuilding(newBuilding, camera, controls, { animate: true });
      });
    }
  }, [
    autoZoomToFitBuilding,
    storeys,
    floorHeight,
    width,
    depth,
    widthSpans,
    depthSpans,
    effectiveStructureType,
    materialType,
    flowData
  ]);

  // Add window resize handling with size change detection to prevent infinite loops
  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current || !mountRef.current) return;

    let resizeTimeout;
    let lastWidth = 0;
    let lastHeight = 0;
    let resizeCount = 0;

    const handleResize = (entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      
      // Debug logging
      resizeCount++;
      console.log(`🏢 [BuildingVisualizer] Resize #${resizeCount}: ${width.toFixed(1)}x${height.toFixed(1)} (last: ${lastWidth.toFixed(1)}x${lastHeight.toFixed(1)})`);
      
      // Only trigger resize if dimensions actually changed by more than 1px (prevent micro-fluctuations)
      const widthChanged = Math.abs(width - lastWidth) > 1;
      const heightChanged = Math.abs(height - lastHeight) > 1;
      
      if (!widthChanged && !heightChanged) {
        console.log(`🏢 [BuildingVisualizer] Skipped - change too small`);
        return; // Skip if no significant change
      }

      const widthDelta = Math.abs(width - lastWidth);
      const heightDelta = Math.abs(height - lastHeight);
      
      lastWidth = width;
      lastHeight = height;

      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      resizeTimeout = setTimeout(() => {
        const container = mountRef.current;
        const camera = cameraRef.current;
        const renderer = rendererRef.current;
        const building = buildingRef.current;
        const controls = controlsRef.current;

        if (!container || !camera || !renderer || !building || !controls) {
          return;
        }

        const { clientWidth, clientHeight } = container;
        if (clientWidth < 10 || clientHeight < 10) return;

        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(clientWidth, clientHeight);

        // Only auto-zoom on significant resize (>50px change)
        if (widthDelta > 50 || heightDelta > 50) {
          console.log(`🏢 [BuildingVisualizer] Triggering auto-zoom (delta: ${widthDelta.toFixed(1)}x${heightDelta.toFixed(1)})`);
          requestAnimationFrame(() => {
            autoZoomToFitBuilding(building, camera, controls, { animate: false, duration: 0 });
          });
        } else {
          console.log(`🏢 [BuildingVisualizer] Resize only (no zoom)`);
        }
      }, 250); // Increased debounce to 250ms
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mountRef.current);

    return () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeObserver.disconnect();
    };
  }, [autoZoomToFitBuilding]);

  // Handle fullscreen callbacks for 3D renderer
  const handleEnterFullscreen = useCallback(() => {
    // Trigger resize after fullscreen transition
    setTimeout(() => {
      if (rendererRef.current && cameraRef.current && mountRef.current) {
        const { clientWidth, clientHeight } = mountRef.current;
        const camera = cameraRef.current;
        const renderer = rendererRef.current;
        
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(clientWidth, clientHeight);
        
        if (buildingRef.current && controlsRef.current) {
          autoZoomToFitBuilding(buildingRef.current, camera, controlsRef.current, { 
            animate: true, 
            duration: 500 
          });
        }
      }
    }, 100);
  }, [autoZoomToFitBuilding]);

  const handleExitFullscreen = useCallback(() => {
    // Trigger resize after exiting fullscreen
    setTimeout(() => {
      if (rendererRef.current && cameraRef.current && mountRef.current) {
        const { clientWidth, clientHeight } = mountRef.current;
        const camera = cameraRef.current;
        const renderer = rendererRef.current;
        
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(clientWidth, clientHeight);
        
        if (buildingRef.current && controlsRef.current) {
          autoZoomToFitBuilding(buildingRef.current, camera, controlsRef.current, { 
            animate: true, 
            duration: 500 
          });
        }
      }
    }, 100);
  }, [autoZoomToFitBuilding]);

  // Remove authentication check - always show 3D model

  return (
    <div className="bv-widget" id="building-visualizer-container">
      <div className="widget-header">
        {/* Title hidden - only show dropdown and fullscreen button */}
        <div className="visualizer-header">
          {/* Structural System Selector moved to header */}
          {showStructuralSelector && availableStructuralSystems.length > 0 && (
            <div className="bv-structural-selector-header">
              <select
                id="bv-structural-system"
                value={effectiveStructuralSystem || ''}
                onChange={(e) => onStructuralSystemChange && onStructuralSystemChange(e.target.value)}
                disabled={!isAuthenticated}
              >
                {availableStructuralSystems.map(system => (
                  <option key={system.value} value={system.value}>
                    {system.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="widget-actions">
          <FullscreenButton 
            targetId="building-visualizer-container"
            label="3D"
            onEnterFullscreen={handleEnterFullscreen}
            onExitFullscreen={handleExitFullscreen}
          />
        </div>
      </div>
      
      <div className="bv-content">
        {/* Dropdown moved to header, removed from here */}
        
        {/* 3D Canvas */}
        <div className="bv-canvas-container">
          <div ref={mountRef} className="bv-canvas" />
        </div>
      </div>
    </div>
  );
};

export default React.memo(BuildingVisualizer, (prevProps, nextProps) => {
  if (prevProps.storeys !== nextProps.storeys) return false;
  if (prevProps.floorHeight !== nextProps.floorHeight) return false;
  if (prevProps.width !== nextProps.width) return false;
  if (prevProps.depth !== nextProps.depth) return false;
  if (prevProps.widthSpans !== nextProps.widthSpans) return false;
  if (prevProps.depthSpans !== nextProps.depthSpans) return false;
  if (prevProps.structureType !== nextProps.structureType) return false;
  if (prevProps.materialType !== nextProps.materialType) return false;
  if (prevProps.currentStructuralSystem !== nextProps.currentStructuralSystem) return false;
  if (!areOptionsEqual(prevProps.availableStructuralSystems, nextProps.availableStructuralSystems)) return false;
  if (prevProps.showStructuralSelector !== nextProps.showStructuralSelector) return false;
  if (prevProps.isAuthenticated !== nextProps.isAuthenticated) return false;

  const prevFlow = JSON.stringify(prevProps.flowData);
  const nextFlow = JSON.stringify(nextProps.flowData);
  if (prevFlow !== nextFlow) return false;

  return true;
});

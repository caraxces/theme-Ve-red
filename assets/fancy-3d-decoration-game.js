/**
 * Fancy 3D Decoration Game với Three.js
 * Game trang trí 3D cho Shopify sử dụng mô hình 3D thực tế
 */

class Fancy3DDecorationGame {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.gameViewport = this.container.querySelector('.game-viewport');
    this.itemsGrid = this.container.querySelector('#items-grid');
    this.scoreElement = this.container.querySelector('#decoration-score');
    this.countElement = this.container.querySelector('#items-count');
    
    this.currentCategory = 'furniture';
    this.selectedItem = null;
    this.placedItems = [];
    this.score = 0;
    this.maxItems = 25;
    this.isDragging = false;
    
    // Three.js objects
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.dragControls = null;
    this.draggableObjects = [];
    this.raycaster = null;
    this.mouse = null;
    
    // Room dimensions
    this.ROOM_WIDTH = 10;
    this.ROOM_DEPTH = 10;
    this.ROOM_HEIGHT = 6;
    this.WALL_THICKNESS = 0.5;
    this.FLOOR_THICKNESS = 0.2;
    
    this.decorationData = {
      furniture: [
        { name: 'Giường', points: 25, type: 'bed' },
        { name: 'Ghế', points: 10, type: 'chair' },
        { name: 'Tủ đầu giường', points: 15, type: 'nightstand' },
        { name: 'Tủ quần áo', points: 20, type: 'dresser' },
        { name: 'Bàn làm việc', points: 18, type: 'desk' },
        { name: 'Kệ sách', points: 16, type: 'bookshelf' },
        { name: 'Ghế sofa', points: 22, type: 'sofa' },
        { name: 'Bàn cà phê', points: 12, type: 'coffeeTable' }
      ],
      plants: [
        { name: 'Cây nhỏ', points: 8, type: 'smallPlant' },
        { name: 'Cây vừa', points: 12, type: 'mediumPlant' },
        { name: 'Cây lớn', points: 18, type: 'largePlant' },
        { name: 'Cây xương rồng', points: 10, type: 'cactus' },
        { name: 'Cây dương xỉ', points: 14, type: 'fern' },
        { name: 'Cây cao su', points: 16, type: 'rubberPlant' }
      ],
      lighting: [
        { name: 'Đèn bàn', points: 12, type: 'tableLamp' },
        { name: 'Đèn sàn', points: 18, type: 'floorLamp' },
        { name: 'Đèn trần', points: 25, type: 'ceilingLight' },
        { name: 'Đèn tường', points: 15, type: 'wallLight' },
        { name: 'Nến', points: 6, type: 'candle' },
        { name: 'Đèn LED', points: 20, type: 'ledStrip' }
      ],
      decorations: [
        { name: 'Tranh', points: 15, type: 'painting' },
        { name: 'Gương', points: 18, type: 'mirror' },
        { name: 'Thảm', points: 14, type: 'rug' },
        { name: 'Sách', points: 8, type: 'books' },
        { name: 'Khung ảnh', points: 10, type: 'pictureFrame' },
        { name: 'Đồng hồ', points: 16, type: 'clock' },
        { name: 'Bình hoa', points: 12, type: 'vase' },
        { name: 'Tượng trang trí', points: 20, type: 'sculpture' }
      ]
    };
    
    // Store reference globally for click handler
    window.currentGame = this;
    
    this.init();
  }
  
  async init() {
    try {
      await this.loadThreeJS();
      this.setupThreeJS();
      this.setupEventListeners();
      this.createRoom();
      this.loadCategory(this.currentCategory);
      this.updateUI();
      this.showWelcomeMessage();
      this.animate();
      
      // Mark viewport as loaded
      this.gameViewport.classList.add('loaded');
    } catch (error) {
      console.error('Failed to initialize 3D game:', error);
      this.showWebGLError();
    }
  }
  
  async loadThreeJS() {
    // Check if Three.js is already loaded
    if (typeof window.THREE !== 'undefined') {
      return;
    }
    
    // Create script element to load Three.js
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.innerHTML = `
        import * as THREE from 'https://esm.sh/three@0.160.0';
        import { OrbitControls } from 'https://esm.sh/three@0.160.0/addons/controls/OrbitControls.js';
        import { DragControls } from 'https://esm.sh/three@0.160.0/addons/controls/DragControls.js';
        
        window.THREE = THREE;
        window.OrbitControls = OrbitControls;
        window.DragControls = DragControls;
        
        // Signal that Three.js is loaded
        window.dispatchEvent(new CustomEvent('threeLoaded'));
      `;
      
      window.addEventListener('threeLoaded', () => {
        resolve();
      }, { once: true });
      
      script.onerror = () => {
        reject(new Error('Failed to load Three.js'));
      };
      
      document.head.appendChild(script);
    });
  }
  
  setupThreeJS() {
    // Clear existing content
    this.gameViewport.innerHTML = '';
    
    // Re-add controls
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'three-js-controls';
    controlsDiv.innerHTML = `
      <div>🖱️ Kéo để xoay camera</div>
      <div>🎯 Chọn vật phẩm và nhấp để đặt</div>
      <div>📱 Chạm và kéo trên mobile</div>
    `;
    this.gameViewport.appendChild(controlsDiv);
    
    // Scene
    this.scene = new window.THREE.Scene();
    this.scene.background = new window.THREE.Color(0x281c18);
    
    // Camera
    this.camera = new window.THREE.PerspectiveCamera(
      50, 
      this.gameViewport.offsetWidth / this.gameViewport.offsetHeight, 
      0.1, 
      1000
    );
    this.camera.position.set(8, 8, 8);
    this.camera.lookAt(0, 0, 0);
    
    // Renderer
    this.renderer = new window.THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.gameViewport.offsetWidth, this.gameViewport.offsetHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = window.THREE.PCFSoftShadowMap;
    this.gameViewport.appendChild(this.renderer.domElement);
    
    // Controls
    this.controls = new window.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 20;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.target.set(0, 1, 0);
    
    // Raycaster for mouse interaction
    this.raycaster = new window.THREE.Raycaster();
    this.mouse = new window.THREE.Vector2();
    
    // Lights
    this.setupLights();
    
    // Handle resize
    window.addEventListener('resize', () => this.onWindowResize());
  }
  
  setupLights() {
    // Ambient light
    const ambientLight = new window.THREE.AmbientLight(0xffeedd, 0.6);
    this.scene.add(ambientLight);
    
    // Main directional light
    const mainLight = new window.THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 10, 7.5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    this.scene.add(mainLight);
    
    // Fill light
    const fillLight = new window.THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);
  }
  
  createRoom() {
    // Floor
    const floorGeo = new window.THREE.BoxGeometry(this.ROOM_WIDTH, this.FLOOR_THICKNESS, this.ROOM_DEPTH);
    const floorMat = new window.THREE.MeshStandardMaterial({ 
      color: 0x8B4513, 
      roughness: 0.8, 
      metalness: 0.1 
    });
    const floor = new window.THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -this.FLOOR_THICKNESS / 2;
    floor.receiveShadow = true;
    floor.userData = { isFloor: true };
    this.scene.add(floor);
    
    // Walls
    this.createWalls();
  }
  
  createWalls() {
    const wallMat = new window.THREE.MeshStandardMaterial({ 
      color: 0xF5F5DC, 
      roughness: 0.9 
    });
    
    // Back wall
    const backWallGeo = new window.THREE.BoxGeometry(this.ROOM_WIDTH, this.ROOM_HEIGHT, this.WALL_THICKNESS);
    const backWall = new window.THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, this.ROOM_HEIGHT / 2, -this.ROOM_DEPTH / 2);
    backWall.receiveShadow = true;
    this.scene.add(backWall);
    
    // Left wall
    const leftWallGeo = new window.THREE.BoxGeometry(this.WALL_THICKNESS, this.ROOM_HEIGHT, this.ROOM_DEPTH);
    const leftWall = new window.THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(-this.ROOM_WIDTH / 2, this.ROOM_HEIGHT / 2, 0);
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);
    
    // Right wall
    const rightWall = new window.THREE.Mesh(leftWallGeo, wallMat);
    rightWall.position.set(this.ROOM_WIDTH / 2, this.ROOM_HEIGHT / 2, 0);
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);
  }
  
  // Item creation methods
  createBed() {
    const group = new window.THREE.Group();
    
    // Bed frame
    const frameGeo = new window.THREE.BoxGeometry(2, 0.4, 3.2);
    const frameMat = new window.THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 });
    const frame = new window.THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 0.2;
    frame.castShadow = true;
    frame.receiveShadow = true;
    group.add(frame);
    
    // Headboard
    const headboardGeo = new window.THREE.BoxGeometry(2, 1, 0.2);
    const headboard = new window.THREE.Mesh(headboardGeo, frameMat);
    headboard.position.set(0, 0.7, -1.5);
    headboard.castShadow = true;
    headboard.receiveShadow = true;
    group.add(headboard);
    
    // Mattress
    const mattressGeo = new window.THREE.BoxGeometry(1.9, 0.5, 3);
    const mattressMat = new window.THREE.MeshStandardMaterial({ color: 0xFFFAF0, roughness: 0.9 });
    const mattress = new window.THREE.Mesh(mattressGeo, mattressMat);
    mattress.position.y = 0.65;
    mattress.castShadow = true;
    mattress.receiveShadow = true;
    group.add(mattress);
    
    // Blanket
    const blanketGeo = new window.THREE.BoxGeometry(1.9, 0.2, 2.2);
    const blanketMat = new window.THREE.MeshStandardMaterial({ color: 0xFF7F50, roughness: 0.9 });
    const blanket = new window.THREE.Mesh(blanketGeo, blanketMat);
    blanket.position.set(0, 0.8, -0.3);
    blanket.castShadow = true;
    blanket.receiveShadow = true;
    group.add(blanket);
    
    return group;
  }
  
  createChair() {
    const group = new window.THREE.Group();
    const woodMat = new window.THREE.MeshStandardMaterial({ color: 0xA0522D, roughness: 0.7 });
    
    // Seat
    const seatGeo = new window.THREE.BoxGeometry(0.6, 0.1, 0.6);
    const seat = new window.THREE.Mesh(seatGeo, woodMat);
    seat.position.y = 0.5;
    seat.castShadow = true;
    seat.receiveShadow = true;
    group.add(seat);
    
    // Backrest
    const backGeo = new window.THREE.BoxGeometry(0.6, 0.7, 0.1);
    const back = new window.THREE.Mesh(backGeo, woodMat);
    back.position.set(0, 0.85, -0.25);
    back.castShadow = true;
    back.receiveShadow = true;
    group.add(back);
    
    // Legs
    const legGeo = new window.THREE.BoxGeometry(0.08, 0.45, 0.08);
    const legPositions = [
      [0.26, 0.225, 0.26], [-0.26, 0.225, 0.26],
      [0.26, 0.225, -0.26], [-0.26, 0.225, -0.26]
    ];
    
    legPositions.forEach(pos => {
      const leg = new window.THREE.Mesh(legGeo, woodMat);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      leg.receiveShadow = true;
      group.add(leg);
    });
    
    return group;
  }
  
  createSmallPlant() {
    const group = new window.THREE.Group();
    
    // Pot
    const potGeo = new window.THREE.CylinderGeometry(0.2, 0.16, 0.24, 12);
    const potMat = new window.THREE.MeshStandardMaterial({ color: 0xD2691E, roughness: 0.6 });
    const pot = new window.THREE.Mesh(potGeo, potMat);
    pot.position.y = 0.12;
    pot.castShadow = true;
    pot.receiveShadow = true;
    group.add(pot);
    
    // Soil
    const soilGeo = new window.THREE.CylinderGeometry(0.18, 0.14, 0.06, 12);
    const soilMat = new window.THREE.MeshStandardMaterial({ color: 0x4A4A4A, roughness: 0.9 });
    const soil = new window.THREE.Mesh(soilGeo, soilMat);
    soil.position.y = 0.21;
    soil.castShadow = true;
    soil.receiveShadow = true;
    group.add(soil);
    
    // Plant leaves
    const leafMat = new window.THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8 });
    for (let i = 0; i < 5; i++) {
      const leafGeo = new window.THREE.BoxGeometry(0.02, 0.3, 0.02);
      const leaf = new window.THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(
        (Math.random() - 0.5) * 0.1,
        0.24 + 0.15,
        (Math.random() - 0.5) * 0.1
      );
      leaf.rotation.set(
        Math.random() * 0.5 - 0.25,
        Math.random() * Math.PI * 2,
        Math.random() * 0.5 - 0.25
      );
      leaf.castShadow = true;
      leaf.receiveShadow = true;
      group.add(leaf);
    }
    
    return group;
  }
  
  createTableLamp() {
    const group = new window.THREE.Group();
    
    // Base
    const baseGeo = new window.THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
    const baseMat = new window.THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.6 });
    const base = new window.THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.05;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
    
    // Stem
    const stemGeo = new window.THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
    const stem = new window.THREE.Mesh(stemGeo, baseMat);
    stem.position.y = 0.35;
    stem.castShadow = true;
    stem.receiveShadow = true;
    group.add(stem);
    
    // Lampshade
    const shadeGeo = new window.THREE.CylinderGeometry(0.15, 0.3, 0.3, 16);
    const shadeMat = new window.THREE.MeshStandardMaterial({ 
      color: 0xFFD700, 
      emissive: 0x444400, 
      emissiveIntensity: 0.3,
      roughness: 0.5 
    });
    const shade = new window.THREE.Mesh(shadeGeo, shadeMat);
    shade.position.y = 0.75;
    shade.castShadow = true;
    shade.receiveShadow = true;
    group.add(shade);
    
    // Light
    const pointLight = new window.THREE.PointLight(0xffddaa, 2, 5, 1.5);
    pointLight.position.set(0, 0.75, 0);
    pointLight.castShadow = true;
    group.add(pointLight);
    
    return group;
  }
  
  createItemByType(type) {
    switch (type) {
      case 'bed': return this.createBed();
      case 'chair': return this.createChair();
      case 'nightstand': return this.createNightstand();
      case 'dresser': return this.createDresser();
      case 'smallPlant': return this.createSmallPlant();
      case 'mediumPlant': return this.createMediumPlant();
      case 'largePlant': return this.createLargePlant();
      case 'tableLamp': return this.createTableLamp();
      case 'floorLamp': return this.createFloorLamp();
      case 'painting': return this.createPainting();
      case 'rug': return this.createRug();
      case 'books': return this.createBooks();
      default: return this.createDefaultItem(type);
    }
  }
  
  createDefaultItem(type) {
    // Fallback for items not yet implemented
    const geometry = new window.THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new window.THREE.MeshStandardMaterial({ 
      color: Math.random() * 0xffffff,
      roughness: 0.7 
    });
    const mesh = new window.THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { type: type };
    return mesh;
  }
  
  // Additional item creation methods
  createNightstand() {
    const group = new window.THREE.Group();
    const woodMat = new window.THREE.MeshStandardMaterial({ color: 0x5C3317, roughness: 0.7 });
    
    const bodyGeo = new window.THREE.BoxGeometry(0.75, 0.6, 0.65);
    const body = new window.THREE.Mesh(bodyGeo, woodMat);
    body.position.y = 0.3;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    const topGeo = new window.THREE.BoxGeometry(0.8, 0.1, 0.7);
    const top = new window.THREE.Mesh(topGeo, woodMat);
    top.position.y = 0.65;
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);
    
    return group;
  }
  
  createDresser() {
    const group = new window.THREE.Group();
    const woodMat = new window.THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 });
    
    const bodyGeo = new window.THREE.BoxGeometry(1.5, 1, 0.6);
    const body = new window.THREE.Mesh(bodyGeo, woodMat);
    body.position.y = 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    return group;
  }
  
  createMediumPlant() {
    const plant = this.createSmallPlant();
    plant.scale.set(1.5, 1.5, 1.5);
    return plant;
  }
  
  createLargePlant() {
    const plant = this.createSmallPlant();
    plant.scale.set(2, 2, 2);
    return plant;
  }
  
  createFloorLamp() {
    const lamp = this.createTableLamp();
    lamp.scale.set(1, 2, 1);
    return lamp;
  }
  
  createPainting() {
    const group = new window.THREE.Group();
    
    const frameGeo = new window.THREE.BoxGeometry(0.5, 0.7, 0.03);
    const frameMat = new window.THREE.MeshStandardMaterial({ color: 0x422B0E, roughness: 0.6 });
    const frame = new window.THREE.Mesh(frameGeo, frameMat);
    frame.castShadow = true;
    frame.receiveShadow = true;
    group.add(frame);
    
    const imageGeo = new window.THREE.BoxGeometry(0.45, 0.65, 0.01);
    const imageMat = new window.THREE.MeshBasicMaterial({ color: 0xB0C4DE });
    const image = new window.THREE.Mesh(imageGeo, imageMat);
    image.position.z = 0.02;
    group.add(image);
    
    return group;
  }
  
  createRug() {
    const rugGeo = new window.THREE.BoxGeometry(2.5, 0.02, 1.5);
    const rugMat = new window.THREE.MeshStandardMaterial({ color: 0xFF7F50, roughness: 0.9 });
    const rug = new window.THREE.Mesh(rugGeo, rugMat);
    rug.position.y = 0.01;
    rug.castShadow = true;
    rug.receiveShadow = true;
    return rug;
  }
  
  createBooks() {
    const group = new window.THREE.Group();
    const colors = [0x4682B4, 0x556B2F, 0xB22222];
    
    let currentY = 0.01;
    for (let i = 0; i < 3; i++) {
      const bookHeight = 0.25;
      const bookGeo = new window.THREE.BoxGeometry(0.2, bookHeight, 0.04);
      const bookMat = new window.THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.8 });
      const book = new window.THREE.Mesh(bookGeo, bookMat);
      book.position.y = currentY + bookHeight / 2;
      book.rotation.y = (Math.random() - 0.5) * 0.2;
      book.castShadow = true;
      book.receiveShadow = true;
      group.add(book);
      currentY += bookHeight;
    }
    
    return group;
  }
  
  setupEventListeners() {
    // Category buttons
    const categoryBtns = this.container.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.currentTarget.dataset.category;
        this.switchCategory(category);
      });
    });
    
    // Action buttons
    const clearBtn = this.container.querySelector('#clear-room');
    const saveBtn = this.container.querySelector('#save-design');
    const randomBtn = this.container.querySelector('#random-decor');
    
    clearBtn?.addEventListener('click', () => this.clearRoom());
    saveBtn?.addEventListener('click', () => this.saveDesign());
    randomBtn?.addEventListener('click', () => this.randomDecoration());
    
    // Canvas click for item placement
    this.setupCanvasClickHandler();
  }
  
  setupCanvasClickHandler() {
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.addEventListener('click', (event) => {
        if (this.selectedItem) {
          this.handleCanvasClick(event);
        }
      });
    }
  }
  
  handleCanvasClick(event) {
    // Calculate mouse position in normalized device coordinates
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    
    if (intersects.length > 0) {
      const intersect = intersects[0];
      
      // Check if we clicked on the floor
      if (intersect.object.userData.isFloor) {
        this.placeItemAtPosition(this.selectedItem, intersect.point);
      }
    }
  }
  
  placeItemAtPosition(item, position) {
    if (this.placedItems.length >= this.maxItems) {
      this.showTooltip('Đã đạt giới hạn vật phẩm!');
      return;
    }
    
    const object3D = this.createItemByType(item.type);
    
    // Position the item at the clicked location
    object3D.position.set(position.x, 0, position.z);
    object3D.userData = { item: item, id: Date.now().toString() };
    
    this.scene.add(object3D);
    this.draggableObjects.push(object3D);
    
    this.placedItems.push({
      id: object3D.userData.id,
      item: item,
      object: object3D
    });
    
    // Update drag controls
    this.setupDragControls();
    
    this.score += item.points;
    this.updateUI();
    this.playSound('place');
    this.showSuccessMessage(`+${item.points} điểm!`);
    this.clearSelection();
  }
  
  setupDragControls() {
    if (this.dragControls) {
      this.dragControls.dispose();
    }
    
    if (this.draggableObjects.length > 0) {
      this.dragControls = new window.DragControls(this.draggableObjects, this.camera, this.renderer.domElement);
      
      this.dragControls.addEventListener('dragstart', (event) => {
        this.controls.enabled = false;
        if (event.object.material) {
          event.object.material.opacity = 0.7;
        }
      });
      
      this.dragControls.addEventListener('drag', (event) => {
        // Keep items within room bounds
        const halfWidth = this.ROOM_WIDTH / 2 - 0.5;
        const halfDepth = this.ROOM_DEPTH / 2 - 0.5;
        
        event.object.position.x = Math.max(-halfWidth, Math.min(halfWidth, event.object.position.x));
        event.object.position.z = Math.max(-halfDepth, Math.min(halfDepth, event.object.position.z));
        event.object.position.y = Math.max(0, event.object.position.y);
      });
      
      this.dragControls.addEventListener('dragend', (event) => {
        this.controls.enabled = true;
        if (event.object.material) {
          event.object.material.opacity = 1;
        }
      });
    }
  }
  
  switchCategory(category) {
    this.currentCategory = category;
    
    const categoryBtns = this.container.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    this.loadCategory(category);
  }
  
  loadCategory(category) {
    const items = this.decorationData[category] || [];
    this.itemsGrid.innerHTML = '';
    
    items.forEach((item, index) => {
      const itemBtn = document.createElement('button');
      itemBtn.className = 'item-btn';
      itemBtn.innerHTML = this.getItemIcon(item.type);
      itemBtn.title = `${item.name} (+${item.points} điểm)`;
      itemBtn.dataset.item = JSON.stringify(item);
      
      itemBtn.addEventListener('click', () => {
        this.selectItem(item, itemBtn);
      });
      
      this.itemsGrid.appendChild(itemBtn);
    });
  }
  
  getItemIcon(type) {
    const icons = {
      bed: '🛏️', chair: '🪑', nightstand: '🗄️', dresser: '👗',
      smallPlant: '🌱', mediumPlant: '🌿', largePlant: '🌳',
      tableLamp: '💡', floorLamp: '🕯️', painting: '🖼️',
      rug: '🟫', books: '📚'
    };
    return icons[type] || '📦';
  }
  
  selectItem(item, btnElement) {
    this.itemsGrid.querySelectorAll('.item-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    btnElement.classList.add('selected');
    this.selectedItem = item;
    
    this.showTooltip('Nhấp vào sàn phòng để đặt vật phẩm!');
  }
  
  placeItem(item) {
    if (this.placedItems.length >= this.maxItems) {
      this.showTooltip('Đã đạt giới hạn vật phẩm!');
      return;
    }
    
    const object3D = this.createItemByType(item.type);
    
    // Random position within room
    const x = (Math.random() - 0.5) * (this.ROOM_WIDTH - 2);
    const z = (Math.random() - 0.5) * (this.ROOM_DEPTH - 2);
    
    object3D.position.set(x, 0, z);
    object3D.userData = { item: item, id: Date.now().toString() };
    
    this.scene.add(object3D);
    this.draggableObjects.push(object3D);
    
    this.placedItems.push({
      id: object3D.userData.id,
      item: item,
      object: object3D
    });
    
    // Update drag controls
    this.setupDragControls();
    
    this.score += item.points;
    this.updateUI();
    this.playSound('place');
    this.showSuccessMessage(`+${item.points} điểm!`);
    this.clearSelection();
  }
  
  clearRoom() {
    if (this.placedItems.length === 0) {
      this.showTooltip('Phòng đã trống!');
      return;
    }
    
    if (confirm('Bạn có chắc muốn xóa tất cả vật phẩm?')) {
      this.placedItems.forEach(item => {
        this.scene.remove(item.object);
      });
      
      this.placedItems = [];
      this.draggableObjects = [];
      this.score = 0;
      
      this.setupDragControls();
      
      this.updateUI();
      this.playSound('clear');
      this.showSuccessMessage('Đã xóa tất cả!');
    }
  }
  
  saveDesign() {
    if (this.placedItems.length === 0) {
      this.showTooltip('Không có gì để lưu!');
      return;
    }
    
    const designData = {
      items: this.placedItems.map(item => ({
        item: item.item,
        position: {
          x: item.object.position.x,
          y: item.object.position.y,
          z: item.object.position.z
        },
        rotation: {
          x: item.object.rotation.x,
          y: item.object.rotation.y,
          z: item.object.rotation.z
        }
      })),
      score: this.score,
      timestamp: new Date().toISOString()
    };
    
    const savedDesigns = JSON.parse(localStorage.getItem('fancy3d_designs') || '[]');
    savedDesigns.push(designData);
    localStorage.setItem('fancy3d_designs', JSON.stringify(savedDesigns));
    
    this.showSuccessMessage('Thiết kế đã được lưu!');
    this.playSound('save');
  }
  
  randomDecoration() {
    this.clearRoom();
    
    setTimeout(() => {
      const categories = Object.keys(this.decorationData);
      const numItems = Math.floor(Math.random() * 8) + 5;
      
      for (let i = 0; i < numItems; i++) {
        setTimeout(() => {
          const randomCategory = categories[Math.floor(Math.random() * categories.length)];
          const items = this.decorationData[randomCategory];
          const randomItem = items[Math.floor(Math.random() * items.length)];
          
          this.placeItem(randomItem);
        }, i * 300);
      }
    }, 500);
    
    this.showSuccessMessage('Trang trí ngẫu nhiên!');
  }
  
  clearSelection() {
    this.itemsGrid.querySelectorAll('.item-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
    this.selectedItem = null;
  }
  
  updateUI() {
    this.scoreElement.textContent = this.score.toString();
    this.countElement.textContent = this.placedItems.length.toString();
    
    const progress = (this.placedItems.length / this.maxItems) * 100;
    if (progress >= 100) {
      this.showSuccessMessage('Phòng đã đầy! Bạn thật tuyệt vời!');
    }
  }
  
  showTooltip(message) {
    const existingTooltip = document.querySelector('.tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip show';
    tooltip.textContent = message;
    tooltip.style.left = '50%';
    tooltip.style.top = '20px';
    tooltip.style.transform = 'translateX(-50%)';
    
    this.container.appendChild(tooltip);
    
    setTimeout(() => {
      tooltip.classList.remove('show');
      setTimeout(() => tooltip.remove(), 300);
    }, 2000);
  }
  
  showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-animation';
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      successDiv.remove();
    }, 2000);
  }
  
  showWelcomeMessage() {
    setTimeout(() => {
      this.showTooltip('Chào mừng đến với game trang trí 3D! Chọn vật phẩm và nhấp vào sàn để đặt.');
    }, 1000);
  }
  
  showWebGLError() {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'webgl-not-supported';
    errorDiv.innerHTML = `
      <h3>Không hỗ trợ 3D</h3>
      <p>Trình duyệt của bạn không hỗ trợ WebGL hoặc đã bị tắt.</p>
      <p>Vui lòng cập nhật trình duyệt hoặc bật WebGL để chơi game.</p>
    `;
    this.gameViewport.appendChild(errorDiv);
  }
  
  playSound(type) {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      let frequency = 440;
      let duration = 0.1;
      
      switch (type) {
        case 'place':
          frequency = 800;
          duration = 0.15;
          break;
        case 'remove':
          frequency = 300;
          duration = 0.1;
          break;
        case 'clear':
          frequency = 200;
          duration = 0.3;
          break;
        case 'save':
          frequency = 1000;
          duration = 0.2;
          break;
      }
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.log('Audio not supported');
    }
  }
  
  onWindowResize() {
    if (this.camera && this.renderer) {
      this.camera.aspect = this.gameViewport.offsetWidth / this.gameViewport.offsetHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.gameViewport.offsetWidth, this.gameViewport.offsetHeight);
    }
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    if (this.controls) {
      this.controls.update();
    }
    
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const gameContainers = document.querySelectorAll('[id^="fancy-3d-game-"]');
  gameContainers.forEach(container => {
    new Fancy3DDecorationGame(container.id);
  });
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Fancy3DDecorationGame;
} 
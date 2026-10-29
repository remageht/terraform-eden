// ==========================================================================
// TERRAFORM: GENESIS OF EDEN — High-Performance 3D Planet Engine (Three.js)
// ==========================================================================

export class Planet3DRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.isSupported = typeof THREE !== "undefined";

    if (!this.isSupported) {
      console.warn("Three.js not found, 3D renderer disabled.");
      return;
    }

    this.habitability = 0;
    this.evolutionIndex = 0;
    this.weatherType = 0;

    // Interaction & Camera controls
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.rotationVelocity = { x: 0, y: 0.002 };
    this.targetRotation = { x: 0.2, y: 0 };
    this.cameraDistance = 4.8;
    this.targetCameraDistance = 4.8;

    // Callbacks
    this.onPlanetClick = null;
    this.onCometClick = null;

    // Raycasting
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // 3D Visual Objects
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.planetMesh = null;
    this.cloudMesh = null;
    this.atmosphereMesh = null;
    this.moonMesh = null;
    this.starfield = null;
    this.dnaHelixGroup = null;
    this.activeCometMesh = null;
    this.surfaceRipples = [];

    // Texture canvases
    this.planetCanvas = document.createElement("canvas");
    this.planetCanvas.width = 1024;
    this.planetCanvas.height = 512;
    this.planetCtx = this.planetCanvas.getContext("2d");
    this.planetTexture = null;

    this.cloudCanvas = document.createElement("canvas");
    this.cloudCanvas.width = 512;
    this.cloudCanvas.height = 256;
    this.cloudCtx = this.cloudCanvas.getContext("2d");
    this.cloudTexture = null;

    this.init();
  }

  init() {
    if (!this.isSupported) return;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, this.cameraDistance);

    // WebGL Renderer
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
      this.renderer.setSize(width, height, false);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;
    } catch (e) {
      console.error("WebGL initialization failed:", e);
      this.isSupported = false;
      return;
    }

    this.setupLighting();
    this.setupStarfield();
    this.setupPlanet();
    this.setupAtmosphere();
    this.setupClouds();
    this.setupMoon();
    this.setupDNAHelix();
    this.bindEvents();

    this.updateTextures();
  }

  setupLighting() {
    // Ambient celestial light
    const ambientLight = new THREE.AmbientLight(0x18243b, 1.2);
    this.scene.add(ambientLight);

    // Primary Directional Sunlight
    this.sunLight = new THREE.DirectionalLight(0xfff5e6, 3.2);
    this.sunLight.position.set(6, 3, 5);
    this.scene.add(this.sunLight);

    // Subtle blue rim light for dramatic space edge
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    rimLight.position.set(-6, -2, -4);
    this.scene.add(rimLight);
  }

  setupStarfield() {
    const starCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const r = 50 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const colorVariance = Math.random();
      if (colorVariance > 0.8) {
        colors[i * 3] = 0.6; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 1.0; // Cyan
      } else if (colorVariance > 0.6) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 0.6; // Amber
      } else {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 1.0; // White
      }
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });

    this.starfield = new THREE.Points(geometry, material);
    this.scene.add(this.starfield);
  }

  setupPlanet() {
    this.planetGeometry = new THREE.SphereGeometry(1.6, 64, 64);
    this.planetTexture = new THREE.CanvasTexture(this.planetCanvas);
    this.planetTexture.wrapS = THREE.RepeatWrapping;
    this.planetTexture.wrapT = THREE.ClampToEdgeWrapping;

    this.planetMaterial = new THREE.MeshStandardMaterial({
      map: this.planetTexture,
      roughness: 0.65,
      metalness: 0.15
    });

    this.planetMesh = new THREE.Mesh(this.planetGeometry, this.planetMaterial);
    this.planetMesh.rotation.x = this.targetRotation.x;
    this.scene.add(this.planetMesh);
  }

  setupAtmosphere() {
    // Outer atmospheric glow shell
    const atmosphereGeo = new THREE.SphereGeometry(1.67, 48, 48);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });

    this.atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    this.scene.add(this.atmosphereMesh);
  }

  setupClouds() {
    const cloudGeo = new THREE.SphereGeometry(1.63, 48, 48);
    this.cloudTexture = new THREE.CanvasTexture(this.cloudCanvas);
    this.cloudTexture.wrapS = THREE.RepeatWrapping;

    this.cloudMaterial = new THREE.MeshStandardMaterial({
      map: this.cloudTexture,
      transparent: true,
      opacity: 0.45,
      blending: THREE.NormalBlending
    });

    this.cloudMesh = new THREE.Mesh(cloudGeo, this.cloudMaterial);
    this.scene.add(this.cloudMesh);
  }

  setupMoon() {
    const moonGeo = new THREE.SphereGeometry(0.32, 24, 24);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xc8d1dc,
      roughness: 0.9,
      metalness: 0.05
    });

    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonAngle = 0;
    this.scene.add(this.moonMesh);
  }

  setupDNAHelix() {
    this.dnaHelixGroup = new THREE.Group();
    const sphereGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const mat1 = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const mat2 = new THREE.MeshBasicMaterial({ color: 0xc084fc });

    const totalSteps = 28;
    for (let i = 0; i < totalSteps; i++) {
      const t = (i / totalSteps) * Math.PI * 4;
      const y = (i / totalSteps) * 2.2 - 1.1;
      const x1 = Math.cos(t) * 0.35;
      const z1 = Math.sin(t) * 0.35;
      const x2 = Math.cos(t + Math.PI) * 0.35;
      const z2 = Math.sin(t + Math.PI) * 0.35;

      const p1 = new THREE.Mesh(sphereGeo, mat1);
      p1.position.set(x1, y, z1);
      this.dnaHelixGroup.add(p1);

      const p2 = new THREE.Mesh(sphereGeo, mat2);
      p2.position.set(x2, y, z2);
      this.dnaHelixGroup.add(p2);
    }

    this.dnaHelixGroup.position.set(2.4, 0.4, 0.5);
    this.scene.add(this.dnaHelixGroup);
  }

  // Procedurally paints the planet surface according to habitability and epoch
  updateTextures() {
    if (!this.planetCtx) return;

    const ctx = this.planetCtx;
    const w = this.planetCanvas.width;
    const h = this.planetCanvas.height;
    const hRatio = Math.max(0, Math.min(1, this.habitability));

    // Base primordial basalt rock
    ctx.fillStyle = "#111622";
    ctx.fillRect(0, 0, w, h);

    // 1. Primitive lava / heat cracks during 0% habitability
    if (hRatio < 0.25) {
      const lavaIntensity = 1.0 - (hRatio / 0.25);
      ctx.strokeStyle = `rgba(239, 68, 68, ${lavaIntensity * 0.7})`;
      ctx.lineWidth = 3;
      for (let i = 0; i < 18; i++) {
        ctx.beginPath();
        let lx = (i * 57) % w;
        let ly = (i * 31) % h;
        ctx.moveTo(lx, ly);
        for (let j = 0; j < 5; j++) {
          lx += (Math.sin(i + j) * 40);
          ly += (Math.cos(i * j) * 25);
          ctx.lineTo(lx % w, ly % h);
        }
        ctx.stroke();
      }
    }

    // 2. Continents & Terrain shapes (spherical projection bands)
    const continentCount = 6;
    for (let c = 0; c < continentCount; c++) {
      const cx = (c * (w / continentCount) + 70) % w;
      const cy = h * 0.3 + (c % 3) * (h * 0.2);
      const rad = 70 + (c % 4) * 35;

      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, rad);
      if (hRatio > 0.45) {
        // Lush green continent
        grad.addColorStop(0, "#10b981");
        grad.addColorStop(0.6, "#059669");
        grad.addColorStop(0.85, "#047857");
        grad.addColorStop(1, "transparent");
      } else if (hRatio > 0.15) {
        // Moss & early dry land
        grad.addColorStop(0, "#4d7c0f");
        grad.addColorStop(0.6, "#365314");
        grad.addColorStop(1, "transparent");
      } else {
        // Ash rock
        grad.addColorStop(0, "#27272a");
        grad.addColorStop(0.7, "#1c1917");
        grad.addColorStop(1, "transparent");
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Azure Oceans (filling the planet as habitability rises)
    if (hRatio > 0.1) {
      const waterAlpha = Math.min(0.85, (hRatio - 0.1) * 2.2);
      ctx.fillStyle = `rgba(6, 182, 212, ${waterAlpha * 0.5})`;
      ctx.fillRect(0, 0, w, h);

      // Deep ocean bands
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
      oceanGrad.addColorStop(0, "transparent");
      oceanGrad.addColorStop(0.35, `rgba(2, 132, 199, ${waterAlpha * 0.4})`);
      oceanGrad.addColorStop(0.65, `rgba(3, 105, 161, ${waterAlpha * 0.4})`);
      oceanGrad.addColorStop(1, "transparent");
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // 4. Polar ice caps
    ctx.fillStyle = `rgba(241, 245, 249, ${0.4 + hRatio * 0.45})`;
    ctx.fillRect(0, 0, w, 28);
    ctx.fillRect(0, h - 28, w, 28);

    // 5. Singularity Quantum Ring / Night lights
    if (this.evolutionIndex >= 7 || hRatio >= 0.95) {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, 90, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    this.planetTexture.needsUpdate = true;

    // Update Cloud texture
    this.updateCloudTexture();
  }

  updateCloudTexture() {
    if (!this.cloudCtx) return;
    const ctx = this.cloudCtx;
    const w = this.cloudCanvas.width;
    const h = this.cloudCanvas.height;
    ctx.clearRect(0, 0, w, h);

    if (this.habitability > 0.2) {
      const cloudAlpha = Math.min(0.5, (this.habitability - 0.2) * 0.8);
      ctx.fillStyle = `rgba(255, 255, 255, ${cloudAlpha})`;

      for (let i = 0; i < 22; i++) {
        const x = (i * 27) % w;
        const y = 30 + ((i * 37) % (h - 60));
        const rw = 40 + (i % 5) * 16;
        const rh = 12 + (i % 3) * 6;

        ctx.beginPath();
        ctx.ellipse(x, y, rw, rh, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    this.cloudTexture.needsUpdate = true;
  }

  setHabitability(val) {
    if (Math.abs(this.habitability - val) > 0.02) {
      this.habitability = val;
      this.updateTextures();
    }
  }

  setEvolutionStage(index) {
    if (this.evolutionIndex !== index) {
      this.evolutionIndex = index;
      if (this.dnaHelixGroup) {
        this.dnaHelixGroup.visible = (index <= 2);
      }
      this.updateTextures();
    }
  }

  setWeather(isSandstorm, rainIntensity) {
    if (this.cloudMaterial) {
      if (isSandstorm > 0) {
        this.cloudMaterial.color.setHex(0xd97706); // Sandstorm amber
        this.cloudMaterial.opacity = 0.75;
      } else {
        this.cloudMaterial.color.setHex(0xffffff);
        this.cloudMaterial.opacity = 0.45;
      }
    }
  }

  spawn3DComet(callback) {
    if (this.activeCometMesh) return;

    const group = new THREE.Group();
    const headGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const head = new THREE.Mesh(headGeo, headMat);
    group.add(head);

    // Glowing tail
    const tailGeo = new THREE.ConeGeometry(0.16, 0.8, 12);
    tailGeo.rotateX(Math.PI * 0.5);
    const tailMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.z = -0.4;
    group.add(tail);

    group.position.set(-5, 2.5, 1);
    this.scene.add(group);
    this.activeCometMesh = {
      mesh: group,
      speedX: 0.05,
      speedY: -0.015,
      callback
    };
  }

  createSurfaceRipple(point) {
    const ringGeo = new THREE.RingGeometry(0.02, 0.05, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(point).multiplyScalar(1.01);
    ring.lookAt(point.clone().multiplyScalar(2));
    this.scene.add(ring);

    this.surfaceRipples.push({
      mesh: ring,
      scale: 1,
      opacity: 0.9
    });
  }

  bindEvents() {
    this.canvas.addEventListener("pointerdown", (e) => this.onPointerDown(e));
    window.addEventListener("pointermove", (e) => this.onPointerMove(e));
    window.addEventListener("pointerup", (e) => this.onPointerUp(e));
    this.canvas.addEventListener("wheel", (e) => this.onWheel(e), { passive: true });
    window.addEventListener("resize", () => this.onResize());
  }

  onPointerDown(e) {
    this.isDragging = true;
    this.dragMoved = false;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
    this.canvas.classList.add("grabbing");
  }

  onPointerMove(e) {
    if (!this.isDragging) return;
    const deltaX = e.clientX - this.previousMousePosition.x;
    const deltaY = e.clientY - this.previousMousePosition.y;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      this.dragMoved = true;
    }

    this.targetRotation.y += deltaX * 0.006;
    this.targetRotation.x = Math.max(-0.8, Math.min(0.8, this.targetRotation.x + deltaY * 0.006));

    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }

  onPointerUp(e) {
    this.isDragging = false;
    this.canvas.classList.remove("grabbing");

    // If it was a quick click rather than a drag, perform 3D raycast
    if (!this.dragMoved) {
      this.handle3DClick(e);
    }
  }

  onWheel(e) {
    this.targetCameraDistance = Math.max(3.2, Math.min(7.5, this.targetCameraDistance + e.deltaY * 0.003));
  }

  handle3DClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 1. Check Comet click
    if (this.activeCometMesh) {
      const cometHits = this.raycaster.intersectObject(this.activeCometMesh.mesh, true);
      if (cometHits.length > 0) {
        if (this.activeCometMesh.callback) this.activeCometMesh.callback();
        this.scene.remove(this.activeCometMesh.mesh);
        this.activeCometMesh = null;
        return;
      }
    }

    // 2. Check Planet click
    if (this.planetMesh) {
      const hits = this.raycaster.intersectObject(this.planetMesh);
      if (hits.length > 0) {
        const hit = hits[0];
        this.createSurfaceRipple(hit.point);

        // Biome categorization by coordinate & habitability
        let biome = "earth";
        if (hit.point.y > 1.2 || hit.point.y < -1.2) {
          biome = "sky"; // Poles / upper atmosphere
        } else if (this.habitability > 0.25 && Math.sin(hit.point.x * 3) > 0.2) {
          biome = "water";
        }

        if (this.onPlanetClick) {
          this.onPlanetClick({
            clientX: e.clientX,
            clientY: e.clientY,
            biome,
            point: hit.point
          });
        }
      }
    }
  }

  onResize() {
    if (!this.renderer || !this.camera) return;
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  update(dt = 0.016) {
    if (!this.isSupported || !this.renderer) return;

    // Smooth camera zoom
    this.cameraDistance += (this.targetCameraDistance - this.cameraDistance) * 0.1;
    this.camera.position.z = this.cameraDistance;

    // Smooth inertia planet rotation
    if (!this.isDragging) {
      this.targetRotation.y += this.rotationVelocity.y;
    }

    if (this.planetMesh) {
      this.planetMesh.rotation.y += (this.targetRotation.y - this.planetMesh.rotation.y) * 0.12;
      this.planetMesh.rotation.x += (this.targetRotation.x - this.planetMesh.rotation.x) * 0.12;
    }

    // Clouds rotate with slightly different speed for realism
    if (this.cloudMesh) {
      this.cloudMesh.rotation.y = this.planetMesh.rotation.y * 1.15;
      this.cloudMesh.rotation.x = this.planetMesh.rotation.x;
    }

    // Moon orbit
    if (this.moonMesh) {
      this.moonAngle += 0.008;
      const moonDist = 3.6;
      this.moonMesh.position.set(
        Math.cos(this.moonAngle) * moonDist,
        Math.sin(this.moonAngle * 0.6) * 0.8,
        Math.sin(this.moonAngle) * moonDist
      );
    }

    // Dynamic Day/Night sunlight orbit creating moving planetary terminators
    if (this.sunLight) {
      if (typeof this.sunAngle === "undefined") this.sunAngle = 0.5;
      this.sunAngle += 0.001;
      const sunDist = 7.5;
      this.sunLight.position.set(
        Math.cos(this.sunAngle) * sunDist,
        3.0 + Math.sin(this.sunAngle * 0.5) * 1.5,
        Math.sin(this.sunAngle) * sunDist
      );
    }

    // DNA helix spin
    if (this.dnaHelixGroup && this.dnaHelixGroup.visible) {
      this.dnaHelixGroup.rotation.y += 0.02;
    }

    // Starfield gentle parallax drift
    if (this.starfield) {
      this.starfield.rotation.y += 0.0003;
    }

    // Active Comet flight
    if (this.activeCometMesh) {
      const c = this.activeCometMesh;
      c.mesh.position.x += c.speedX;
      c.mesh.position.y += c.speedY;

      if (c.mesh.position.x > 6) {
        this.scene.remove(c.mesh);
        this.activeCometMesh = null;
      }
    }

    // Surface ripples expansion & decay
    for (let i = this.surfaceRipples.length - 1; i >= 0; i--) {
      const r = this.surfaceRipples[i];
      r.scale += 0.06;
      r.opacity -= 0.04;
      r.mesh.scale.set(r.scale, r.scale, r.scale);
      r.mesh.material.opacity = Math.max(0, r.opacity);

      if (r.opacity <= 0) {
        this.scene.remove(r.mesh);
        this.surfaceRipples.splice(i, 1);
      }
    }
  }

  render() {
    if (!this.isSupported || !this.renderer || !this.scene || !this.camera) return;
    this.renderer.render(this.scene, this.camera);
  }
}

// WebRTC Peer-to-Peer Networking via PeerJS (No custom backend needed)
export class NetworkManager {
  constructor() {
    this.peer = null;
    this.conn = null;
    this.isMultiplayer = false;
    this.mode = null; // 'coop' | 'pvp'
    this.isHost = false;
    this.roomCode = null;
    this.remoteHabitability = 0.0;
    this.remoteEnergy = 0;
    this.remoteClicks = 0;
    this.lastRemoteClickTime = 0;

    // Callbacks
    this.onConnected = null;
    this.onDisconnected = null;
    this.onRemoteClick = null;
    this.onRemoteStateSync = null;
    this.onCataclysmReceived = null;
    this.onSyncCombo = null;
    this.onStatusChange = null;
  }

  // Format short room code into unique peer id
  formatPeerId(code) {
    const clean = code.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    return `eden-room-${clean}`;
  }

  // Host creates a room
  createRoom(mode, customCode = null) {
    return new Promise((resolve, reject) => {
      this.mode = mode;
      this.isHost = true;
      const rawCode = customCode || Math.random().toString(36).substring(2, 7);
      this.roomCode = rawCode;
      const peerId = this.formatPeerId(rawCode);

      if (typeof window.Peer === "undefined") {
        return reject(new Error("Библиотека PeerJS не загружена. Проверьте подключение к интернету."));
      }

      this.peer = new window.Peer(peerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" }
          ]
        }
      });

      this.peer.on("open", (id) => {
        if (this.onStatusChange) this.onStatusChange(`Комната создана! Код: ${this.roomCode}. Ожидание игрока...`);
        resolve(this.roomCode);
      });

      this.peer.on("connection", (conn) => {
        this.setupConnection(conn);
      });

      this.peer.on("error", (err) => {
        console.error("PeerJS error:", err);
        if (this.onStatusChange) this.onStatusChange(`Ошибка сети: ${err.type}`);
        reject(err);
      });
    });
  }

  // Guest joins an existing room
  joinRoom(roomCode) {
    return new Promise((resolve, reject) => {
      this.isHost = false;
      this.roomCode = roomCode.trim().toLowerCase();
      const hostPeerId = this.formatPeerId(this.roomCode);

      if (typeof window.Peer === "undefined") {
        return reject(new Error("Библиотека PeerJS не загружена. Проверьте подключение к интернету."));
      }

      this.peer = new window.Peer(null, {
        debug: 1,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" }
          ]
        }
      });

      this.peer.on("open", () => {
        if (this.onStatusChange) this.onStatusChange(`Подключение к комнате ${this.roomCode}...`);
        const conn = this.peer.connect(hostPeerId, { reliable: true });
        this.setupConnection(conn);

        conn.on("open", () => {
          resolve(this.roomCode);
        });
      });

      this.peer.on("error", (err) => {
        console.error("PeerJS error:", err);
        if (this.onStatusChange) this.onStatusChange(`Ошибка подключения к комнате ${this.roomCode}`);
        reject(err);
      });
    });
  }

  // Setup data channel listeners
  setupConnection(conn) {
    this.conn = conn;

    conn.on("open", () => {
      this.isMultiplayer = true;
      if (this.onStatusChange) this.onStatusChange(`Связь установлена! Режим: ${this.mode === "coop" ? "Кооператив" : "PvP Дуэль"}`);

      // Handshake
      if (this.isHost) {
        this.send("HANDSHAKE", { mode: this.mode, isHost: true });
      }

      if (this.onConnected) this.onConnected({ mode: this.mode, isHost: this.isHost });
    });

    conn.on("data", (data) => {
      this.handleIncomingData(data);
    });

    conn.on("close", () => {
      this.isMultiplayer = false;
      if (this.onStatusChange) this.onStatusChange("Игрок отключился.");
      if (this.onDisconnected) this.onDisconnected();
    });

    conn.on("error", (err) => {
      console.warn("Connection data error", err);
    });
  }

  // Process incoming messages
  handleIncomingData(packet) {
    if (!packet || !packet.type) return;

    switch (packet.type) {
      case "HANDSHAKE":
        this.mode = packet.payload.mode;
        if (this.onConnected) this.onConnected({ mode: this.mode, isHost: this.isHost });
        break;

      case "CLICK":
        this.lastRemoteClickTime = Date.now();
        if (this.onRemoteClick) this.onRemoteClick(packet.payload);
        break;

      case "STATE_SYNC":
        this.remoteHabitability = packet.payload.habitability || 0;
        this.remoteEnergy = packet.payload.energy || 0;
        if (this.onRemoteStateSync) this.onRemoteStateSync(packet.payload);
        break;

      case "CATACLYSM":
        if (this.onCataclysmReceived) this.onCataclysmReceived(packet.payload.type);
        break;

      case "SYNC_COMBO":
        if (this.onSyncCombo) this.onSyncCombo(packet.payload);
        break;
    }
  }

  // Send packet across WebRTC
  send(type, payload = {}) {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send({ type, payload });
      } catch (e) {
        console.warn("Error sending packet", e);
      }
    }
  }

  // Send player click event
  broadcastClick(xRatio, yRatio, gained, isCrit) {
    this.send("CLICK", { xRatio, yRatio, gained, isCrit });
  }

  // Send local state progress
  broadcastState(state) {
    this.send("STATE_SYNC", {
      energy: state.energy,
      totalEnergy: state.totalEnergyEarned,
      habitability: state.habitability,
      upgrades: state.upgrades
    });
  }

  // Send PvP attack to opponent
  launchCataclysm(cataclysmId) {
    this.send("CATACLYSM", { type: cataclysmId });
  }

  // Disconnect cleanly
  disconnect() {
    this.isMultiplayer = false;
    if (this.conn) {
      this.conn.close();
      this.conn = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.mode = null;
    this.roomCode = null;
    if (this.onStatusChange) this.onStatusChange("Мультиплеер отключен.");
  }
}

export const network = new NetworkManager();

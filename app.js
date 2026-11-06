(() => {
  "use strict";

  const SERVER_ADDRESS = "mauritania-replies.tun.ply.gg";
  const PUBLIC_STATUS_HOST = "mauritania-replies.tun.ply.gg";
  const STATUS_REFRESH_MS = 10_000;
  const IS_GITHUB_PAGES = location.hostname.endsWith(".github.io");
  const STATUS_ENDPOINTS = IS_GITHUB_PAGES
    ? [
        `https://api.mcstatus.io/v2/status/java/${PUBLIC_STATUS_HOST}`,
        `https://api.mcsrvstat.us/3/${PUBLIC_STATUS_HOST}`,
        `https://mcapi.us/server/status?ip=${PUBLIC_STATUS_HOST}&port=25565`
      ]
    : ["/api/status"];
  const byId = (id) => document.getElementById(id);

  const ui = {
    toast: byId("toast"),
    statusPill: byId("server-status"),
    statusText: byId("status-text"),
    liveStrip: byId("live-strip"),
    statusDetail: byId("status-detail"),
    lastUpdate: byId("last-update"),
    heroOnline: byId("hero-online"),
    playerCount: byId("player-count"),
    serverTps: byId("server-tps"),
    serverMspt: byId("server-mspt"),
    serverState: byId("server-state"),
    backupAge: byId("backup-age"),
    backupStat: byId("backup-stat"),
    offsiteBackupState: byId("offsite-backup-state"),
    offsiteBackupStat: byId("offsite-backup-stat"),
    telemetry: byId("telemetry"),
    perfChart: byId("perf-chart"),
    chartTps: byId("chart-tps"),
    chartMspt: byId("chart-mspt"),
    chartPlayers: byId("chart-players"),
    systemLoad: byId("system-load"),
    systemMemory: byId("system-memory"),
    systemDisk: byId("system-disk"),
    hostDisk: byId("host-disk")
  };

  let toastTimer;
  let statusTimer;
  let statusRequest;

  const showToast = (message) => {
    if (!ui.toast) return;
    ui.toast.textContent = message;
    ui.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ui.toast.classList.remove("show"), 1800);
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(SERVER_ADDRESS);
      showToast("服务器地址已复制");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = SERVER_ADDRESS;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      showToast("服务器地址已复制");
    }
  };

  byId("copy-ip")?.addEventListener("click", copyAddress);
  byId("copy-ip-bottom")?.addEventListener("click", copyAddress);

  const revealObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.12 })
    : null;

  document.querySelectorAll(".reveal").forEach((node) => {
    if (revealObserver) {
      revealObserver.observe(node);
    } else {
      node.classList.add("visible");
    }
  });

  const canvas = byId("particles");
  const context = canvas?.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let particles = [];
  let viewportWidth = 0;
  let viewportHeight = 0;
  let particleFrame = 0;
  let lastParticleTime = 0;

  const resizeParticles = () => {
    if (!canvas || !context) return;
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    const compact = viewportWidth <= 720;
    const ratio = Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2);
    canvas.width = viewportWidth * ratio;
    canvas.height = viewportHeight * ratio;
    canvas.style.width = `${viewportWidth}px`;
    canvas.style.height = `${viewportHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const particleLimit = compact ? 24 : 52;
    const particleSpacing = compact ? 24 : 22;
    particles = Array.from(
      { length: Math.min(particleLimit, Math.floor(viewportWidth / particleSpacing)) },
      () => ({
        x: Math.random() * viewportWidth,
        y: Math.random() * viewportHeight,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.26 + 0.08,
        alpha: Math.random() * 0.42 + 0.08,
        gold: Math.random() > 0.83
      })
    );
  };

  const drawParticles = () => {
    particleFrame = 0;
    if (!context) return;
    if (document.visibilityState === "hidden") return;
    const now = performance.now();
    const delta = lastParticleTime
      ? Math.min((now - lastParticleTime) / 16.667, 2)
      : 1;
    lastParticleTime = now;
    context.clearRect(0, 0, viewportWidth, viewportHeight);
    particles.forEach((particle) => {
      particle.y -= particle.speed * delta;
      particle.x += Math.sin((particle.y + particle.size) * 0.01) * 0.08 * delta;
      if (particle.y < -5) {
        particle.y = viewportHeight + 5;
        particle.x = Math.random() * viewportWidth;
      }
      context.fillStyle = particle.gold
        ? `rgba(248,206,107,${particle.alpha})`
        : `rgba(67,245,161,${particle.alpha})`;
      context.fillRect(particle.x, particle.y, particle.size, particle.size);
    });
    if (!reducedMotion && document.visibilityState === "visible") {
      particleFrame = requestAnimationFrame(drawParticles);
    }
  };

  const startParticles = () => {
    if (reducedMotion || particleFrame || document.visibilityState === "hidden") return;
    lastParticleTime = 0;
    particleFrame = requestAnimationFrame(drawParticles);
  };

  const stopParticles = () => {
    if (!particleFrame) return;
    cancelAnimationFrame(particleFrame);
    particleFrame = 0;
  };

  resizeParticles();
  if (reducedMotion) {
    drawParticles();
  } else {
    startParticles();
  }
  window.addEventListener("resize", () => {
    resizeParticles();
    if (reducedMotion) drawParticles();
  }, { passive: true });

  const toneFor = (data) => {
    if (!data.online) return "offline";
    const state = String(data.state || "").toUpperCase();
    const warningStates = ["ATTACK", "DDOS", "SUSPECTED", "EMERGENCY", "LAG"];
    return data.attackSuspected || warningStates.includes(state)
      ? "warning"
      : "online";
  };

  const setTone = (element, tone) => {
    if (!element) return;
    element.dataset.state = tone;
  };

  const setValueTone = (element, tone) => {
    if (!element) return;
    element.classList.remove("is-loading", "is-offline", "is-warning");
    if (tone === "offline") element.classList.add("is-offline");
    if (tone === "warning") element.classList.add("is-warning");
    if (tone === "loading") element.classList.add("is-loading");
  };

  const updateLastRefresh = (date = new Date(), latency = null) => {
    if (!ui.lastUpdate) return;
    const clock = date.toLocaleTimeString("zh-CN", {
      hour12: false
    });
    ui.lastUpdate.textContent = latency === null
      ? `${clock} 自动更新`
      : `${clock} · 响应 ${Math.round(latency)} ms`;
  };

  const showLoading = () => {
    setTone(ui.statusPill, "loading");
    setTone(ui.liveStrip, "loading");
    if (ui.statusText) ui.statusText.textContent = "检测服务器";
    if (ui.statusDetail) ui.statusDetail.textContent = "正在连接服务器状态接口……";
    setValueTone(ui.serverState, "loading");
    setValueTone(ui.serverTps, "loading");
    setValueTone(ui.serverMspt, "loading");
    setValueTone(ui.playerCount, "loading");
    if (ui.serverState) ui.serverState.textContent = "检测中";
    if (ui.serverTps) ui.serverTps.textContent = "--";
    if (ui.serverMspt) ui.serverMspt.textContent = "--";
    if (ui.backupAge) {
      ui.backupAge.textContent = "--";
      ui.backupAge.title = "正在读取最近备份";
    }
    if (ui.offsiteBackupState) {
      ui.offsiteBackupState.textContent = "--";
      ui.offsiteBackupState.title = "正在读取异地独立副本";
    }
    if (ui.playerCount) ui.playerCount.textContent = "-- / 500";
    if (ui.heroOnline) ui.heroOnline.textContent = "--";
  };

  const applyStatus = (data) => {
    const tone = toneFor(data);
    const online = Math.max(0, Number(data.onlinePlayers) || 0);
    const maximum = Math.max(1, Number(data.maxPlayers) || 500);
    const tps = data.tps === null || data.tps === undefined || data.tps === ""
      ? NaN
      : Number(data.tps);
    const mspt = data.mspt === null || data.mspt === undefined || data.mspt === ""
      ? NaN
      : Number(data.mspt);
    const formattedTps = Number.isFinite(tps) ? tps.toFixed(1) : "--";
    const formattedMspt = Number.isFinite(mspt) ? mspt.toFixed(1) : "--";

    setTone(ui.statusPill, tone);
    setTone(ui.liveStrip, tone);
    setValueTone(ui.playerCount, tone);
    setValueTone(ui.serverTps, tone);
    setValueTone(ui.serverMspt, tone);
    setValueTone(ui.serverState, tone);

    if (ui.statusText) {
      ui.statusText.textContent = tone === "offline"
        ? "SERVER OFFLINE"
        : tone === "warning" ? "SERVER WARNING" : "SERVER ONLINE";
    }

    if (ui.playerCount) ui.playerCount.textContent = `${online} / ${maximum}`;
    if (ui.heroOnline) ui.heroOnline.textContent = String(online);
    if (ui.serverTps) ui.serverTps.textContent = tone === "offline" ? "--" : formattedTps;
    if (ui.serverMspt) ui.serverMspt.textContent = tone === "offline" ? "--" : formattedMspt;
    if (ui.serverState) {
      ui.serverState.textContent = tone === "offline"
        ? "未开放"
        : tone === "warning" ? "告警中" : "在线";
    }

    if (ui.statusDetail) {
      if (tone === "offline") {
        ui.statusDetail.textContent = "服务器当前未开放 · 启动服务端后本页会自动刷新";
      } else if (tone === "warning") {
        ui.statusDetail.textContent = `监控发现卡顿或异常网络 · ${online} 人在线 · TPS ${formattedTps} · MSPT ${formattedMspt}`;
      } else {
        ui.statusDetail.textContent = `运行正常 · ${online} 人在线 · TPS ${formattedTps} · MSPT ${formattedMspt} · 最大 ${maximum} 人`;
      }
    }
    if (ui.hostDisk) {
      const hostFreeGb = Number(data.offsiteBackup?.hostDiskFreeBytes)
        / 1024 / 1024 / 1024;
      ui.hostDisk.textContent = Number.isFinite(hostFreeGb) && hostFreeGb >= 0
        ? `${hostFreeGb.toFixed(1)} GB`
        : "--";
    }

    const hostSystem = data.system;
    if (ui.systemLoad) {
      ui.systemLoad.textContent = Number.isFinite(Number(hostSystem?.load1))
        ? Number(hostSystem.load1).toFixed(2)
        : "--";
    }
    if (ui.systemMemory) {
      ui.systemMemory.textContent = Number.isFinite(Number(hostSystem?.memoryUsedPercent))
        ? `${Number(hostSystem.memoryUsedPercent).toFixed(1)}%`
        : "--";
    }
    if (ui.systemDisk) {
      const freeGb = Number(hostSystem?.diskFreeBytes) / 1024 / 1024 / 1024;
      ui.systemDisk.textContent = Number.isFinite(freeGb) && freeGb >= 0
        ? `${freeGb.toFixed(1)} GB`
        : "--";
    }

    document.documentElement.dataset.serverState = tone;
    updateLastRefresh(
      data.checkedAt ? new Date(data.checkedAt) : new Date(),
      data.requestLatency
    );

    if (ui.backupAge) {
      ui.backupAge.classList.remove("is-warning", "is-offline");
      const backup = data.lastBackup;
      if (!backup?.modifiedAt) {
        ui.backupAge.textContent = "尚未备份";
        ui.backupAge.title = "备份目录中还没有一致性备份";
      } else {
        const changed = new Date(backup.modifiedAt);
        const ageMinutes = Math.max(
          0,
          Math.floor((Date.now() - changed.getTime()) / 60_000)
        );
        ui.backupAge.textContent = ageMinutes < 2
          ? "刚完成"
          : ageMinutes < 60
            ? `${ageMinutes} 分钟前`
            : ageMinutes < 1440
              ? `${Math.floor(ageMinutes / 60)} 小时前`
              : `${Math.floor(ageMinutes / 1440)} 天前`;
        if (ageMinutes > 720) {
          ui.backupAge.classList.add("is-offline");
        } else if (ageMinutes > 420) {
          ui.backupAge.classList.add("is-warning");
        }
        const sizeMb = (Number(backup.bytes) || 0) / 1024 / 1024;
        const checksum = backup.sha256
          ? `SHA-256 ${backup.sha256.slice(0, 12)}…`
          : "尚无校验文件";
        ui.backupAge.title =
          `${backup.name} · ${sizeMb.toFixed(1)} MB · ${checksum} · ` +
          changed.toLocaleString("zh-CN", { hour12: false }) +
          (data.lastBackupVerify?.archive === backup.name
            ? ` · 恢复验证：${new Date(
                data.lastBackupVerify.verifiedAt
              ).toLocaleString("zh-CN", { hour12: false })}`
            : " · 尚无恢复验证");
      }
    }

    if (ui.offsiteBackupState) {
      ui.offsiteBackupState.classList.remove("is-warning", "is-offline");
      const offsite = data.offsiteBackup;
      if (!offsite?.available) {
        ui.offsiteBackupState.textContent = "未同步";
        ui.offsiteBackupState.classList.add("is-warning");
        ui.offsiteBackupState.title = "尚未读取到 E 盘独立备份副本";
      } else {
        const replicas = Math.max(0, Number(offsite.replicas) || 0);
        ui.offsiteBackupState.textContent = offsite.stale
          ? "巡检超时"
          : offsite.verified ? "已验证" : "待校验";
        if (!offsite.verified || offsite.stale) {
          ui.offsiteBackupState.classList.add("is-offline");
        }
        const sizeMb = (Number(offsite.bytes) || 0) / 1024 / 1024;
        const checksum = offsite.sha256
          ? `SHA-256 ${offsite.sha256.slice(0, 12)}…`
          : "尚无校验值";
        const intervalMinutes = Math.max(
          1,
          Math.round((Number(offsite.checkIntervalSeconds) || 300) / 60)
        );
        ui.offsiteBackupState.title =
          `${offsite.name} · ${sizeMb.toFixed(1)} MB · ${checksum} · ` +
          `独立副本 ${replicas} 份 · 每 ${intervalMinutes} 分钟巡检` +
          (offsite.stale ? " · 状态已过期" : "");
      }
    }
  };

  const normalizeStatus = (data) => {
    if (Object.hasOwn(data, "onlinePlayers")) return data;
    const players = data.players || {};
    return {
      online: Boolean(data.online),
      state: data.online ? "NORMAL" : "OFFLINE",
      statusText: data.online ? "运行中" : "未开放",
      attackSuspected: false,
      onlinePlayers: Number(players.online ?? players.now) || 0,
      maxPlayers: Number(players.max) || 500,
      tps: null,
      mspt: null,
      lastBackup: null,
      offsiteBackup: null,
      system: null,
      checkedAt: new Date().toISOString()
    };
  };

  const showConnectionError = () => {
    const fallback = {
      online: false,
      state: "OFFLINE",
      onlinePlayers: 0,
      maxPlayers: 500,
      tps: null
    };
    applyStatus(fallback);
    if (ui.statusDetail) {
      ui.statusDetail.textContent = location.protocol === "file:"
        ? "动态接口未启动 · 请双击 website/启动官网.bat"
        : "公开状态接口暂时不可用 · 10 秒后自动重试";
    }
  };

  const refreshStatus = async () => {
    if (statusRequest) statusRequest.abort();
    const controller = new AbortController();
    statusRequest = controller;
    const timeout = setTimeout(() => controller.abort(), 9000);

    try {
      const results = await Promise.allSettled(STATUS_ENDPOINTS.map(async (endpoint) => {
        const separator = endpoint.includes("?") ? "&" : "?";
        const startedAt = performance.now();
        const response = await fetch(`${endpoint}${separator}t=${Date.now()}`, {
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const status = normalizeStatus(await response.json());
        status.requestLatency = performance.now() - startedAt;
        return status;
      }));
      const statuses = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);
      if (statuses.length === 0) throw new Error("status unavailable");
      applyStatus(statuses.find((status) => status.online) || statuses[0]);
    } catch {
      showConnectionError();
    } finally {
      clearTimeout(timeout);
      if (statusRequest === controller) statusRequest = null;
    }
  };

  const startStatusUpdates = () => {
    clearInterval(statusTimer);
    refreshStatus();
    statusTimer = setInterval(refreshStatus, STATUS_REFRESH_MS);
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      stopParticles();
      clearInterval(statusTimer);
      statusTimer = undefined;
      return;
    }
    startParticles();
    startStatusUpdates();
  });
  window.addEventListener("online", startStatusUpdates);
  window.addEventListener("offline", showConnectionError);

  if (IS_GITHUB_PAGES && ui.backupStat) {
    ui.backupStat.hidden = true;
  }
  if (IS_GITHUB_PAGES && ui.offsiteBackupStat) {
    ui.offsiteBackupStat.hidden = true;
  }

  const historyPoints = [];
  const chartCanvas = ui.perfChart;
  const chartContext = chartCanvas?.getContext("2d");

  const resizeChart = () => {
    if (!chartCanvas || !chartContext) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = chartCanvas.parentElement?.clientWidth || 800;
    const height = 150;
    chartCanvas.width = width * ratio;
    chartCanvas.height = height * ratio;
    chartCanvas.style.width = `${width}px`;
    chartCanvas.style.height = `${height}px`;
    chartContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const drawHistory = () => {
    if (!chartCanvas || !chartContext) return;
    const width = chartCanvas.clientWidth;
    const height = chartCanvas.clientHeight;
    chartContext.clearRect(0, 0, width, height);

    chartContext.strokeStyle = "rgba(150,220,190,.1)";
    chartContext.lineWidth = 1;
    for (let row = 1; row < 4; row++) {
      const y = (height / 4) * row;
      chartContext.beginPath();
      chartContext.moveTo(0, y);
      chartContext.lineTo(width, y);
      chartContext.stroke();
    }

    if (historyPoints.length < 2) {
      chartContext.fillStyle = "rgba(194,255,228,.55)";
      chartContext.font = "11px Microsoft YaHei UI";
      chartContext.fillText("正在收集性能数据…", 12, height / 2);
      return;
    }

    const drawSeries = (field, maximum, color, fillColor) => {
      chartContext.beginPath();
      historyPoints.forEach((point, index) => {
        const value = Number(point[field]);
        const normalized = Number.isFinite(value)
          ? Math.max(0, Math.min(1, value / maximum))
          : 0;
        const x = (index / Math.max(1, historyPoints.length - 1)) * width;
        const y = height - 12 - normalized * (height - 28);
        if (index === 0) chartContext.moveTo(x, y);
        else chartContext.lineTo(x, y);
      });
      chartContext.strokeStyle = color;
      chartContext.lineWidth = 2;
      chartContext.stroke();
      chartContext.lineTo(width, height);
      chartContext.lineTo(0, height);
      chartContext.closePath();
      chartContext.fillStyle = fillColor;
      chartContext.fill();
    };

    drawSeries("tps", 20, "#43f5a1", "rgba(67,245,161,.09)");
    drawSeries("mspt", 50, "#6fdcff", "rgba(111,220,255,.05)");
  };

  const refreshHistory = async () => {
    if (!ui.telemetry || !chartCanvas) return;
    if (IS_GITHUB_PAGES) {
      ui.telemetry.hidden = true;
      return;
    }
    try {
      const response = await fetch(`/api/history?t=${Date.now()}`, {
        cache: "no-store"
      });
      if (!response.ok) return;
      const payload = await response.json();
      historyPoints.splice(
        0,
        historyPoints.length,
        ...(Array.isArray(payload.points) ? payload.points : [])
      );
      const latest = historyPoints.at(-1);
      if (latest) {
        if (ui.chartTps) ui.chartTps.textContent =
          Number.isFinite(Number(latest.tps)) ? Number(latest.tps).toFixed(1) : "--";
        if (ui.chartMspt) ui.chartMspt.textContent =
          Number.isFinite(Number(latest.mspt)) ? Number(latest.mspt).toFixed(1) : "--";
        if (ui.chartPlayers) ui.chartPlayers.textContent = String(latest.players ?? 0);
      }
      drawHistory();
    } catch {
      // The main status panel already reports connection problems.
    }
  };

  resizeChart();
  drawHistory();
  new ResizeObserver(() => {
    resizeChart();
    drawHistory();
  }).observe(ui.telemetry || document.body);
  setInterval(refreshHistory, 5000);
  refreshHistory();

  showLoading();
  updateLastRefresh();
  startStatusUpdates();
})();

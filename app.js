(() => {
  "use strict";

  const SERVER_DOMAIN = "mauritania-replies.tun.ply.gg";
  const SERVER_ADDRESS = `${SERVER_DOMAIN}:16455`;
  const STATUS_REFRESH_MS = 10_000;
  const IS_GITHUB_PAGES = location.hostname.endsWith(".github.io");
  const STATUS_ENDPOINT = IS_GITHUB_PAGES
    ? `https://api.mcsrvstat.us/3/${encodeURIComponent(SERVER_DOMAIN)}`
    : "/api/status";
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
    serverState: byId("server-state")
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

  const resizeParticles = () => {
    if (!canvas || !context) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    canvas.width = viewportWidth * ratio;
    canvas.height = viewportHeight * ratio;
    canvas.style.width = `${viewportWidth}px`;
    canvas.style.height = `${viewportHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles = Array.from(
      { length: Math.min(52, Math.floor(viewportWidth / 22)) },
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
    if (!context) return;
    context.clearRect(0, 0, viewportWidth, viewportHeight);
    particles.forEach((particle) => {
      particle.y -= particle.speed;
      particle.x += Math.sin((particle.y + particle.size) * 0.01) * 0.08;
      if (particle.y < -5) {
        particle.y = viewportHeight + 5;
        particle.x = Math.random() * viewportWidth;
      }
      context.fillStyle = particle.gold
        ? `rgba(248,206,107,${particle.alpha})`
        : `rgba(67,245,161,${particle.alpha})`;
      context.fillRect(particle.x, particle.y, particle.size, particle.size);
    });
    if (!reducedMotion) requestAnimationFrame(drawParticles);
  };

  resizeParticles();
  drawParticles();
  window.addEventListener("resize", resizeParticles, { passive: true });

  const toneFor = (data) => {
    if (!data.online) return "offline";
    const state = String(data.state || "").toUpperCase();
    return state === "ATTACK" || state === "LAG" ? "warning" : "online";
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

  const updateLastRefresh = (date = new Date()) => {
    if (!ui.lastUpdate) return;
    ui.lastUpdate.textContent = `${date.toLocaleTimeString("zh-CN", {
      hour12: false
    })} 自动更新`;
  };

  const showLoading = () => {
    setTone(ui.statusPill, "loading");
    setTone(ui.liveStrip, "loading");
    if (ui.statusText) ui.statusText.textContent = "检测服务器";
    if (ui.statusDetail) ui.statusDetail.textContent = "正在连接服务器状态接口……";
    setValueTone(ui.serverState, "loading");
    setValueTone(ui.serverTps, "loading");
    setValueTone(ui.playerCount, "loading");
    if (ui.serverState) ui.serverState.textContent = "检测中";
    if (ui.serverTps) ui.serverTps.textContent = "--";
    if (ui.playerCount) ui.playerCount.textContent = "-- / 500";
    if (ui.heroOnline) ui.heroOnline.textContent = "--";
  };

  const applyStatus = (data) => {
    const tone = toneFor(data);
    const online = Math.max(0, Number(data.onlinePlayers) || 0);
    const maximum = Math.max(1, Number(data.maxPlayers) || 500);
    const tps = Number(data.tps);
    const formattedTps = Number.isFinite(tps) ? tps.toFixed(1) : "--";

    setTone(ui.statusPill, tone);
    setTone(ui.liveStrip, tone);
    setValueTone(ui.playerCount, tone);
    setValueTone(ui.serverTps, tone);
    setValueTone(ui.serverState, tone);

    if (ui.statusText) {
      ui.statusText.textContent = tone === "offline"
        ? "SERVER OFFLINE"
        : tone === "warning" ? "SERVER WARNING" : "SERVER ONLINE";
    }

    if (ui.playerCount) ui.playerCount.textContent = `${online} / ${maximum}`;
    if (ui.heroOnline) ui.heroOnline.textContent = String(online);
    if (ui.serverTps) ui.serverTps.textContent = tone === "offline" ? "--" : formattedTps;
    if (ui.serverState) {
      ui.serverState.textContent = tone === "offline"
        ? "未开放"
        : tone === "warning" ? "告警中" : "在线";
    }

    if (ui.statusDetail) {
      if (tone === "offline") {
        ui.statusDetail.textContent = "服务器当前未开放 · 启动服务端后本页会自动刷新";
      } else if (tone === "warning") {
        ui.statusDetail.textContent = `监控发现卡顿或异常网络 · ${online} 人在线 · TPS ${formattedTps}`;
      } else {
        ui.statusDetail.textContent = `运行正常 · ${online} 人在线 · TPS ${formattedTps} · 最大 ${maximum} 人`;
      }
    }

    document.documentElement.dataset.serverState = tone;
    updateLastRefresh(data.checkedAt ? new Date(data.checkedAt) : new Date());
  };

  const normalizeStatus = (data) => {
    if (Object.hasOwn(data, "onlinePlayers")) return data;
    const players = data.players || {};
    return {
      online: Boolean(data.online),
      state: data.online ? "NORMAL" : "OFFLINE",
      statusText: data.online ? "运行中" : "未开放",
      onlinePlayers: Number(players.online) || 0,
      maxPlayers: Number(players.max) || 500,
      tps: null,
      mspt: null,
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
        : "状态接口暂时无法连接 · 10 秒后自动重试";
    }
  };

  const refreshStatus = async () => {
    if (statusRequest) statusRequest.abort();
    const controller = new AbortController();
    statusRequest = controller;
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const separator = STATUS_ENDPOINT.includes("?") ? "&" : "?";
      const response = await fetch(`${STATUS_ENDPOINT}${separator}t=${Date.now()}`, {
        cache: "no-store",
        signal: controller.signal,
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      applyStatus(normalizeStatus(await response.json()));
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
    if (document.visibilityState === "visible") refreshStatus();
  });
  window.addEventListener("online", startStatusUpdates);
  window.addEventListener("offline", showConnectionError);

  showLoading();
  updateLastRefresh();
  startStatusUpdates();
})();

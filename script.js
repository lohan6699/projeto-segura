/* =====================================================================
   CONFIGURAÇÃO DAS CÂMERAS
   ---------------------------------------------------------------------
   Cada câmera tem um campo "stream" (hoje null = modo demonstração).
   Para ligar a uma câmera real, troque null pela URL do vídeo que o
   sistema de CFTV/TI da escola fornecer, por exemplo:
     - MJPEG:      stream: "http://IP-DA-CAMERA/video"
     - HLS (.m3u8): stream: "https://servidor/live/cam1/index.m3u8"
                    (nesse caso use a biblioteca hls.js para tocar em <video>)
   Câmeras de CFTV normalmente falam RTSP, que o navegador não reproduz
   direto — por isso é necessário um servidor "ponte" (ex: RTSP -> HLS)
   fornecido/configurado pela equipe de TI da escola.
===================================================================== */
const CAMERAS = [
  { id: 1, nome: "Entrada Principal",  local: "Portão A",        status: "online", stream: null },
  { id: 2, nome: "Pátio Central",      local: "Área externa",    status: "online", stream: null },
  { id: 3, nome: "Corredor Bloco B",   local: "1º andar",        status: "alerta", stream: null },
  { id: 4, nome: "Estacionamento",     local: "Fundos",          status: "online", stream: null },
  { id: 5, nome: "Biblioteca",         local: "Bloco C",         status: "offline",stream: null },
  { id: 6, nome: "Quadra Esportiva",   local: "Área externa",    status: "online", stream: null },
];

const STATUS_LABEL = { online: "AO VIVO", offline: "SEM SINAL", alerta: "ALERTA" };

let selectedCam = CAMERAS[0].id;

/* ---------- Login (DEMONSTRAÇÃO — trocar por autenticação real) ----------
   Em produção, envie usuário/senha para um servidor (HTTPS) que valide
   as credenciais e devolva uma sessão/token. Nunca guarde senhas ou
   liberação de acesso apenas no código do navegador. */
document.getElementById("cover-btn").addEventListener("click", function(){
  document.getElementById("cover-screen").style.display = "none";
  document.getElementById("login-screen").classList.add("active");
});

document.getElementById("login-form").addEventListener("submit", function(e){
  e.preventDefault();
  const usuario = document.getElementById("usuario").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const erro = document.getElementById("login-error");

  if(usuario && senha){
    erro.style.display = "none";
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("dashboard").classList.add("active");
    startClock();
    renderCameras();
    startAlertFeed();
  } else {
    erro.style.display = "block";
  }
});

document.getElementById("logout-btn").addEventListener("click", function(){
  document.getElementById("dashboard").classList.remove("active");
  document.getElementById("login-screen").classList.remove("active");
  document.getElementById("cover-screen").style.display = "flex";
  document.getElementById("usuario").value = "";
  document.getElementById("senha").value = "";
});

function startClock(){
  const clockEl = document.getElementById("clock");
  function tick(){
    clockEl.textContent = new Date().toLocaleTimeString("pt-BR");
  }
  tick();
  setInterval(tick, 1000);
}

function renderCameras(){
  const list = document.getElementById("cam-list");
  const grid = document.getElementById("cam-grid");
  list.innerHTML = "";
  grid.innerHTML = "";

  const onlineCount = CAMERAS.filter(c => c.status !== "offline").length;
  document.getElementById("cam-count").textContent = `${onlineCount} de ${CAMERAS.length} câmeras online`;

  CAMERAS.forEach(cam => {
    // Item da barra lateral
    const item = document.createElement("div");
    item.className = "cam-item" + (cam.id === selectedCam ? " selected" : "");
    item.innerHTML = `
      <div class="status-dot status-${cam.status}"></div>
      <div class="cam-info">
        <div class="cam-name">${cam.nome}</div>
        <div class="cam-local mono">${cam.local}</div>
      </div>`;
    item.addEventListener("click", () => { selectedCam = cam.id; renderCameras(); });
    list.appendChild(item);

    // Tile no grid
    const tile = document.createElement("div");
    tile.className = "cam-tile" + (cam.id === selectedCam ? " selected" : "") + (cam.status === "offline" ? " offline" : "");
    tile.addEventListener("click", () => { selectedCam = cam.id; renderCameras(); });

    let feedHtml;
    if(cam.status === "offline"){
      feedHtml = `<div class="offline-msg mono">SEM SINAL<br>Verifique a conexão da câmera</div>`;
    } else if(!cam.stream){
      feedHtml = `<div class="offline-msg mono" style="color:#3A4650;">MODO DEMONSTRAÇÃO<br>Aguardando URL do stream real</div>`;
    } else {
      // Quando "stream" tiver uma URL real, troque este bloco por:
      // feedHtml = `<img src="${cam.stream}" style="width:100%;height:100%;object-fit:cover;">`
      // ou por um <video> com HLS.js, conforme o tipo de stream.
      feedHtml = `<div class="offline-msg mono">STREAM CONFIGURADO<br>Conecte o player de vídeo aqui</div>`;
    }

    tile.innerHTML = `
      <div class="cam-feed ${cam.status === 'online' ? 'demo-motion' : ''}"></div>
      <div class="cam-overlay-top">
        <span>${cam.nome}</span>
        <span class="rec-badge mono"><span class="rec-dot"></span>REC</span>
      </div>
      ${feedHtml}
      <div class="cam-overlay-bottom mono">
        <span>${cam.local}</span>
        <span>${STATUS_LABEL[cam.status]}</span>
      </div>`;
    grid.appendChild(tile);
  });
}

/* ---------- Feed de atividade simulado ----------
   Em um sistema real, esses eventos viriam de sensores de movimento,
   controle de acesso, ou análise de vídeo do fornecedor de CFTV —
   enviados ao navegador via WebSocket ou consultados por uma API. */
const EVENTOS_DEMO = [
  { tipo: "info",   texto: "Câmera \"Pátio Central\" iniciou gravação." },
  { tipo: "alerta", texto: "Movimento detectado — Corredor Bloco B." },
  { tipo: "info",   texto: "Ronda registrada na Entrada Principal." },
  { tipo: "alerta", texto: "Porta dos fundos aberta fora do horário." },
  { tipo: "info",   texto: "Sistema verificado — todas as câmeras online." },
];

function startAlertFeed(){
  const list = document.getElementById("alerts-list");
  list.innerHTML = "";

  function addEvent(ev){
    const el = document.createElement("div");
    el.className = "alert-item tipo-" + ev.tipo;
    el.innerHTML = `<span class="alert-time mono">${new Date().toLocaleTimeString("pt-BR")}</span>${ev.texto}`;
    list.prepend(el);
  }

  addEvent(EVENTOS_DEMO[4]);
  let i = 0;
  setInterval(() => {
    addEvent(EVENTOS_DEMO[i % EVENTOS_DEMO.length]);
    i++;
  }, 9000);
}
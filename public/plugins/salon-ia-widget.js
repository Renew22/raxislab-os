/*!
 * RaxisLab Salon IA Widget v1.0
 * Uso: <div id="salon-ia-widget" data-salon="desancho" data-cta-url="https://desancho.com/reservar"></div>
 *      <script src="https://raxislab-os.vercel.app/plugins/salon-ia-widget.js"></script>
 */
(function () {
  'use strict';

  var API_URL  = 'http://167.233.72.200:8891/api/salon-ia/analyze';
  var API_KEY  = 'rxl_salon_k9m4';
  var MAX_SIZE = 1200;

  var CSS = `
#salon-ia-widget *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
#salon-ia-widget{background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.10);max-width:520px;margin:24px auto;overflow:hidden}
.sia-header{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:28px 24px 22px;text-align:center;color:#fff}
.sia-header h3{margin:0 0 6px;font-size:1.25rem;font-weight:700;letter-spacing:-.3px}
.sia-header p{margin:0;font-size:.85rem;opacity:.75}
.sia-drop{border:2px dashed #d1d5db;border-radius:12px;margin:20px 16px 0;padding:32px 16px;text-align:center;cursor:pointer;transition:all .2s;position:relative;background:#fafafa}
.sia-drop:hover,.sia-drop.drag{border-color:#0f3460;background:#f0f4ff}
.sia-drop input[type=file]{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
.sia-drop-icon{font-size:2rem;display:block;margin-bottom:8px}
.sia-drop p{margin:0;color:#6b7280;font-size:.9rem;line-height:1.4}
.sia-drop small{color:#9ca3af;font-size:.78rem}
.sia-preview-wrap{margin:0 16px;text-align:center;display:none}
.sia-preview-wrap img{max-width:100%;max-height:220px;border-radius:10px;object-fit:cover;margin-top:12px}
.sia-question{margin:12px 16px 0;display:none}
.sia-question input{width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:10px 14px;font-size:.9rem;outline:none;transition:border .2s}
.sia-question input:focus{border-color:#0f3460}
.sia-btn{display:block;width:calc(100% - 32px);margin:14px 16px;padding:13px;background:#0f3460;color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer;transition:background .2s;letter-spacing:.2px}
.sia-btn:hover{background:#16213e}
.sia-btn:disabled{background:#9ca3af;cursor:not-allowed}
.sia-loader{display:none;text-align:center;padding:24px;color:#6b7280}
.sia-loader .sia-spinner{width:36px;height:36px;border:3px solid #e5e7eb;border-top-color:#0f3460;border-radius:50%;animation:sia-spin .8s linear infinite;margin:0 auto 10px}
@keyframes sia-spin{to{transform:rotate(360deg)}}
.sia-result{display:none;padding:0 16px 20px}
.sia-analisis{background:#f8fafc;border-left:3px solid #0f3460;border-radius:0 8px 8px 0;padding:12px 14px;margin:14px 0 12px;font-size:.9rem;color:#374151;line-height:1.5}
.sia-sug-title{font-size:.8rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
.sia-sug-list{list-style:none;padding:0;margin:0 0 16px}
.sia-sug-list li{padding:10px 12px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;cursor:pointer;transition:all .15s}
.sia-sug-list li:hover{border-color:#0f3460;background:#f0f4ff}
.sia-sug-list .sug-titulo{font-weight:600;font-size:.9rem;color:#111827;margin-bottom:2px}
.sia-sug-list .sug-desc{font-size:.82rem;color:#6b7280;line-height:1.4}
.sia-sug-list .sug-chip{display:inline-block;margin-top:4px;padding:2px 8px;background:#e0e7ff;color:#3730a3;border-radius:20px;font-size:.72rem;font-weight:600}
.sia-cta{display:block;text-align:center;background:linear-gradient(135deg,#0f3460,#e94560);color:#fff;text-decoration:none;border-radius:10px;padding:14px;font-size:.95rem;font-weight:700;letter-spacing:.2px;transition:opacity .2s}
.sia-cta:hover{opacity:.88}
.sia-reset{display:block;text-align:center;margin-top:10px;color:#9ca3af;font-size:.8rem;cursor:pointer;text-decoration:underline}
.sia-error{display:none;margin:0 16px 16px;padding:12px 14px;background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;color:#b91c1c;font-size:.85rem}
`;

  function init() {
    var root = document.getElementById('salon-ia-widget');
    if (!root) return;

    var salon  = root.getAttribute('data-salon') || 'desancho';
    var ctaUrl = root.getAttribute('data-cta-url') || '#';

    var styleEl = document.createElement('style');
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);

    root.innerHTML = [
      '<div class="sia-header">',
        '<h3>✨ Analiza tu look con IA</h3>',
        '<p>Sube una foto y te recomendamos los mejores cambios para ti</p>',
      '</div>',
      '<div class="sia-drop" id="sia-drop">',
        '<input type="file" id="sia-file" accept="image/*">',
        '<span class="sia-drop-icon">📷</span>',
        '<p>Arrastra tu foto aquí o <strong>haz clic para seleccionar</strong></p>',
        '<small>JPG, PNG, WEBP · Máx 8MB</small>',
      '</div>',
      '<div class="sia-preview-wrap" id="sia-preview-wrap">',
        '<img id="sia-preview-img" src="" alt="Tu foto">',
      '</div>',
      '<div class="sia-question" id="sia-question">',
        '<input type="text" id="sia-q" placeholder="¿Alguna pregunta concreta? Ej: ¿Qué tono me favorecería más?" maxlength="120">',
      '</div>',
      '<button class="sia-btn" id="sia-btn" style="display:none">Analizar mi look →</button>',
      '<div class="sia-loader" id="sia-loader">',
        '<div class="sia-spinner"></div>',
        '<p>Analizando tu foto con IA...</p>',
      '</div>',
      '<div class="sia-error" id="sia-error"></div>',
      '<div class="sia-result" id="sia-result"></div>',
    ].join('');

    var fileInput   = root.querySelector('#sia-file');
    var dropZone    = root.querySelector('#sia-drop');
    var previewWrap = root.querySelector('#sia-preview-wrap');
    var previewImg  = root.querySelector('#sia-preview-img');
    var questionBox = root.querySelector('#sia-question');
    var analyzeBtn  = root.querySelector('#sia-btn');
    var loader      = root.querySelector('#sia-loader');
    var resultDiv   = root.querySelector('#sia-result');
    var errorDiv    = root.querySelector('#sia-error');

    var selectedBase64 = null;

    // Drag & drop
    dropZone.addEventListener('dragover', function (e) { e.preventDefault(); dropZone.classList.add('drag'); });
    dropZone.addEventListener('dragleave', function () { dropZone.classList.remove('drag'); });
    dropZone.addEventListener('drop', function (e) {
      e.preventDefault();
      dropZone.classList.remove('drag');
      var file = e.dataTransfer.files[0];
      if (file) processFile(file);
    });

    fileInput.addEventListener('change', function () {
      if (fileInput.files[0]) processFile(fileInput.files[0]);
    });

    analyzeBtn.addEventListener('click', function () { analyze(salon, ctaUrl); });

    function processFile(file) {
      if (file.size > 8 * 1024 * 1024) {
        showError('La imagen es demasiado grande. Máximo 8MB.');
        return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = new Image();
        img.onload = function () {
          var canvas = document.createElement('canvas');
          var ratio  = Math.min(1, MAX_SIZE / Math.max(img.width, img.height));
          canvas.width  = Math.round(img.width  * ratio);
          canvas.height = Math.round(img.height * ratio);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          selectedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          previewImg.src = selectedBase64;
          previewWrap.style.display = 'block';
          questionBox.style.display = 'block';
          analyzeBtn.style.display  = 'block';
          dropZone.style.display    = 'none';
          resultDiv.style.display   = 'none';
          errorDiv.style.display    = 'none';
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function analyze(salonName, cta) {
      if (!selectedBase64) return;
      analyzeBtn.disabled = true;
      loader.style.display = 'block';
      resultDiv.style.display = 'none';
      errorDiv.style.display = 'none';

      var question = root.querySelector('#sia-q').value.trim();

      fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Salon-Key': API_KEY
        },
        body: JSON.stringify({
          image_base64: selectedBase64,
          salon: salonName,
          question: question || undefined
        })
      })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        loader.style.display = 'none';
        analyzeBtn.disabled = false;
        if (data.error) { showError(data.error); return; }
        renderResult(data, cta);
      })
      .catch(function () {
        loader.style.display = 'none';
        analyzeBtn.disabled = false;
        showError('No se pudo conectar. Inténtalo de nuevo.');
      });
    }

    function renderResult(data, cta) {
      var sugs = (data.sugerencias || []).map(function (s) {
        return '<li>' +
          '<div class="sug-titulo">' + esc(s.titulo) + '</div>' +
          '<div class="sug-desc">' + esc(s.descripcion) + '</div>' +
          (s.servicio ? '<span class="sug-chip">' + esc(s.servicio) + '</span>' : '') +
        '</li>';
      }).join('');

      var ctaTarget = data.cta_url || cta;

      resultDiv.innerHTML =
        '<div class="sia-analisis">' + esc(data.analisis) + '</div>' +
        '<p class="sia-sug-title">Recomendaciones para ti</p>' +
        '<ul class="sia-sug-list">' + sugs + '</ul>' +
        '<a class="sia-cta" href="' + ctaTarget + '" target="_blank">' + esc(data.cta_texto || 'Reserva tu cita') + ' →</a>' +
        '<span class="sia-reset" id="sia-reset">Analizar otra foto</span>';

      resultDiv.style.display = 'block';

      root.querySelector('#sia-reset').addEventListener('click', function () {
        selectedBase64 = null;
        fileInput.value = '';
        previewWrap.style.display = 'none';
        questionBox.style.display = 'none';
        analyzeBtn.style.display  = 'none';
        resultDiv.style.display   = 'none';
        dropZone.style.display    = 'block';
        root.querySelector('#sia-q').value = '';
      });
    }

    function showError(msg) {
      errorDiv.textContent = '⚠️ ' + msg;
      errorDiv.style.display = 'block';
      loader.style.display = 'none';
    }

    function esc(str) {
      return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

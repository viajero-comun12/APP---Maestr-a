/**
 * Molécula: FileUploader
 * Zona Drag & Drop para carga de certificados PDF y proyectos de maestría
 */

import { Icons } from '../atomos/Icons.js';

export function renderFileUploaderHtml({
  id = 'evidence-file-input',
  accept = '.pdf,.zip,.rar,.tar.gz,.docx',
  label = 'Subir Certificado PDF o Proyecto'
}) {
  return `
    <div class="upload-dropzone" id="dropzone-${id}">
      <input type="file" id="${id}" name="file" accept="${accept}" style="display:none;" />
      <div class="upload-icon">${Icons.upload(44)}</div>
      <h4 style="font-size:0.95rem; font-weight:700; color:var(--wine-800); margin-bottom:4px;">${label}</h4>
      <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:12px;">
        Arrastre su archivo aquí o haga <strong style="color:var(--wine-700); text-decoration:underline;">clic para examinar</strong>
      </p>
      <div id="file-name-display-${id}" style="font-size:0.82rem; font-weight:600; color:var(--wine-700); display:none;"></div>
      <p style="font-size:0.72rem; color:#94A3B8; margin-top:6px;">Formatos aceptados: PDF, ZIP, RAR (Máx. 50 MB)</p>
    </div>
  `.trim();
}

export function initFileUploader(id, onFileSelect = null) {
  const dropzone = document.getElementById(`dropzone-${id}`);
  const input = document.getElementById(id);
  const nameDisplay = document.getElementById(`file-name-display-${id}`);

  if (!dropzone || !input) return;

  dropzone.addEventListener('click', () => input.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-active');
  });

  ['dragleave', 'dragend'].forEach(type => {
    dropzone.addEventListener(type, () => dropzone.classList.remove('drag-active'));
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-active');
    if (e.dataTransfer.files.length) {
      input.files = e.dataTransfer.files;
      handleSelected(input.files[0]);
    }
  });

  input.addEventListener('change', () => {
    if (input.files.length) {
      handleSelected(input.files[0]);
    }
  });

  function handleSelected(file) {
    if (nameDisplay) {
      nameDisplay.style.display = 'block';
      nameDisplay.textContent = `Archivo seleccionado: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
    }
    if (onFileSelect) onFileSelect(file);
  }
}

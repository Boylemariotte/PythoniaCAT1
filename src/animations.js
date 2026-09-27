// Pequeñas animaciones con Motion (motion.dev) — la versión de JavaScript
// vanilla, sin React. Se importa desde "motion/mini" a propósito: es el
// build reducido (~2.3kb) pensado justo para esto — animar opacity/transform
// sobre elementos sueltos — y no el paquete completo ("motion"), que arrastra
// el motor de layout/proyección que aquí no se usa y pesaba ~55kb de más.
//
// Cada función respeta prefers-reduced-motion: quien lo activa no ve rebotes
// ni desplazamientos, solo el cambio final (o nada, si no aporta información
// nueva) — el texto real ya se anuncia aparte, con announce() en main.js.

import { animate } from "motion/mini";

function reducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

// Estas animaciones son decorativas: si algo sale mal (un navegador raro sin
// alguna API, lo que sea) nunca deben tumbar el flujo real — ganar XP,
// guardar el progreso, mostrar el panel de éxito. `safely` lo garantiza.
function safely(fn) {
  try {
    fn();
  } catch (err) {
    console.warn("No se pudo reproducir la animación:", err.message);
  }
}

// El build "mini" no trae el generador de resortes (type: "spring") — solo
// keyframes + easing, lo cual alcanza de sobra para esto. Estas curvas de
// cubic-bezier imitan el rebote de un resorte sin necesitarlo.
const EASE_BACK = [0.34, 1.56, 0.64, 1]; // overshoot leve, como un resorte
const EASE_OUT = [0, 0, 0.58, 1];
const EASE_IN = [0.42, 0, 1, 1];

/** Un pequeño rebote en el contador de XP de la barra superior cuando sube. */
export function pulseXpCounter(el) {
  safely(() => {
    if (!el || reducedMotion()) return;
    animate(el, { scale: [1, 1.18, 1] }, { duration: 0.45, ease: EASE_BACK });
  });
}

/**
 * Un "+N XP" que sale flotando desde el contador de XP y se desvanece hacia
 * arriba. `anchorEl` es el propio contador (#xp-counter) — necesita
 * `position: relative` en CSS para que el globo se posicione justo encima.
 * Es puramente decorativo (aria-hidden): el "+N XP" real ya se anuncia a
 * través del panel de éxito de la lección.
 */
export function floatXpGain(amount, anchorEl) {
  safely(() => {
    if (!anchorEl) return;
    const badge = document.createElement("span");
    badge.className = "xp-float";
    badge.textContent = `+${amount} XP`;
    badge.setAttribute("aria-hidden", "true");
    anchorEl.appendChild(badge);
    const cleanup = () => badge.remove();

    if (reducedMotion()) {
      window.setTimeout(cleanup, 700);
      return;
    }
    animate(
      badge,
      { opacity: [0, 1, 1, 0], y: [4, -6, -22, -34], scale: [0.8, 1, 1, 0.9] },
      { duration: 1.1, times: [0, 0.15, 0.75, 1], ease: EASE_OUT }
    ).then(cleanup, cleanup); // si la animación falla a mitad de camino, igual se limpia
  });
}

/**
 * Aviso de subida de nivel: una tarjeta que entra con rebote de resorte
 * arriba de la pantalla, se queda unos segundos y sale sola. Puramente
 * visual — quien la llama debe anunciar el texto por separado (con
 * announce()), porque un nodo insertado y animado no es fiable para
 * lectores de pantalla.
 */
export function celebrateLevelUp(levelName) {
  safely(() => {
    const toast = document.createElement("div");
    toast.className = "levelup-toast";
    toast.setAttribute("aria-hidden", "true");
    toast.innerHTML = `<span class="icon">🎉</span><span>¡Subiste de nivel! Ahora eres <strong>${levelName}</strong>.</span>`;
    document.body.appendChild(toast);
    const remove = () => toast.remove();

    if (reducedMotion()) {
      window.setTimeout(remove, 2600);
      return;
    }
    animate(toast, { opacity: [0, 1], y: [-16, 0], scale: [0.9, 1] }, { duration: 0.5, ease: EASE_BACK }).then(() => {
      window.setTimeout(() => {
        safely(() => {
          animate(toast, { opacity: [1, 0], y: [0, -12] }, { duration: 0.35, ease: EASE_IN }).then(remove, remove);
        });
      }, 2400);
    }, remove);
  });
}

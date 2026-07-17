"use strict";

/* =====================================================
   AUDITORES DA TASCA
   MAIN.JS
===================================================== */

const PREFERE_MENOS_MOVIMENTO = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;

const COMPORTAMENTO_SCROLL = PREFERE_MENOS_MOVIMENTO ? "auto" : "smooth";

document.addEventListener("DOMContentLoaded", () => {
    initCounters();
    initReveal();
    initHeader();
    initBackToTop();
    initSmoothScroll();
    initEasterEgg();
    initAnoFooter();
});

/* =====================================================
   UTILITÁRIOS
===================================================== */

function animarComScroll(callback) {
    let agendado = false;

    function executar() {
        if (!agendado) {
            window.requestAnimationFrame(() => {
                callback();
                agendado = false;
            });

            agendado = true;
        }
    }

    window.addEventListener("scroll", executar, { passive: true });
    executar();
}

function formatarNumero(valor) {
    return Math.round(valor).toLocaleString("pt-PT");
}

/* =====================================================
   CONTADORES
===================================================== */

function initCounters() {
    const counters = document.querySelectorAll(".counter");

    if (!counters.length) {
        return;
    }

    if (!("IntersectionObserver" in window)) {
        counters.forEach(counter => {
            const alvo = Number(counter.dataset.target);

            counter.textContent = Number.isFinite(alvo)
                ? formatarNumero(alvo)
                : "0";
        });

        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            }

            const counter = entry.target;
            const alvo = Number(counter.dataset.target);

            if (!Number.isFinite(alvo)) {
                counter.textContent = "0";
                observer.unobserve(counter);
                return;
            }

            if (PREFERE_MENOS_MOVIMENTO) {
                counter.textContent = formatarNumero(alvo);
                observer.unobserve(counter);
                return;
            }

            const inicio = performance.now();
            const duracao = 1200;

            function atualizarContador(agora) {
                const progresso = Math.min((agora - inicio) / duracao, 1);
                const progressoSuave = 1 - Math.pow(1 - progresso, 3);
                const valorAtual = alvo * progressoSuave;

                counter.textContent = formatarNumero(valorAtual);

                if (progresso < 1) {
                    window.requestAnimationFrame(atualizarContador);
                } else {
                    counter.textContent = formatarNumero(alvo);
                }
            }

            window.requestAnimationFrame(atualizarContador);
            observer.unobserve(counter);
        });
    }, {
        threshold: 0.35
    });

    counters.forEach(counter => observer.observe(counter));
}

/* =====================================================
   HEADER
===================================================== */

function initHeader() {
    const header = document.querySelector("header");

    if (!header) {
        return;
    }

    animarComScroll(() => {
        header.classList.toggle("scrolled", window.scrollY > 80);
    });
}

/* =====================================================
   REVEAL
===================================================== */

function initReveal() {
    const elementos = document.querySelectorAll(
        ".card, .stat, .news div, .member"
    );

    if (!elementos.length) {
        return;
    }

    if (PREFERE_MENOS_MOVIMENTO || !("IntersectionObserver" in window)) {
        elementos.forEach(elemento => elemento.classList.add("show"));
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: "0px 0px -20px 0px"
    });

    elementos.forEach(elemento => observer.observe(elemento));
}

/* =====================================================
   BACK TO TOP
===================================================== */

function initBackToTop() {
    if (document.getElementById("backToTop")) {
        return;
    }

    const button = document.createElement("button");

    button.id = "backToTop";
    button.type = "button";
    button.innerHTML = "&#9650;";
    button.setAttribute("aria-label", "Voltar ao topo da página");
    button.setAttribute("title", "Voltar ao topo");

    document.body.appendChild(button);

    animarComScroll(() => {
        button.classList.toggle("show", window.scrollY > 400);
    });

    button.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: COMPORTAMENTO_SCROLL
        });
    });
}

/* =====================================================
   SCROLL SUAVE
===================================================== */

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", event => {
            const destinoId = anchor.getAttribute("href");

            if (!destinoId || destinoId === "#") {
                return;
            }

            let destino;

            try {
                destino = document.querySelector(destinoId);
            } catch {
                return;
            }

            if (!destino) {
                return;
            }

            event.preventDefault();

            destino.scrollIntoView({
                behavior: COMPORTAMENTO_SCROLL,
                block: "start"
            });

            if (!destino.hasAttribute("tabindex")) {
                destino.setAttribute("tabindex", "-1");
            }

            destino.focus({ preventScroll: true });
        });
    });
}

/* =====================================================
   EASTER EGG
===================================================== */

function initEasterEgg() {
    const heroLogo = document.querySelector(".hero-logo");

    if (!heroLogo) {
        return;
    }

    let clicks = 0;
    let temporizador = null;

    heroLogo.addEventListener("click", () => {
        clicks += 1;

        window.clearTimeout(temporizador);

        temporizador = window.setTimeout(() => {
            clicks = 0;
        }, 2500);

        if (clicks !== 5) {
            return;
        }

        window.clearTimeout(temporizador);
        clicks = 0;

        alert(
            "🏅 CERTIFICAÇÃO PREMIUM\n\n" +
            "Parabéns!\n\n" +
            "Acaba de desbloquear o nível\n\n" +
            "MESTRE DA TASCA\n\n" +
            "Está oficialmente autorizado\n" +
            "a pedir mais uma rodada. 🍺"
        );
    });
}

/* =====================================================
   DATA NO FOOTER
===================================================== */

function initAnoFooter() {
    const ano = new Date().getFullYear();

    document.querySelectorAll(".year").forEach(elemento => {
        elemento.textContent = ano;
    });
}

/* =====================================================
   CERTIFICAÇÕES ATA
===================================================== */

function toggleCert(id) {
    const painelSelecionado = document.getElementById(id);

    if (!painelSelecionado) {
        return;
    }

    const paineis = document.querySelectorAll(".cert-panel");
    const estavaAtivo = painelSelecionado.classList.contains("active");

    paineis.forEach(painel => {
        painel.classList.remove("active");
    });

    if (estavaAtivo) {
        return;
    }

    painelSelecionado.classList.add("active");

    painelSelecionado.scrollIntoView({
        behavior: COMPORTAMENTO_SCROLL,
        block: "center"
    });
}

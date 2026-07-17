/* =====================================================
   AUDITORES DA TASCA
   MAIN.JS
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    initCounters();
    initReveal();
    initHeader();
    initBackToTop();
    initSmoothScroll();

});

/* =====================================================
   CONTADORES
===================================================== */

function initCounters() {

    const counters = document.querySelectorAll(".counter");

    const observer = new IntersectionObserver(entries => {

        entries.forEach(entry => {

            if (!entry.isIntersecting) return;

            const counter = entry.target;

            const target = parseInt(counter.dataset.target);

            let value = 0;

            const speed = target / 150;

            function update() {

                value += speed;

                if (value >= target) {

                    counter.innerText = target.toLocaleString("pt-PT");
                    return;

                }

                counter.innerText = Math.floor(value).toLocaleString("pt-PT");

                requestAnimationFrame(update);

            }

            update();

            observer.unobserve(counter);

        });

    }, {

        threshold:0.5

    });

    counters.forEach(counter => observer.observe(counter));

}

/* =====================================================
   HEADER
===================================================== */

function initHeader() {

    const header = document.querySelector("header");

    const menu = document.getElementById("mainNav");

    const toggle = document.getElementById("menuToggle");

    window.addEventListener("scroll", () => {

        if (window.scrollY > 80) {

            header.classList.add("scrolled");

        } else {

            header.classList.remove("scrolled");

        }

    });

/* =====================================================
   REVEAL
===================================================== */

function initReveal() {

    const elements = document.querySelectorAll(

        ".card,.stat,.news div,.member"

    );

    const observer = new IntersectionObserver(entries => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("show");

            }

        });

    }, {

        threshold:0.15

    });

    elements.forEach(el => observer.observe(el));

}

/* =====================================================
   BACK TO TOP
===================================================== */

function initBackToTop() {

    const button = document.createElement("button");

    button.id = "backToTop";

    button.innerHTML = "▲";

    document.body.appendChild(button);

    window.addEventListener("scroll", () => {

        if (window.scrollY > 400) {

            button.classList.add("show");

        } else {

            button.classList.remove("show");

        }

    });

    button.addEventListener("click", () => {

        window.scrollTo({

            top:0,

            behavior:"smooth"

        });

    });

}

/* =====================================================
   SCROLL SUAVE
===================================================== */

function initSmoothScroll() {

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {

        anchor.addEventListener("click", function(e){

            const target = document.querySelector(this.getAttribute("href"));

            if(!target) return;

            e.preventDefault();

            target.scrollIntoView({

                behavior:"smooth"

            });

        });

    });

}

/* =====================================================
   EASTER EGG
===================================================== */

let clicks = 0;

const heroLogo = document.querySelector(".hero-logo");

if(heroLogo){

    heroLogo.addEventListener("click",()=>{

        clicks++;

        if(clicks===5){

            alert(
`🏅 CERTIFICAÇÃO PREMIUM

Parabéns!

Acaba de desbloquear o nível

MESTRE DA TASCA

Está oficialmente autorizado
a pedir mais uma rodada. 🍺`
            );

            clicks=0;

        }

    });

}

/* =====================================================
   DATA NO FOOTER
===================================================== */

const year = new Date().getFullYear();

document.querySelectorAll(".year").forEach(el=>{

    el.innerHTML = year;

});
/* ==================================================
   CERTIFICAÇÕES ATA
================================================== */

function toggleCert(id){

    const panels=document.querySelectorAll(".cert-panel");

    panels.forEach(panel=>{

        if(panel.id!==id){

            panel.classList.remove("active");

        }

    });

    document.getElementById(id).classList.toggle("active");

    if(document.getElementById(id).classList.contains("active")){

        document.getElementById(id).scrollIntoView({

            behavior:"smooth",

            block:"center"

        });

    }

}

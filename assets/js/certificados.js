"use strict";

let certificados = [];

const CERTIFICADOS_URL = "assets/data/certificados.json";
const QR_TAMANHO = 140;
const QR_CLASSE_TEMPORARIA = "qr-pdf-temporario";

function obterElemento(id) {
    return document.getElementById(id);
}

function formatarTexto(valor, alternativa = "-") {
    const texto = String(valor ?? "").trim();
    return texto || alternativa;
}

function esperarFrame() {
    return new Promise(resolve => requestAnimationFrame(resolve));
}

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function carregarCertificados() {
    try {
        const resposta = await fetch(CERTIFICADOS_URL, {
            cache: "no-store"
        });

        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        const dados = await resposta.json();

        certificados = Array.isArray(dados) ? dados : [];
    } catch (erro) {
        console.error("Erro ao carregar certificados:", erro);
        certificados = [];
    }
}

function limparResultadoCertificado() {
    const campos = [
        "resEstado",
        "resNumero",
        "resNome",
        "resNivel",
        "resEmissao",
        "resValidade",
        "resSituacao"
    ];

    campos.forEach(id => {
        const campo = obterElemento(id);

        if (campo) {
            campo.textContent = "";
        }
    });

    const badge = obterElemento("resBadge");

    if (badge) {
        badge.removeAttribute("src");
        badge.alt = "Badge da Certificação";
    }

    const qr = obterElemento("qrCode");

    if (qr) {
        qr.innerHTML = "";
    }
}

function definirBadge(nivel) {
    const badge = obterElemento("resBadge");

    if (!badge) {
        return;
    }

    const badgesPorNivel = {
        Certified: "assets/img/certified.png",
        Senior: "assets/img/senior.png",
        Elite: "assets/img/elite.png",
        "Elite Auditor": "assets/img/elite.png",
        Legend: "assets/img/legend.png"
    };

    const origem = badgesPorNivel[nivel] || "";

    if (origem) {
        badge.src = origem;
    } else {
        badge.removeAttribute("src");
    }

    badge.alt = origem
        ? `Badge de certificação: ${formatarTexto(nivel)}`
        : "Badge da Certificação";
}

function definirEstado(estadoCertificado) {
    const estado = obterElemento("resSituacao");

    if (!estado) {
        return;
    }

    const estadoTexto = formatarTexto(estadoCertificado);

    const coresPorEstado = {
        "Válido": "#32c36c",
        Expirado: "#ffb400",
        Revogado: "#ff4d4d"
    };

    estado.textContent = estadoTexto;
    estado.style.fontWeight = "700";
    estado.style.color = coresPorEstado[estadoTexto] || "#ffffff";
}

function gerarQRCode(numeroCertificado) {
    const qr = obterElemento("qrCode");

    if (!qr) {
        return;
    }

    qr.innerHTML = "";

    if (typeof QRCode === "undefined") {
        console.error("A biblioteca QRCode não foi carregada.");
        return;
    }

    const urlCertificado = new URL(
        "verificar-certificacao.html",
        window.location.href
    );

    urlCertificado.searchParams.set(
        "cert",
        formatarTexto(numeroCertificado, "")
    );

    new QRCode(qr, {
        text: urlCertificado.toString(),
        width: QR_TAMANHO,
        height: QR_TAMANHO,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.L
    });

    /*
     * Alguns browsers podem inserir mais do que um elemento de saída.
     * Mantém apenas o primeiro elemento gerado para o QR visível no site.
     */
    const elementosGerados = Array.from(
        qr.querySelectorAll("canvas, img, table")
    );

    elementosGerados.slice(1).forEach(elemento => elemento.remove());
}

async function verificarCertificado() {
    if (certificados.length === 0) {
        await carregarCertificados();
    }

    const campoNumero = obterElemento("certNumber");
    const painel = obterElemento("resultadoCertificado");

    if (!campoNumero || !painel) {
        console.error("Elementos de pesquisa de certificação indisponíveis.");
        return;
    }

    const numero = campoNumero.value.trim().toUpperCase();

    limparResultadoCertificado();
    painel.style.display = "block";

    if (!numero) {
        const estado = obterElemento("resEstado");

        if (estado) {
            estado.textContent = "⚠️ Introduza um número de certificação.";
        }

        return;
    }

    const resultado = certificados.find(certificado =>
        formatarTexto(certificado.numero, "").toUpperCase() === numero
    );

    if (!resultado) {
        const estado = obterElemento("resEstado");

        if (estado) {
            estado.textContent = "❌ Certificação não encontrada";
        }

        ["resNumero", "resNome", "resNivel", "resEmissao", "resValidade"]
            .forEach(id => {
                const campo = obterElemento(id);

                if (campo) {
                    campo.textContent = "-";
                }
            });

        definirEstado("-");
        document.title = "Certificação não encontrada | Auditores da Tasca";

        return;
    }

    const estado = obterElemento("resEstado");

    if (estado) {
        estado.textContent = "✅ Certificação encontrada";
    }

    const valores = {
        resNumero: resultado.numero,
        resNome: resultado.nome,
        resNivel: resultado.nivel,
        resEmissao: resultado.emissao,
        resValidade: resultado.validade
    };

    Object.entries(valores).forEach(([id, valor]) => {
        const campo = obterElemento(id);

        if (campo) {
            campo.textContent = formatarTexto(valor);
        }
    });

    definirBadge(resultado.nivel);
    definirEstado(resultado.estado);
    gerarQRCode(resultado.numero);

    document.title = `${formatarTexto(resultado.numero)} | Certificação ATA`;
}

function obterParametro(nome) {
    return new URLSearchParams(window.location.search).get(nome);
}

function obterQRTemporario(contentorQR) {
    return contentorQR.querySelector(`img.${QR_CLASSE_TEMPORARIA}`);
}

function removerQRTemporario(contentorQR) {
    contentorQR
        .querySelectorAll(`img.${QR_CLASSE_TEMPORARIA}`)
        .forEach(imagem => imagem.remove());
}

async function prepararQRParaPDF(contentorQR) {
    removerQRTemporario(contentorQR);

    const elementosOriginais = Array.from(
        contentorQR.querySelectorAll("canvas, img, table")
    );

    const canvasQR = contentorQR.querySelector("canvas");

    if (!canvasQR) {
        return {
            elementosOriginais,
            imagemTemporaria: null
        };
    }

    const imagemTemporaria = document.createElement("img");

    imagemTemporaria.className = QR_CLASSE_TEMPORARIA;
    imagemTemporaria.alt = "QR Code da Certificação";
    imagemTemporaria.src = canvasQR.toDataURL("image/png");

    Object.assign(imagemTemporaria.style, {
        display: "block",
        width: `${QR_TAMANHO}px`,
        height: `${QR_TAMANHO}px`,
        margin: "0 auto"
    });

    await new Promise(resolve => {
        imagemTemporaria.onload = resolve;
        imagemTemporaria.onerror = resolve;
    });

    /*
     * Esconde os elementos nativos e mantém apenas a cópia PNG durante
     * a captura. Assim o PDF recebe um QR único e legível.
     */
    elementosOriginais.forEach(elemento => {
        elemento.style.display = "none";
    });

    contentorQR.appendChild(imagemTemporaria);

    return {
        elementosOriginais,
        imagemTemporaria
    };
}

function restaurarQRAposPDF(contentorQR, elementosOriginais) {
    removerQRTemporario(contentorQR);

    elementosOriginais.forEach(elemento => {
        elemento.style.display = "";
    });

    /*
     * Segurança extra: se algum browser criar duplicados após o processo,
     * conserva apenas o primeiro QR original.
     */
    const elementosAtuais = Array.from(
        contentorQR.querySelectorAll("canvas, img, table")
    );

    elementosAtuais.slice(1).forEach(elemento => elemento.remove());
}

function guardarEstilosCertificado(elemento, corpoCertificado) {
    return {
        certificado: {
            width: elemento.style.width,
            minWidth: elemento.style.minWidth,
            maxWidth: elemento.style.maxWidth,
            margin: elemento.style.margin,
            padding: elemento.style.padding,
            border: elemento.style.border,
            borderRadius: elemento.style.borderRadius,
            boxSizing: elemento.style.boxSizing,
            transform: elemento.style.transform
        },
        corpo: corpoCertificado
            ? {
                display: corpoCertificado.style.display,
                gridTemplateColumns: corpoCertificado.style.gridTemplateColumns,
                gap: corpoCertificado.style.gap
            }
            : null
    };
}

function aplicarLayoutPDF(elemento, corpoCertificado) {
    Object.assign(elemento.style, {
        width: "794px",
        minWidth: "794px",
        maxWidth: "794px",
        margin: "0 auto",
        padding: "40px",
        boxSizing: "border-box",
        border: "none",
        borderRadius: "0",
        transform: "none"
    });

    if (corpoCertificado) {
        Object.assign(corpoCertificado.style, {
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "25px"
        });
    }
}

function restaurarLayoutPDF(elemento, corpoCertificado, estilos) {
    Object.assign(elemento.style, estilos.certificado);

    if (corpoCertificado && estilos.corpo) {
        Object.assign(corpoCertificado.style, estilos.corpo);
    }
}

function criarPDF(canvas, numeroCertificado) {
    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true
    });

    const larguraPagina = pdf.internal.pageSize.getWidth();
    const alturaPagina = pdf.internal.pageSize.getHeight();

    const margemExterior = 8;
    const margemConteudo = 15;

    pdf.setDrawColor(212, 175, 55);
    pdf.setLineWidth(1.2);

    pdf.roundedRect(
        margemExterior,
        margemExterior,
        larguraPagina - (margemExterior * 2),
        alturaPagina - (margemExterior * 2),
        3,
        3,
        "S"
    );

    const larguraUtil = larguraPagina - (margemConteudo * 2);
    const alturaUtil = alturaPagina - (margemConteudo * 2);

    let larguraImagem = larguraUtil;
    let alturaImagem = (canvas.height * larguraImagem) / canvas.width;

    if (alturaImagem > alturaUtil) {
        const fatorReducao = alturaUtil / alturaImagem;

        larguraImagem *= fatorReducao;
        alturaImagem *= fatorReducao;
    }

    const posicaoX = (larguraPagina - larguraImagem) / 2;
    const posicaoY = (alturaPagina - alturaImagem) / 2;

    pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.96),
        "JPEG",
        posicaoX,
        posicaoY,
        larguraImagem,
        alturaImagem,
        undefined,
        "FAST"
    );

    pdf.save(`${formatarTexto(numeroCertificado, "Certificado")}.pdf`);
}

async function gerarPDF() {
    const botao = obterElemento("btnPDF");
    const elemento = obterElemento("printArea");
    const contentorQR = obterElemento("qrCode");

    if (!botao || !elemento || !contentorQR) {
        console.error("Área ou botão de certificado indisponível.");
        return;
    }

    if (!window.html2canvas || !window.jspdf) {
        console.error("Bibliotecas de PDF indisponíveis.");
        alert("Não foi possível carregar as bibliotecas de PDF.");
        return;
    }

    botao.disabled = true;
    botao.style.display = "none";

    const corpoCertificado = elemento.querySelector(".certificate-body");
    const estilos = guardarEstilosCertificado(elemento, corpoCertificado);

    let elementosQROriginais = [];

    try {
        await esperarFrame();
        await esperarFrame();

        const qrPreparado = await prepararQRParaPDF(contentorQR);
        elementosQROriginais = qrPreparado.elementosOriginais;

        aplicarLayoutPDF(elemento, corpoCertificado);

        await esperar(350);

        const larguraCaptura = elemento.scrollWidth;
        const alturaCaptura = elemento.scrollHeight;

        const canvas = await html2canvas(elemento, {
            backgroundColor: "#ffffff",
            useCORS: true,
            scale: 1.5,
            width: larguraCaptura,
            height: alturaCaptura,
            windowWidth: larguraCaptura,
            windowHeight: alturaCaptura,
            scrollX: 0,
            scrollY: -window.scrollY,
            ignoreElements: item => item.classList.contains("no-print"),
            logging: false
        });

        const numeroCertificado = obterElemento("resNumero")?.textContent.trim();

        criarPDF(canvas, numeroCertificado);

    } catch (erro) {
        console.error("Erro ao gerar o PDF:", erro);
        alert("Não foi possível gerar o certificado. Tente novamente.");

    } finally {
        restaurarQRAposPDF(contentorQR, elementosQROriginais);
        restaurarLayoutPDF(elemento, corpoCertificado, estilos);

        botao.disabled = false;
        botao.style.display = "block";
    }
}

window.addEventListener("DOMContentLoaded", async () => {
    await carregarCertificados();

    const cert = obterParametro("cert");

    if (cert) {
        const campoNumero = obterElemento("certNumber");

        if (campoNumero) {
            campoNumero.value = cert;
            verificarCertificado();
        }
    }
});

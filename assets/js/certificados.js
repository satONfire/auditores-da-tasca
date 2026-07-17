let certificados = [];

async function carregarCertificados() {
    try {
        const resposta = await fetch("assets/data/certificados.json");

        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        certificados = await resposta.json();
    } catch (erro) {
        console.error("Erro ao carregar certificados:", erro);
        certificados = [];
    }
}

function limparResultadoCertificado() {
    document.getElementById("resEstado").textContent = "";
    document.getElementById("resNumero").textContent = "";
    document.getElementById("resNome").textContent = "";
    document.getElementById("resNivel").textContent = "";
    document.getElementById("resEmissao").textContent = "";
    document.getElementById("resValidade").textContent = "";
    document.getElementById("resSituacao").textContent = "";

    const badge = document.getElementById("resBadge");
    badge.removeAttribute("src");
    badge.alt = "Badge da Certificação";

    document.getElementById("qrCode").innerHTML = "";
}

function definirBadge(nivel) {
    const badge = document.getElementById("resBadge");

    const badgesPorNivel = {
        "Certified": "assets/img/certified.png",
        "Senior": "assets/img/senior.png",
        "Elite": "assets/img/elite.png",
        "Elite Auditor": "assets/img/elite.png",
        "Legend": "assets/img/legend.png"
    };

    badge.src = badgesPorNivel[nivel] || "";
    badge.alt = badge.src
        ? `Badge de certificação: ${nivel}`
        : "Badge da Certificação";
}

function definirEstado(estadoCertificado) {
    const estado = document.getElementById("resSituacao");

    estado.textContent = estadoCertificado || "-";
    estado.style.fontWeight = "bold";

    const coresPorEstado = {
        "Válido": "#32c36c",
        "Expirado": "#ffb400",
        "Revogado": "#ff4d4d"
    };

    estado.style.color = coresPorEstado[estadoCertificado] || "#ffffff";
}

function gerarQRCode(numeroCertificado) {
    const qr = document.getElementById("qrCode");

    qr.innerHTML = "";

    new QRCode(qr, {
        text: `${window.location.origin}/verificar-certificacao.html?cert=${encodeURIComponent(numeroCertificado)}`,
        width: 140,
        height: 140
    });
}

async function verificarCertificado() {
    if (certificados.length === 0) {
        await carregarCertificados();
    }

    const numero = document
        .getElementById("certNumber")
        .value
        .trim()
        .toUpperCase();

    const painel = document.getElementById("resultadoCertificado");

    // Elimina imediatamente QR code, badge e dados da pesquisa anterior.
    limparResultadoCertificado();

    if (!numero) {
        painel.style.display = "block";
        document.getElementById("resEstado").textContent =
            "⚠️ Introduza um número de certificação.";
        return;
    }

    const resultado = certificados.find(certificado =>
        String(certificado.numero).trim().toUpperCase() === numero
    );

    painel.style.display = "block";

    if (!resultado) {
        document.getElementById("resEstado").textContent =
            "❌ Certificação não encontrada";

        document.getElementById("resNumero").textContent = "-";
        document.getElementById("resNome").textContent = "-";
        document.getElementById("resNivel").textContent = "-";
        document.getElementById("resEmissao").textContent = "-";
        document.getElementById("resValidade").textContent = "-";

        definirEstado("-");
        document.title = "Certificação não encontrada | Auditores da Tasca";

        return;
    }

    document.getElementById("resEstado").textContent =
        "✅ Certificação encontrada";

    document.getElementById("resNumero").textContent = resultado.numero;
    document.getElementById("resNome").textContent = resultado.nome;
    document.getElementById("resNivel").textContent = resultado.nivel;
    document.getElementById("resEmissao").textContent = resultado.emissao;
    document.getElementById("resValidade").textContent = resultado.validade;

    definirBadge(resultado.nivel);
    definirEstado(resultado.estado);
    gerarQRCode(resultado.numero);

    document.title = `${resultado.numero} | Certificação ATA`;
}

function obterParametro(nome) {
    const parametros = new URLSearchParams(window.location.search);
    return parametros.get(nome);
}

window.addEventListener("DOMContentLoaded", async () => {
    await carregarCertificados();

    const cert = obterParametro("cert");

    if (cert) {
        document.getElementById("certNumber").value = cert;
        verificarCertificado();
    }
});

async function gerarPDF() {
    const botao = document.getElementById("btnPDF");
    const elemento = document.getElementById("printArea");

    if (!elemento) {
        console.error("Área do certificado não encontrada.");
        return;
    }

    botao.disabled = true;
    botao.style.display = "none";

    try {
        const larguraPDF = 794;
        const escala = Math.min(window.devicePixelRatio || 1, 2);

        const canvas = await html2canvas(elemento, {
            backgroundColor: "#ffffff",
            useCORS: true,
            scale: escala,

            // Força uma área completa de captura.
            width: elemento.scrollWidth,
            height: elemento.scrollHeight,
            windowWidth: larguraPDF,
            windowHeight: elemento.scrollHeight,

            scrollX: 0,
            scrollY: -window.scrollY,

            ignoreElements: elementoAtual =>
                elementoAtual.classList.contains("no-print"),

            // Modifica somente a cópia interna usada pelo html2canvas.
            onclone: documentoClonado => {
                const certificado = documentoClonado.getElementById("printArea");
                const botaoClonado = documentoClonado.getElementById("btnPDF");

                if (certificado) {
                    certificado.style.width = `${larguraPDF}px`;
                    certificado.style.maxWidth = `${larguraPDF}px`;
                    certificado.style.minWidth = `${larguraPDF}px`;
                    certificado.style.margin = "0";
                    certificado.style.boxSizing = "border-box";
                }

                if (botaoClonado) {
                    botaoClonado.style.display = "none";
                }

                const estilo = documentoClonado.createElement("style");

                estilo.textContent = `
                    #printArea {
                        width: ${larguraPDF}px !important;
                        max-width: ${larguraPDF}px !important;
                        min-width: ${larguraPDF}px !important;
                        box-sizing: border-box !important;
                    }

                    #printArea .certificate-body {
                        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                    }

                    #printArea .no-print {
                        display: none !important;
                    }
                `;

                documentoClonado.head.appendChild(estilo);
            }
        });

        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
            compress: true
        });

        const margem = 10;
        const larguraPagina = pdf.internal.pageSize.getWidth();
        const alturaPagina = pdf.internal.pageSize.getHeight();
        const larguraUtil = larguraPagina - margem * 2;
        const alturaUtil = alturaPagina - margem * 2;

        let larguraImagem = larguraUtil;
        let alturaImagem = (canvas.height * larguraImagem) / canvas.width;

        if (alturaImagem > alturaUtil) {
            const fator = alturaUtil / alturaImagem;
            larguraImagem *= fator;
            alturaImagem *= fator;
        }

        const posicaoX = (larguraPagina - larguraImagem) / 2;

        pdf.addImage(
            canvas.toDataURL("image/jpeg", 0.95),
            "JPEG",
            posicaoX,
            margem,
            larguraImagem,
            alturaImagem,
            undefined,
            "FAST"
        );

        const numero = document.getElementById("resNumero").textContent.trim() ||
            "Certificado";

        pdf.save(`${numero}.pdf`);

    } catch (erro) {
        console.error("Erro ao gerar o PDF:", erro);
        alert("Não foi possível gerar o certificado. Tente novamente.");
    } finally {
        botao.disabled = false;
        botao.style.display = "block";
    }
}

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

    if (!elemento || !window.html2canvas || !window.jspdf) {
        console.error("Não foi possível iniciar a geração do PDF.");
        return;
    }

    botao.disabled = true;
    botao.style.display = "none";

    const estilosOriginais = {
        width: elemento.style.width,
        minWidth: elemento.style.minWidth,
        maxWidth: elemento.style.maxWidth,
        margin: elemento.style.margin,
        padding: elemento.style.padding,
        transform: elemento.style.transform,
        boxSizing: elemento.style.boxSizing,
        border: elemento.style.border,
        borderRadius: elemento.style.borderRadius
    };

    try {
        /*
         * Layout fixo de exportação. O padding exterior branco dá espaço
         * ao html2canvas para não cortar o aro nas extremidades.
         */
        elemento.style.width = "874px";
        elemento.style.minWidth = "874px";
        elemento.style.maxWidth = "874px";
        elemento.style.margin = "0 auto";
        elemento.style.padding = "40px";
        elemento.style.boxSizing = "border-box";
        elemento.style.background = "#ffffff";
        elemento.style.transform = "none";

        /*
         * O aro deve ficar dentro do espaço de captura, não encostado
         * ao limite exterior do elemento.
         */
        elemento.style.border = "8px solid #d4af37";
        elemento.style.borderRadius = "15px";

        const corpoCertificado = elemento.querySelector(".certificate-body");

        const estilosCorpo = corpoCertificado
            ? {
                display: corpoCertificado.style.display,
                gridTemplateColumns: corpoCertificado.style.gridTemplateColumns,
                gap: corpoCertificado.style.gap
            }
            : null;

        if (corpoCertificado) {
            corpoCertificado.style.display = "grid";
            corpoCertificado.style.gridTemplateColumns =
                "repeat(2, minmax(0, 1fr))";
            corpoCertificado.style.gap = "25px";
        }

        await new Promise(resolve => setTimeout(resolve, 300));

        const largura = elemento.scrollWidth;
        const altura = elemento.scrollHeight;

        /*
         * Escala 1.5 evita ultrapassar limites de canvas no Safari/iOS.
         * O html2canvas recomenda considerar os limites de dimensão
         * e área do canvas, sobretudo em dispositivos móveis. 
         */
        const canvas = await html2canvas(elemento, {
            backgroundColor: "#ffffff",
            useCORS: true,
            scale: 1.5,

            width: largura,
            height: altura,
            windowWidth: largura,
            windowHeight: altura,

            scrollX: 0,
            scrollY: -window.scrollY,
            x: 0,
            y: 0,

            ignoreElements: item =>
                item.classList.contains("no-print"),

            logging: false
        });

        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
            compress: true
        });

        const margemPDF = 10;
        const larguraPagina = pdf.internal.pageSize.getWidth();
        const alturaPagina = pdf.internal.pageSize.getHeight();

        const larguraUtil = larguraPagina - (margemPDF * 2);
        const alturaUtil = alturaPagina - (margemPDF * 2);

        let larguraImagem = larguraUtil;
        let alturaImagem = (canvas.height * larguraImagem) / canvas.width;

        if (alturaImagem > alturaUtil) {
            const fator = alturaUtil / alturaImagem;
            larguraImagem *= fator;
            alturaImagem *= fator;
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

        const numero = document
            .getElementById("resNumero")
            .textContent
            .trim() || "Certificado";

        pdf.save(`${numero}.pdf`);

    } catch (erro) {
        console.error("Erro ao gerar o PDF:", erro);
        alert("Não foi possível gerar o certificado. Tente novamente.");

    } finally {
        elemento.style.width = estilosOriginais.width;
        elemento.style.minWidth = estilosOriginais.minWidth;
        elemento.style.maxWidth = estilosOriginais.maxWidth;
        elemento.style.margin = estilosOriginais.margin;
        elemento.style.padding = estilosOriginais.padding;
        elemento.style.transform = estilosOriginais.transform;
        elemento.style.boxSizing = estilosOriginais.boxSizing;
        elemento.style.border = estilosOriginais.border;
        elemento.style.borderRadius = estilosOriginais.borderRadius;

        if (corpoCertificado && estilosCorpo) {
            corpoCertificado.style.display = estilosCorpo.display;
            corpoCertificado.style.gridTemplateColumns =
                estilosCorpo.gridTemplateColumns;
            corpoCertificado.style.gap = estilosCorpo.gap;
        }

        botao.disabled = false;
        botao.style.display = "block";
    }
}

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
    const qrCanvas = document.querySelector("#qrCode canvas");

    if (!elemento || !window.html2canvas || !window.jspdf) {
        console.error("Bibliotecas ou área do certificado indisponíveis.");
        return;
    }

    botao.disabled = true;
    botao.style.display = "none";

    let imagemQR = null;
    let qrCanvasOriginal = null;

    const estilosOriginais = {
        width: elemento.style.width,
        minWidth: elemento.style.minWidth,
        maxWidth: elemento.style.maxWidth,
        margin: elemento.style.margin,
        padding: elemento.style.padding,
        border: elemento.style.border,
        borderRadius: elemento.style.borderRadius,
        boxSizing: elemento.style.boxSizing,
        transform: elemento.style.transform
    };

    const corpoCertificado = elemento.querySelector(".certificate-body");

    const estilosCorpo = corpoCertificado
        ? {
            display: corpoCertificado.style.display,
            gridTemplateColumns: corpoCertificado.style.gridTemplateColumns,
            gap: corpoCertificado.style.gap
        }
        : null;

    try {
        /*
         * Aguarda duas atualizações visuais do browser.
         * É importante para o QR code estar concluído no telemóvel.
         */
        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => requestAnimationFrame(resolve));

        /*
         * Transforma o QR code (canvas) numa imagem PNG temporária.
         * Isto torna a captura consistente em PC, Android e iPhone.
         */
        if (qrCanvas) {
            try {
                imagemQR = document.createElement("img");
                imagemQR.src = qrCanvas.toDataURL("image/png");
                imagemQR.alt = "QR Code da Certificação";

                Object.assign(imagemQR.style, {
                    display: "block",
                    width: "140px",
                    height: "140px",
                    margin: "0 auto"
                });

                qrCanvasOriginal = qrCanvas;
                qrCanvasOriginal.style.display = "none";
                qrCanvasOriginal.parentNode.appendChild(imagemQR);

                await new Promise(resolve => {
                    imagemQR.onload = resolve;
                    imagemQR.onerror = resolve;
                });
            } catch (erroQR) {
                console.warn("QR code não pôde ser convertido para imagem.", erroQR);
            }
        }

        /*
         * Layout estável para exportação. Não criamos elementos fora do ecrã.
         * A moldura CSS é removida só durante a captura.
         */
        elemento.style.width = "794px";
        elemento.style.minWidth = "794px";
        elemento.style.maxWidth = "794px";
        elemento.style.margin = "0 auto";
        elemento.style.padding = "40px";
        elemento.style.boxSizing = "border-box";
        elemento.style.border = "none";
        elemento.style.borderRadius = "0";
        elemento.style.transform = "none";

        /*
         * Mantém os seis campos numa grelha 2x3 durante a exportação,
         * mesmo que a operação seja iniciada no telemóvel.
         */
        if (corpoCertificado) {
            corpoCertificado.style.display = "grid";
            corpoCertificado.style.gridTemplateColumns =
                "repeat(2, minmax(0, 1fr))";
            corpoCertificado.style.gap = "25px";
        }

        await new Promise(resolve => setTimeout(resolve, 350));

        const larguraCaptura = elemento.scrollWidth;
        const alturaCaptura = elemento.scrollHeight;

        const canvas = await html2canvas(elemento, {
            backgroundColor: "#ffffff",
            useCORS: true,

            /*
             * 1.5 é um compromisso entre qualidade e fiabilidade
             * nos limites de canvas de dispositivos móveis.
             */
            scale: 1.5,

            width: larguraCaptura,
            height: alturaCaptura,
            windowWidth: larguraCaptura,
            windowHeight: alturaCaptura,

            scrollX: 0,
            scrollY: -window.scrollY,

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

        /*
         * Moldura vetorial: não depende de CSS, viewport ou html2canvas.
         * Dimensões de uma A4: 210 x 297 mm.
         */
        const margemExterior = 8;
        const larguraPagina = pdf.internal.pageSize.getWidth();
        const alturaPagina = pdf.internal.pageSize.getHeight();

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

        /*
         * Área reservada dentro do aro: 15 mm em cada lado.
         */
        const margemConteudo = 15;
        const larguraUtil = larguraPagina - (margemConteudo * 2);
        const alturaUtil = alturaPagina - (margemConteudo * 2);

        let larguraImagem = larguraUtil;
        let alturaImagem = (canvas.height * larguraImagem) / canvas.width;

        /*
         * Nunca corta o conteúdo: reduz proporcionalmente, se necessário.
         */
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

        const numero = document
            .getElementById("resNumero")
            .textContent
            .trim() || "Certificado";

        pdf.save(`${numero}.pdf`);

    } catch (erro) {
        console.error("Erro ao gerar o PDF:", erro);
        alert("Não foi possível gerar o certificado. Tente novamente.");

    } finally {
        /*
         * Remove a imagem QR temporária e volta a mostrar o canvas original.
         */
        if (imagemQR) {
            imagemQR.remove();
        }

        if (qrCanvasOriginal) {
            qrCanvasOriginal.style.display = "";
        }

        /*
         * Restaura o certificado visível exatamente como era.
         */
        elemento.style.width = estilosOriginais.width;
        elemento.style.minWidth = estilosOriginais.minWidth;
        elemento.style.maxWidth = estilosOriginais.maxWidth;
        elemento.style.margin = estilosOriginais.margin;
        elemento.style.padding = estilosOriginais.padding;
        elemento.style.border = estilosOriginais.border;
        elemento.style.borderRadius = estilosOriginais.borderRadius;
        elemento.style.boxSizing = estilosOriginais.boxSizing;
        elemento.style.transform = estilosOriginais.transform;

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

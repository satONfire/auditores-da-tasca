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
        Certified: "assets/img/certified.png",
        Senior: "assets/img/senior.png",
        Elite: "assets/img/elite.png",
        "Elite Auditor": "assets/img/elite.png",
        Legend: "assets/img/legend.png"
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
        Expirado: "#ffb400",
        Revogado: "#ff4d4d"
    };

    estado.style.color = coresPorEstado[estadoCertificado] || "#ffffff";
}

function gerarQRCode(numeroCertificado) {
    const qr = document.getElementById("qrCode");

    qr.innerHTML = "";

    const urlCertificado =
        `${window.location.origin}/verificar-certificacao.html?cert=` +
        encodeURIComponent(numeroCertificado);

    new QRCode(qr, {
        text: urlCertificado,
        width: 140,
        height: 140,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.L
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
    return new URLSearchParams(window.location.search).get(nome);
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
    const contentorQR = document.getElementById("qrCode");

    if (!elemento || !contentorQR || !window.html2canvas || !window.jspdf) {
        console.error("Bibliotecas ou área do certificado indisponíveis.");
        return;
    }

    botao.disabled = true;
    botao.style.display = "none";

    let imagemQR = null;
    let elementosQROriginais = [];

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
        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => requestAnimationFrame(resolve));

        /*
         * QRCode.js pode criar canvas, imagem ou tabela, conforme o browser.
         * Guardamos os elementos atuais e ocultamo-los antes de inserir
         * uma única versão PNG para a captura do html2canvas.
         */
        elementosQROriginais = Array.from(
            contentorQR.querySelectorAll("canvas, img, table")
        );

        const canvasQR = contentorQR.querySelector("canvas");

        if (canvasQR) {
            imagemQR = document.createElement("img");
            imagemQR.src = canvasQR.toDataURL("image/png");
            imagemQR.alt = "QR Code da Certificação";

            Object.assign(imagemQR.style, {
                display: "block",
                width: "140px",
                height: "140px",
                margin: "0 auto"
            });

            await new Promise(resolve => {
                imagemQR.onload = resolve;
                imagemQR.onerror = resolve;
            });
        }

        elementosQROriginais.forEach(elementoQR => {
            elementoQR.style.display = "none";
        });

        if (imagemQR) {
            contentorQR.appendChild(imagemQR);
        }

        /*
         * Formato fixo para captura, independentemente do dispositivo.
         * A moldura CSS é ocultada: a moldura dourada é desenhada pelo jsPDF.
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

        const margemConteudo = 15;
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
         * Remove apenas o PNG temporário e volta a mostrar os elementos
         * QR originais criados pela biblioteca.
         */
        if (imagemQR) {
            imagemQR.remove();
        }

        elementosQROriginais.forEach(elementoQR => {
            elementoQR.style.display = "";
        });

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

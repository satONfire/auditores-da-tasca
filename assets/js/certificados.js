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
    const original = document.getElementById("printArea");

    if (!original || !window.html2canvas || !window.jspdf) {
        console.error("Não foi possível iniciar a geração do PDF.");
        return;
    }

    botao.disabled = true;
    botao.style.display = "none";

    let areaPDF = null;

    try {
        /*
         * Cria uma cópia autónoma em formato desktop.
         * A cópia fica fora do ecrã: não interfere com o layout visível.
         */
        areaPDF = original.cloneNode(true);
        areaPDF.id = "printAreaPDF";

        const botaoPDFClonado = areaPDF.querySelector("#btnPDF");
        if (botaoPDFClonado) {
            botaoPDFClonado.remove();
        }

        const larguraCaptura = 794;
        const margemCaptura = 24;

        Object.assign(areaPDF.style, {
            position: "fixed",
            left: "-10000px",
            top: "0",
            display: "block",
            visibility: "visible",
            width: `${larguraCaptura}px`,
            minWidth: `${larguraCaptura}px`,
            maxWidth: `${larguraCaptura}px`,
            margin: "0",
            padding: "50px",
            boxSizing: "border-box",
            background: "#ffffff",
            color: "#222222",
            overflow: "visible",
            transform: "none"
        });

        document.body.appendChild(areaPDF);

        /*
         * Força apenas a cópia a usar duas colunas.
         * Evita as media queries mobile que causavam o corte.
         */
        const corpoCertificado = areaPDF.querySelector(".certificate-body");

        if (corpoCertificado) {
            Object.assign(corpoCertificado.style, {
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "25px",
                width: "100%"
            });
        }

        const rodapeCertificado = areaPDF.querySelector(".certificate-footer");

        if (rodapeCertificado) {
            Object.assign(rodapeCertificado.style, {
                display: "block",
                width: "100%",
                textAlign: "center"
            });
        }

        // Garante que imagens e QR code terminam de carregar antes da captura.
        const imagens = Array.from(areaPDF.querySelectorAll("img"));

        await Promise.all(
            imagens.map(imagem => {
                if (imagem.complete) {
                    return Promise.resolve();
                }

                return new Promise(resolve => {
                    imagem.onload = resolve;
                    imagem.onerror = resolve;
                });
            })
        );

        await new Promise(resolve => setTimeout(resolve, 250));

        const larguraReal = areaPDF.scrollWidth;
        const alturaReal = areaPDF.scrollHeight;

        const canvas = await html2canvas(areaPDF, {
            backgroundColor: "#ffffff",
            useCORS: true,
            scale: 2,

            width: larguraReal,
            height: alturaReal,
            windowWidth: larguraReal,
            windowHeight: alturaReal,

            scrollX: 0,
            scrollY: 0,
            x: 0,
            y: 0,

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

        const larguraDisponivel = larguraPagina - (margemPDF * 2);
        const alturaDisponivel = alturaPagina - (margemPDF * 2);

        let larguraImagem = larguraDisponivel;
        let alturaImagem = (canvas.height * larguraImagem) / canvas.width;

        /*
         * Se for mais alto do que a área útil A4, reduz mantendo proporções.
         * A posição é calculada após o redimensionamento, garantindo centragem.
         */
        if (alturaImagem > alturaDisponivel) {
            const escala = alturaDisponivel / alturaImagem;

            larguraImagem *= escala;
            alturaImagem *= escala;
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
        console.error("Erro ao gerar PDF:", erro);
        alert("Não foi possível gerar o certificado. Tente novamente.");
    } finally {
        if (areaPDF) {
            areaPDF.remove();
        }

        botao.disabled = false;
        botao.style.display = "block";
    }
}

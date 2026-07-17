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
    const qrOriginal = document.querySelector("#qrCode canvas");

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
         * Aguarda a atualização visual do browser depois de esconder o botão.
         */
        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => requestAnimationFrame(resolve));

        /*
         * No telemóvel, o QR code é normalmente um canvas. Convertemo-lo
         * para imagem temporariamente para o html2canvas o capturar sempre.
         */
        let imagemQR = null;

        if (qrOriginal) {
            try {
                imagemQR = document.createElement("img");
                imagemQR.src = qrOriginal.toDataURL("image/png");
                imagemQR.alt = "QR Code da Certificação";

                Object.assign(imagemQR.style, {
                    width: "140px",
                    height: "140px",
                    display: "block",
                    margin: "0 auto"
                });

                qrOriginal.style.display = "none";
                qrOriginal.parentNode.appendChild(imagemQR);

                await new Promise(resolve => {
                    imagemQR.onload = resolve;
                    imagemQR.onerror = resolve;
                });
            } catch (erroQR) {
                console.warn("Não foi possível converter o QR code:", erroQR);
            }
        }

        /*
         * Força a exportação a usar uma largura de desktop.
         * Não é criada uma cópia fora do ecrã, evitando falhas de renderização.
         */
        elemento.style.width = "794px";
        elemento.style.minWidth = "794px";
        elemento.style.maxWidth = "794px";
        elemento.style.margin = "0 auto";
        elemento.style.transform = "none";

        if (corpoCertificado) {
            corpoCertificado.style.display = "grid";
            corpoCertificado.style.gridTemplateColumns =
                "repeat(2, minmax(0, 1fr))";
            corpoCertificado.style.gap = "25px";
        }

        await new Promise(resolve => setTimeout(resolve, 450));

        const largura = elemento.scrollWidth;
        const altura = elemento.scrollHeight;

        const canvas = await html2canvas(elemento, {
            backgroundColor: "#ffffff",
            useCORS: true,

            /*
             * Uma escala moderada evita PDFs vazios ou incompletos
             * por limites de memória em Safari/iOS e Android.
             */
            scale: 1.5,

            width: largura,
            height: altura,
            windowWidth: largura,
            windowHeight: altura,

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

        /*
         * Restaura a versão canvas do QR code após exportar.
         */
        if (imagemQR) {
            imagemQR.remove();
        }

        if (qrOriginal) {
            qrOriginal.style.display = "";
        }

    } catch (erro) {
        console.error("Erro ao gerar o PDF:", erro);
        alert("Não foi possível gerar o certificado. Tente novamente.");

    } finally {
        /*
         * Restaura sempre o layout normal, inclusive se houver erro.
         */
        elemento.style.width = estilosOriginais.width;
        elemento.style.minWidth = estilosOriginais.minWidth;
        elemento.style.maxWidth = estilosOriginais.maxWidth;
        elemento.style.margin = estilosOriginais.margin;
        elemento.style.transform = estilosOriginais.transform;

        if (corpoCertificado && estilosCorpo) {
            corpoCertificado.style.display = estilosCorpo.display;
            corpoCertificado.style.gridTemplateColumns =
                estilosCorpo.gridTemplateColumns;
            corpoCertificado.style.gap = estilosCorpo.gap;
        }

        /*
         * Garante a limpeza do QR convertido mesmo em caso de erro.
         */
        const imagemQRTemporaria = document.querySelector(
            "#qrCode img[alt='QR Code da Certificação']"
        );

        if (imagemQRTemporaria) {
            imagemQRTemporaria.remove();
        }

        if (qrOriginal) {
            qrOriginal.style.display = "";
        }

        botao.disabled = false;
        botao.style.display = "block";
    }
}

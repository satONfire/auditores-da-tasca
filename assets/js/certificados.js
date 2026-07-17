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

    botao.style.display = "none";

    const larguraOriginal = elemento.style.width;
    const maxWidthOriginal = elemento.style.maxWidth;
    const transformOriginal = elemento.style.transform;
    const marginOriginal = elemento.style.margin;

    try {
        elemento.style.width = "794px";
        elemento.style.maxWidth = "794px";
        elemento.style.margin = "0 auto";
        elemento.style.transform = "none";

        await new Promise(resolve => setTimeout(resolve, 200));

        const canvas = await html2canvas(elemento, {
            scale: 3,
            useCORS: true,
            backgroundColor: "#ffffff",
            windowWidth: 794,
            scrollX: 0,
            scrollY: 0,
            ignoreElements: element => element.classList.contains("no-print")
        });

        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const margem = 10;
        const larguraPagina = pdf.internal.pageSize.getWidth();
        const alturaPagina = pdf.internal.pageSize.getHeight();
        const larguraUtil = larguraPagina - margem * 2;
        const alturaUtil = alturaPagina - margem * 2;

        let largura = larguraUtil;
        let altura = (canvas.height * largura) / canvas.width;

        if (altura > alturaUtil) {
            const escala = alturaUtil / altura;
            altura *= escala;
            largura *= escala;
        }

        const posX = (larguraPagina - largura) / 2;

        pdf.addImage(
            canvas.toDataURL("image/png"),
            "PNG",
            posX,
            margem,
            largura,
            altura
        );

        const numero = document.getElementById("resNumero").textContent || "Certificado";
        pdf.save(`${numero}.pdf`);
    } finally {
        elemento.style.width = larguraOriginal;
        elemento.style.maxWidth = maxWidthOriginal;
        elemento.style.transform = transformOriginal;
        elemento.style.margin = marginOriginal;
        botao.style.display = "block";
    }
}

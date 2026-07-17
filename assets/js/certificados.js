let certificados = [];

async function carregarCertificados() {

    try {

        const resposta = await fetch("assets/data/certificados.json");

        certificados = await resposta.json();

    } catch (erro) {

        console.error("Erro ao carregar certificados:", erro);

    }

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

    const resultado = certificados.find(certificado =>
        certificado.numero.toUpperCase() === numero
    );

    const painel = document.getElementById("resultadoCertificado");

    painel.style.display = "block";

    if (!resultado) {

        document.getElementById("resEstado").textContent =
            "❌ Certificação não encontrada";

        document.getElementById("resBadge").textContent = "";
        document.title =resultado.numero + " | Sem Certificação ATA";

        return;

    }

    document.getElementById("resEstado").textContent =
        "✅ Certificação encontrada";

const badge = document.getElementById("resBadge");

switch(resultado.nivel){

    case "Certified":
    case "Certified":
        badge.src = "assets/img/certified.png";
        break;

    case "Senior":
    case "Senior":
        badge.src = "assets/img/senior.png";
        break;

    case "Elite":
    case "Elite Auditor":
        badge.src = "assets/img/elite.png";
        break;

    case "Legend":
    case "Legend":
        badge.src = "assets/img/legend.png";
        break;

    default:
        badge.src = "";
}
    const qr = document.getElementById("qrCode");

qr.innerHTML = "";

new QRCode(qr,{

    text:
    window.location.origin +
    "/verificar-certificacao.html?cert=" +
    resultado.numero,

    width:140,

    height:140

});

    document.getElementById("resNumero").textContent =
        resultado.numero;

    document.getElementById("resNome").textContent =
        resultado.nome;

    document.getElementById("resNivel").textContent =
        resultado.nivel;

    document.getElementById("resEmissao").textContent =
        resultado.emissao;

    document.getElementById("resValidade").textContent =
        resultado.validade;

    const estado = document.getElementById("resSituacao");

    estado.textContent = resultado.estado;

    estado.style.fontWeight = "bold";

    switch (resultado.estado) {

        case "Válido":
            estado.style.color = "#32c36c";
            break;

        case "Expirado":
            estado.style.color = "#ffb400";
            break;

        case "Revogado":
            estado.style.color = "#ff4d4d";
            break;

        default:
            estado.style.color = "#ffffff";

    }

}

// Inicialização efetuada no bloco seguinte
function obterParametro(nome){

    const parametros = new URLSearchParams(window.location.search);

    return parametros.get(nome);

}

window.addEventListener("DOMContentLoaded", async () => {

    await carregarCertificados();

    const cert = obterParametro("cert");

    if(cert){

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
    ignoreElements: (element) => element.classList.contains("no-print")
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
let altura = canvas.height * largura / canvas.width;

// Se ultrapassar a altura da folha,
// reduz proporcionalmente para caber tudo.
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

        pdf.save(numero + ".pdf");

    } finally {

        elemento.style.width = larguraOriginal;
        elemento.style.maxWidth = maxWidthOriginal;
        elemento.style.transform = transformOriginal;
        elemento.style.margin = marginOriginal;

        botao.style.display = "block";

    }

}

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
        document.title =resultado.numero + " | Certificação ATA";

        document.getElementById("resNumero").textContent = "-";
        document.getElementById("resNome").textContent = "-";
        document.getElementById("resNivel").textContent = "-";
        document.getElementById("resEmissao").textContent = "-";
        document.getElementById("resValidade").textContent = "-";
        document.getElementById("resSituacao").textContent = "-";

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

const certificados = [

{

numero:"ATA-2026-0001",

nome:"Peter´s",

nivel:"Certified",

emissao:"15/07/2026",

validade:"15/07/2027",

estado:"Válido"

},

{

numero:"ATA-2026-0002",

nome:"Restaurante O Pipo",

nivel:"Elite Auditor",

emissao:"01/07/2026",

validade:"01/07/2029",

estado:"Válido"

},

{

numero:"ATA-2026-0003",

nome:"Jacinto Reserva Especial",

nivel:"Senior",

emissao:"10/01/2025",

validade:"10/01/2027",

estado:"Válido"

}
    ,

{

numero:"ATA-2026-0004",

nome:"Zé dos Cornos",

nivel:"Elite",

emissao:"10/01/2025",

validade:"10/01/2028",

estado:"Válido"

}
 ,

{

numero:"ATA-2026-0005",

nome:"Nuno lérias",

nivel:"Legend",

emissao:"10/07/2025",

validade:"N/A",

estado:"Válido"

}
];
function verificarCertificado() {

    const numero = document
        .getElementById("certNumber")
        .value
        .trim()
        .toUpperCase();

    const resultado = certificados.find(c =>
        c.numero.toUpperCase() === numero
    );

    const painel = document.getElementById("resultadoCertificado");

    if (!resultado) {

        painel.style.display = "block";

        document.getElementById("resEstado").textContent =
            "❌ Certificação não encontrada";

        document.getElementById("resBadge").textContent = "";

        document.getElementById("resNumero").textContent = "-";
        document.getElementById("resNome").textContent = "-";
        document.getElementById("resNivel").textContent = "-";
        document.getElementById("resEmissao").textContent = "-";
        document.getElementById("resValidade").textContent = "-";
        document.getElementById("resSituacao").textContent = "-";

        return;
    }

    painel.style.display = "block";

    document.getElementById("resEstado").textContent =
        "✅ Certificação encontrada";

    document.getElementById("resBadge").textContent =
        resultado.nivel;

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

    document.getElementById("resSituacao").textContent =
        resultado.estado;

}

document.addEventListener(
    "DOMContentLoaded",
    carregarAssinatura
);


async function carregarAssinatura() {

    const token =
        localStorage.getItem("token_cliente");


    // Verifica se o usuário está logado
    if (!token) {

        alert(
            "Você precisa estar logado para acessar sua assinatura."
        );

        window.location.href =
            "login.html";

        return;
    }


    const statusContainer =
        document.getElementById(
            "status_assinatura"
        );

    const botaoAssinar =
        document.getElementById(
            "btn_assinar"
        );


    try {

        const request = await fetch(
            `${API_BASE}/assinaturas/minha`,
            {
                method: "GET",

                headers: {

                    "Authorization":
                        `Bearer ${token}`

                }
            }
        );


        const resposta =
            await request.json();


        // Cliente possui assinatura
        if (request.ok && resposta.assinatura) {

            mostrarAssinatura(
                resposta.assinatura
            );

            return;
        }


        // Cliente NÃO possui assinatura
        statusContainer.innerHTML = `
            <h3 style="color: #666;">
                Você ainda não possui uma assinatura ativa.
            </h3>

            <p style="margin-top: 10px;">
                Assine o plano mensal para utilizar
                reservas por assinatura.
            </p>
        `;


        botaoAssinar.style.display =
            "block";


    } catch (error) {

        console.error(
            "Erro ao consultar assinatura:",
            error
        );


        statusContainer.innerHTML = `
            <p style="color: red;">
                Não foi possível consultar sua assinatura.
            </p>
        `;
    }
}



function mostrarAssinatura(assinatura) {

    const statusContainer =
        document.getElementById(
            "status_assinatura"
        );

    const botaoAssinar =
        document.getElementById(
            "btn_assinar"
        );


    // Formatação das datas
    const dataInicio =
        formatarData(
            assinatura.data_inicio
        );

    const dataFim =
        formatarData(
            assinatura.data_fim
        );


    statusContainer.innerHTML = `

        <h3 style="color: green;">
            ✓ Assinatura Ativa
        </h3>

        <p style="margin-top: 15px;">
            <strong>Plano:</strong>
            ${assinatura.plano}
        </p>

        <p>
            <strong>Valor:</strong>
            R$ ${Number(
                assinatura.valor_mensal
            ).toFixed(2).replace(".", ",")}
        </p>

        <p>
            <strong>Início:</strong>
            ${dataInicio}
        </p>

        <p>
            <strong>Validade:</strong>
            ${dataFim}
        </p>

    `;


    // Se já existe assinatura,
    // não mostramos o botão de contratar
    botaoAssinar.style.display =
        "none";
}



async function criarAssinatura() {

    const token =
        localStorage.getItem(
            "token_cliente"
        );


    if (!token) {

        alert(
            "Você precisa estar logado para assinar."
        );

        window.location.href =
            "login.html";

        return;
    }


    const confirmacao =
        confirm(
            "Deseja contratar o Plano Mensal EazyCar por R$ 299,90?"
        );


    if (!confirmacao) {

        return;

    }


    try {

        const request = await fetch(
            `${API_BASE}/assinaturas`,
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${token}`

                }

            }
        );


        const resposta =
            await request.json();


        if (request.ok) {

            alert(
                resposta.mensagem ||
                "Assinatura realizada com sucesso!"
            );


            // Atualiza a tela
            carregarAssinatura();

        } else {

            alert(
                resposta.mensagem ||
                "Não foi possível realizar a assinatura."
            );

        }


    } catch (error) {

        console.error(
            "Erro ao criar assinatura:",
            error
        );


        alert(
            "Falha de conexão com a API."
        );

    }

}



function formatarData(data) {

    if (!data) {

        return "-";

    }


    const partes =
        data.split("-");


    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
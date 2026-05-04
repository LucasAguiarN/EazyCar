document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token_cliente");
    const pageId = document.body.id;

    if (token && pageId === "login_cliente") {
        window.location.replace("conta.html");
    }
});

async function autenticar_login() {
    let email = document.getElementById("email").value;
    let senha = document.getElementById("senha").value;
    let pageId = document.body.id;

    if (!email || !senha) {
        alert("Preencha email e senha!");
        return;
    }

    let dados = { email: email, senha: senha };
    let url = "";
    let href_logar = "";
    let nome_do_token = "";

    if (pageId == "login_funcionario") {
        url = "http://localhost:5000/funcionarios/login";
        href_logar = '../../pages/dashboard.html';
        nome_do_token = 'token_funcionario';
    } else {
        url = "http://localhost:5000/clientes/login";
        nome_do_token = 'token_cliente';

        if (sessionStorage.getItem('carSearchData')) {
            href_logar = '../reservar_veiculo.html';
        } else {
            href_logar = 'conta.html';
        }
    }

    try {
        let request = await fetch(url, {
            method: "POST",
            body: JSON.stringify(dados),
            headers: { "Content-Type": "application/json" }
        });

        let resposta = await request.json();

        if (!request.ok) {
            throw new Error(resposta.mensagem || "Email ou senha inválidos");
        }
        localStorage.setItem(nome_do_token, resposta.token);
        window.location.href = href_logar;

    } catch (error) {
        console.error("Erro:", error);
        alert(error.message);
    }
}
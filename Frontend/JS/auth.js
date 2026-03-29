async function autenticar_login() {
    let email = document.getElementById("email").value;
    let senha = document.getElementById("senha").value;
    let pageId = document.body.id;

    if (!email || !senha) {
        alert("Preencha email e senha!");
        return;
    }
    
    let dados = {
        email: email,
        senha: senha
    };

    if (pageId == "login_funcionario") {
        url = "http://localhost:5000/funcionarios/login";
        href_logar ='../../pages/dashboard.html';
    }
    else{
        url = "http://localhost:5000/clientes/login";
        href_logar ='../pages/Cliente/conta_cliente.html';
    }

    try {
        let request = await fetch(url, {
            method: "POST",
            body: JSON.stringify(dados),
            headers: {
                "Content-Type": "application/json"
            }
        });

        let resposta = await request.json();
        console.log(resposta);

        if (!request.ok) {
            throw new Error(resposta.mensagem || "Email ou senha inválidos");
        }

        alert("Login realizado com sucesso!");
        localStorage.setItem('token', resposta.token);
        window.location.href = href_logar;

    } catch (error) {
        console.error("Erro:", error);
        alert(error.message);
    }
}
async function autenticar_login() {
    let email = document.getElementById("email").value;
    let senha = document.getElementById("senha").value;

    if (!email || !senha) {
        alert("Preencha email e senha!");
        return;
    }
    
    let dados = {
        email: email,
        senha: senha
    };

    try {
        let request = await fetch("http://localhost:5000/clientes/login", {
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
        window.location.href = "../pages/conta_cliente.html";

    } catch (error) {
        console.error("Erro:", error);
        alert(error.message);
    }
}
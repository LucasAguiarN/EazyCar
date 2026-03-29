async function enviar_cadastro() {
    let nome = document.getElementById("nome").value;
    let email = document.getElementById("email").value;
    let cpf = document.getElementById("cpf").value;
    let senha = document.getElementById("senha").value;
    let celular = document.getElementById("celular").value;
    let cargo = document.getElementById("cargo").value;

    let dados = {
        nome: nome,
        cpf: cpf,
        email: email,
        senha: senha,
        celular: celular,
        cargo: cargo
    };

    try {
        let response = await fetch("http://localhost:5000/funcionarios", {
            method: "POST",
            body: JSON.stringify(dados),
            headers: {
                "Content-Type": "application/json"
            }
        });

        let resposta = await response.json();

        if (!response.ok) {
            throw new Error(resposta.mensagem || "Erro ao cadastrar funcionário");
        }

        alert("Cadastro realizado com sucesso!");
        window.location.href = "../../pages/Funcionário/login.html";

    } catch (error) {
        console.error("Erro:", error);
        alert(error.message);
    }
}
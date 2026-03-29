document.getElementById("cep").addEventListener("change", (event) => {
    buscar_endereco(event.target.value);
});

function validar_dados() {
    let nome = document.getElementById("nome").value;
    let email = document.getElementById("email").value;
    let cpf = document.getElementById("cpf").value;
    let senha = document.getElementById("senha").value;
    let celular = document.getElementById("celular").value;
    let cep = document.getElementById("cep").value;
    let endereco = document.getElementById("endereco").value;
    let numero = document.getElementById("numero").value;

    if (!nome || !email || !cpf || !senha || !celular || !cep || !endereco || !numero) {
        alert("Preencha todos os campos!");
        return;
    }

    enviar_cadastro(nome, email, cpf, senha, celular, cep, endereco, numero);
}

async function buscar_endereco() {
    let cep = document.getElementById("cep").value;
    try{
        let request = await fetch ("https://viacep.com.br/ws/"+cep+"/json/");        
        if (!request.ok){
            throw new Error("Erro!\nStatus "+response.status);
        }
        let resposta = await request.json();
        if (resposta.logradouro == undefined){
            alert("CEP Inválido!");
            document.getElementById("cep").value = "";
        }
        else{
            document.getElementById("endereco").value = resposta.logradouro;
        }
    }
    catch(error){
        document.getElementById("cep").value = "";
        alert("CEP Inválido!");
        console.log(error);
    }
}

async function enviar_cadastro(nome, email, cpf, senha, celular, cep, endereco, numero) {
    let complemento = document.getElementById("complemento").value;

    let dados = {
        nome: nome,
        cpf: cpf,
        email: email,
        senha: senha,
        celular: celular,
        cep: cep,
        endereco: endereco,
        numero: numero,
        complemento: complemento
    };

    try {
        let response = await fetch("http://localhost:5000/clientes", {
            method: "POST",
            body: JSON.stringify(dados),
            headers: {
                "Content-Type": "application/json"
            }
        });

        let resposta = await response.json();

        if (!response.ok) {
            throw new Error(resposta.mensagem || "Erro ao cadastrar cliente");
        }

        alert("Cadastro realizado com sucesso!");
        window.location.href = "../pages/Cliente/login.html";

    } catch (error) {
        console.error("Erro:", error);
        alert(error.message);
    }
}
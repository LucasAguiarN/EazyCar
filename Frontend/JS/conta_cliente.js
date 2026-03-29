token = localStorage.getItem('token');
console.log("Token:", token);

document.getElementById("cep").addEventListener("change", (event) => {
    buscar_endereco(event.target.value);
});

document.getElementById("btn_deletar").addEventListener("click", deletar_conta);

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

async function atualizar_cadastro() {
    let nome = document.getElementById("nome").value;
    let email = document.getElementById("email").value;
    let cpf = document.getElementById("cpf").value;
    let celular = document.getElementById("celular").value;
    let cep = document.getElementById("cep").value;
    let endereco = document.getElementById("endereco").value;
    let numero = document.getElementById("numero").value;
    let complemento = document.getElementById("complemento").value;

    let dados = {
        nome: nome,
        cpf: cpf,
        email: email,
        celular: celular,
        cep: cep,
        endereco: endereco,
        numero: numero,
        complemento: complemento
    };

    try {
        let response = await fetch("http://localhost:5000/clientes/conta", {
            method: "PUT",
            body: JSON.stringify(dados),
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
                }
        });

        let resposta = await response.json();

        if (!response.ok) {
            throw new Error(resposta.mensagem || "Erro ao cadastrar cliente");
        }

        alert("Cadastro atualizado com sucesso!");

    } catch (error) {
        console.error("Erro:", error);
        alert(error.message);
    }
}

async function deletar_conta() {
    try {
        let response = await fetch("http://localhost:5000/clientes/conta", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        let resposta = await response.json();

        if (!response.ok) {
            throw new Error(resposta.mensagem || "Erro ao deletar cliente");
        }

        alert("Conta deletada com sucesso!");
        localStorage.clear();
        window.location.href = "../pages/login.html";

    } catch (error) {
        console.error("Erro:", error);
        alert(error.message);
    }
}
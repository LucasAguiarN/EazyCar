token = localStorage.getItem('token');
let formulario = document.getElementById("form_editar");
formulario.style.display = "none";

document.getElementById("cep_editar").addEventListener("change", (event) => {
    buscar_endereco(event.target.value);
});

document.getElementById("btn_deslogar").addEventListener("click", deslogar);

document.getElementById("btn_editar").addEventListener("click", editar_conta);

document.getElementById("btn_deletar").addEventListener("click", deletar_conta);

function editar_conta() {
    let formulario = document.getElementById("form_editar");
    let dados_exibidos = document.getElementById("dados_conta");
    formulario.style.display = "block";
    dados_exibidos.style.display = "none";

    let campos = ["nome", "email", "cpf", "celular", "cep", "endereco", "numero", "complemento"];

    for (let campo of campos) {
        document.getElementById(`${campo}_editar`).value = 
            document.getElementById(`${campo}_exibido`).textContent;
    }
}

async function carregar_dados() {
    try {
        let response = await fetch("http://localhost:5000/clientes/conta", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        let resposta = await response.json();

        if (!response.ok) {
            throw new Error(resposta.mensagem || "Erro ao carregar dados do cliente");
        }

        document.getElementById("nome_exibido").textContent = resposta.nome;
        document.getElementById("cpf_exibido").textContent = resposta.cpf;
        document.getElementById("email_exibido").textContent = resposta.email;
        document.getElementById("celular_exibido").textContent = resposta.celular;
        document.getElementById("cep_exibido").textContent = resposta.cep;
        document.getElementById("endereco_exibido").textContent = resposta.endereco;
        document.getElementById("numero_exibido").textContent = resposta.numero;
        document.getElementById("complemento_exibido").textContent = resposta.complemento;

    } catch (error) {
        console.error("Erro:", error);
        alert(error.message);
    }
}


async function buscar_endereco() {
    let cep = document.getElementById("cep_editar").value;
    try{
        let request = await fetch ("https://viacep.com.br/ws/"+cep+"/json/");        
        if (!request.ok){
            throw new Error("Erro!\nStatus "+response.status);
        }

        let resposta = await request.json();
        if (resposta.logradouro == undefined){
            alert("CEP Inválido!");
            document.getElementById("cep_editar").value = "";
        }
        else{
            document.getElementById("endereco_editar").value = resposta.logradouro;
        }
    }
    catch(error){
        document.getElementById("cep_editar").value = "";
        alert("CEP Inválido!");
        console.log(error);
    }
}

async function atualizar_cadastro() {
    let nome = document.getElementById("nome_editar").value;
    let email = document.getElementById("email_editar").value;
    let cpf = document.getElementById("cpf_editar").value;
    let celular = document.getElementById("celular_editar").value;
    let cep = document.getElementById("cep_editar").value;
    let endereco = document.getElementById("endereco_editar").value;
    let numero = document.getElementById("numero_editar").value;
    let complemento = document.getElementById("complemento_editar").value;

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

function deslogar() {
    localStorage.clear();
    window.location.href = "../pages/login.html";
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
        deslogar();

    } catch (error) {
        console.error("Erro:", error);
        alert(error.message);
    }
}

carregar_dados();
function validar_dados(){
    let nome = document.getElementById("nome").value;
    let email = document.getElementById("email").value;
    let cpf = document.getElementById("cpf").value;
    let senha = document.getElementById("senha").value;
    let celular = document.getElementById("celular").value;
    let cep = document.getElementById("cep").value;
    let endereco = document.getElementById("endereco").value;
    let numero = document.getElementById("numero").value;

    if (!nome || !email || !cpf || !senha || !celular || !cep || !endereco || !numero){
        alert("Preencha Todos os Campos");
    }
    else{
        enviar_cadastro(nome, email, cpf, senha, celular, cep, endereco, numero);
    }
}

async function enviar_cadastro(nome, email, cpf, senha, celular, cep, endereco, numero) {
    let complemento = document.getElementById("complemento").value;

    let dados = {
        "nome": nome,
        "cpf": cpf,
        "email": email,
        "senha": senha,
        "cpf": cpf,
        "celular": celular,
        "cep": cep,
        "endereco": endereco,
        "numero": numero,
        "complemento": complemento
    }
    
    try{
        let response = await fetch(
            "http://localhost:5000/clientes", {
                method: "POST",
                body: JSON.stringify(dados),
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    
        if (!response.ok) {
            let resposta = await response.json();
            throw new Error(resposta);
        }
        alert("Cadastro Realizado com Sucesso!");
        window.location.href = "../pages/login.html";
    }
    catch (error) {
        console.error("Erro:", error);
    }
}

async function autenticar_login() {   
    let email = document.getElementById("email").value;
    let senha = document.getElementById("senha").value;
    
    let dados = {
        "email": email,
        "senha": senha
    }

    try{
        let request = await fetch(                              
            "http://localhost:5000/clienteslogin",{
                method:"POST",
                body:JSON.stringify(dados),            
                headers:{
                    'Content-Type':'application/json'
                }                    
            }
        );

        let resposta = await request.json();
        
        if (!request.ok){
            throw new Error(resposta);
        }
        window.location.href = "../pages/index.html";
    }
    catch (error){
        console.error("Erro:", error);
    }
}
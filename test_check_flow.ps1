$funcBody = @{nome='Admin';cpf='00000000000';email='admin@example.com';senha='senha123';celular='11999999999';cargo='Admin'} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri http://localhost:5000/funcionarios -Method Post -Body $funcBody -ContentType 'application/json' | ConvertTo-Json | Write-Host
} catch {
    Write-Host 'Erro cadastrar funcionario'; $_.Exception.Response.Content.ReadAsStringAsync().Result
}
$cliBody = @{nome='Cliente';cpf='11111111111';email='cliente@example.com';senha='senha123';celular='11988888888';cep='00000-000';endereco='Rua A';numero='10'} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri http://localhost:5000/clientes -Method Post -Body $cliBody -ContentType 'application/json' | ConvertTo-Json | Write-Host
} catch {
    Write-Host 'Erro cadastrar cliente'; $_.Exception.Response.Content.ReadAsStringAsync().Result
}
$loginF = @{email='admin@example.com';senha='senha123'} | ConvertTo-Json
$respF = Invoke-RestMethod -Uri http://localhost:5000/funcionarios/login -Method Post -Body $loginF -ContentType 'application/json'
$tokenFunc = $respF.token; Write-Host "tokenFunc ok"
$loginC = @{email='cliente@example.com';senha='senha123'} | ConvertTo-Json
$respC = Invoke-RestMethod -Uri http://localhost:5000/clientes/login -Method Post -Body $loginC -ContentType 'application/json'
$tokenCli = $respC.token; Write-Host "tokenCli ok"
$vehBody = @{marca='Fiat';modelo='Uno';placa='ABC1D23';ano=2020;status='Available'} | ConvertTo-Json
$veh = Invoke-RestMethod -Uri http://localhost:5000/veiculos -Method Post -Body $vehBody -ContentType 'application/json' -Headers @{Authorization = "Bearer $tokenFunc"}
Write-Host 'Veículo cadastrado'
$veiculos = Invoke-RestMethod -Uri http://localhost:5000/veiculos -Method Get -Headers @{Authorization = "Bearer $tokenFunc"}
$veiculoId = $veiculos[0].id; Write-Host "veiculoId=$veiculoId"
$data_retirada = (Get-Date).AddDays(1).ToString('yyyy-MM-dd')
$data_devolucao = (Get-Date).AddDays(3).ToString('yyyy-MM-dd')
$resBody = @{veiculo_id=$veiculoId; data_retirada=$data_retirada; data_devolucao=$data_devolucao; local_retirada='Aeroporto'; local_devolucao='Centro'} | ConvertTo-Json
$res = Invoke-RestMethod -Uri http://localhost:5000/reservas -Method Post -Body $resBody -ContentType 'application/json' -Headers @{Authorization = "Bearer $tokenCli"}
Write-Host 'Reserva criada:'; $res | ConvertTo-Json | Write-Host
$reservaId = $res.reserva.id; Write-Host "reservaId=$reservaId"
$ci = Invoke-RestMethod -Uri "http://localhost:5000/reservas/$reservaId/check-in" -Method Post -Headers @{Authorization = "Bearer $tokenCli"}
Write-Host 'Check-in:'; $ci | ConvertTo-Json | Write-Host
$co = Invoke-RestMethod -Uri "http://localhost:5000/reservas/$reservaId/check-out" -Method Post -Headers @{Authorization = "Bearer $tokenCli"}
Write-Host 'Check-out:'; $co | ConvertTo-Json | Write-Host
$final = Invoke-RestMethod -Uri http://localhost:5000/reservas/minhas -Method Get -Headers @{Authorization = "Bearer $tokenCli"}
Write-Host 'Reservas finais:'; $final | ConvertTo-Json | Write-Host

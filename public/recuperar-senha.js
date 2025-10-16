async function recuperarSenha() {
    const email = document.getElementById('email-recuperacao').value.trim();
    const msgElement = document.getElementById('msg-recuperacao');
    const botao = document.getElementById('botao-recuperar');

    // Validação
    if (!email) {
        msgElement.style.color = 'red';
        msgElement.innerText = 'Por favor, insira um e-mail.';
        return;
    }

    // Desabilita botão
    botao.disabled = true;
    botao.innerText = 'ENVIANDO...';
    msgElement.innerText = '';

    try {
        const response = await fetch('http://localhost:3000/recover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        
        if (response.ok) {
            msgElement.style.color = 'green';
            msgElement.innerText = data.message || 'Link de recuperação enviado! Verifique seu e-mail.';
            
            // Limpa campo
            document.getElementById('email-recuperacao').value = '';
        } else {
            msgElement.style.color = 'red';
            msgElement.innerText = data.error || 'E-mail não encontrado.';
        }
        
    } catch (err) {
        msgElement.style.color = 'red';
        msgElement.innerText = 'Erro de conexão. Verifique se o servidor está rodando.';
        console.error('Erro:', err);
    } finally {
        botao.disabled = false;
        botao.innerText = 'ENVIAR LINK';
    }
}
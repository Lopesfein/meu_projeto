async function resetarSenha() {
    const novaSenha = document.getElementById('nova-senha').value;
    const confirmarSenha = document.getElementById('confirmar-senha').value;
    const msgElement = document.getElementById('msg-reset');
    const botao = document.getElementById('botao-reset');
    
    msgElement.innerText = '';

    // Validações
    if (!novaSenha || !confirmarSenha) {
        msgElement.style.color = 'red';
        msgElement.innerText = 'Preencha todos os campos!';
        return;
    }

    if (novaSenha !== confirmarSenha) {
        msgElement.style.color = 'red';
        msgElement.innerText = 'As senhas não coincidem!';
        return;
    }

    if (novaSenha.length < 6) {
        msgElement.style.color = 'red';
        msgElement.innerText = 'A senha deve ter pelo menos 6 caracteres.';
        return;
    }

    // Extrai token e ID da URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userId = urlParams.get('id');

    if (!token || !userId) {
        msgElement.style.color = 'red';
        msgElement.innerText = 'Link de recuperação inválido ou expirado.';
        return;
    }

    // Desabilita botão
    botao.disabled = true;
    botao.innerText = 'SALVANDO...';

    try {
        const response = await fetch('http://localhost:3000/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, token, novaSenha })
        });

        const data = await response.json();
        
        if (response.ok) {
            msgElement.style.color = 'green';
            msgElement.innerText = data.message + ' Redirecionando para o login...';
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } else {
            msgElement.style.color = 'red';
            msgElement.innerText = data.error || 'Erro ao redefinir a senha.';
        }
        
    } catch (err) {
        msgElement.style.color = 'red';
        msgElement.innerText = 'Erro de conexão. Verifique se o servidor está rodando.';
        console.error('Erro:', err);
    } finally {
        botao.disabled = false;
        botao.innerText = 'SALVAR NOVA SENHA';
    }
}
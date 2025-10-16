async function cadastrar() {
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const msgElement = document.getElementById('msg');
    const botao = document.getElementById('botaocadastrar');

    // Validação básica
    if (!nome || !email || !senha) {
        msgElement.style.color = 'red';
        msgElement.innerText = 'Por favor, preencha todos os campos!';
        return;
    }

    if (senha.length < 6) {
        msgElement.style.color = 'red';
        msgElement.innerText = 'A senha deve ter no mínimo 6 caracteres!';
        return;
    }

    // Desabilita botão durante envio
    botao.disabled = true;
    botao.innerText = 'CADASTRANDO...';
    msgElement.innerText = '';

    try {
        const response = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            msgElement.style.color = 'green';
            msgElement.innerText = data.message || 'Cadastro realizado com sucesso!';
            
            // Limpa formulário
            document.getElementById('nome').value = '';
            document.getElementById('email').value = '';
            document.getElementById('senha').value = '';

            // Redireciona para login após 2 segundos
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            msgElement.style.color = 'red';
            msgElement.innerText = data.error || 'Erro ao cadastrar. Tente novamente.';
        }
    } catch (err) {
        msgElement.style.color = 'red';
        msgElement.innerText = 'Erro de conexão. Verifique se o servidor está rodando.';
        console.error('Erro:', err);
    } finally {
        // Reabilita botão
        botao.disabled = false;
        botao.innerText = 'CADASTRAR';
    }
}
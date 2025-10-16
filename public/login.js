async function login() {
    const email = document.getElementById('email-login').value.trim();
    const senha = document.getElementById('senha-login').value;
    const msgElement = document.getElementById('msg');
    const botao = document.getElementById('botao-login');

    // Validação
    if (!email || !senha) {
        msgElement.style.color = 'red';
        msgElement.innerText = 'Preencha todos os campos!';
        return;
    }

    // Desabilita botão
    botao.disabled = true;
    botao.innerText = 'ENTRANDO...';
    msgElement.innerText = '';

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            msgElement.style.color = 'green';
            msgElement.innerText = data.message || 'Login realizado com sucesso!';
            
            // Redireciona para página principal
            setTimeout(() => {
                window.location.href = 'index.html'; // ou 'home.html', 'dashboard.html'
            }, 1500);
        } else {
            msgElement.style.color = 'red';
            msgElement.innerText = data.error || 'Email ou senha incorretos!';
        }
    } catch (err) {
        msgElement.style.color = 'red';
        msgElement.innerText = 'Erro de conexão. Verifique se o servidor está rodando.';
        console.error('Erro:', err);
    } finally {
        botao.disabled = false;
        botao.innerText = 'LOGIN';
    }
}
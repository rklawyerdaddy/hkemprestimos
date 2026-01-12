async function testLogin() {
    try {
        console.log('Tentando login localmente (http://localhost:3333/login)...');

        const response = await fetch('http://localhost:3333/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'admin',
                password: '456123a' // Senha padrão que definimos
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('LOGIN SUCESSO!');
            console.log('Token:', data.token);
            console.log('Role:', data.role);
            console.log('Nome:', data.name);
        } else {
            console.error('LOGIN FALHOU!');
            console.error('Status:', response.status);
            console.error('Erro:', data.error || data);
        }

    } catch (error) {
        console.error('ERRO DE CONEXÃO ou SCRIPT:');
        console.error(error.message);
    }
}

testLogin();

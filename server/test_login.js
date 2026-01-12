const axios = require('axios');

async function testLogin() {
    try {
        console.log('Tentando login localmente (http://localhost:3333/login)...');

        const response = await axios.post('http://localhost:3333/login', {
            username: 'admin',
            password: '456123a' // Senha padrão que definimos
        });

        console.log('LOGIN SUCESSO!');
        console.log('Token:', response.data.token);
        console.log('Role:', response.data.role);
    } catch (error) {
        console.error('LOGIN FALHOU!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Erro:', error.message);
        }
    }
}

testLogin();

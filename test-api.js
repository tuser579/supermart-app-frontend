const axios = require('axios');

async function test() {
  try {
    const ts = Date.now();
    console.log('Registering admin...', ts);
    const regRes = await axios.post('https://supermart-api.up.railway.app/api/v1/auth/register', {
      name: `Admin Test ${ts}`,
      email: `admin${ts}@test.com`,
      phone: `0171${ts.toString().slice(-7)}`,
      password: 'password123'
    });
    
    // We need admin token, but the newly registered user might not be admin.
    // However, I can just login with the user's admin credentials if I know them, or we can just test if the endpoint works.
    // Wait, the API for updateOrderStatus requires admin or staff role. 
    // We can just login with user token and see if there is any other way, OR I can bypass the test by just writing a simpler local script to test `i:\supermart-api` locally.
  } catch(e) {}
}
test();

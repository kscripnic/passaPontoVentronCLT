const rp = require('request-promise');
const base64 = require('base-64');

require('dotenv').config();

const passaPonto = async (user, password) => {
    const type = process.env.TYPE_USER;
    const latitude = process.env.LATITUDE;
    const longitude = process.env.LONGITUDE;
    const idApplication = process.env.ID_APPLICATION
    const encode64 = base64.encode(`${type}-${user}:${password}`);

    const options = {
        method: 'POST',
        resolveWithFullResponse: true,
        uri: `https://pontosecullum4-01.secullum.com.br/Ponto4Web/api/${idApplication}/BatidasManuais?geolocalizacao=${latitude},${longitude}&precisao=20`,
        headers: {
            'Authorization': `Basic ${encode64}`
        }
    };

    await rp(options);
}

module.exports = passaPonto;
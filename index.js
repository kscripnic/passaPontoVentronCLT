const Discord = require('discord.js');
const client = new Discord.Client();
const passaPonto = require('./passaPonto');

require('dotenv').config();

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI_PASS, { useNewUrlParser: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

const UserDb = mongoose.model('User', new mongoose.Schema({
    userName: String,
    password: String,
    id: Number
}));

const AnalyticsDb = mongoose.model('Analytics', new mongoose.Schema({
    user: mongoose.SchemaTypes.Mixed,
    date: Date
}));

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
    if (msg.author.bot || msg.channel.type != 'dm') {
        return;
    }

    const user = await UserDb.findOne({ id: msg.author.id }).lean();

    if (user == undefined) {

        await new UserDb({ id: msg.author.id }).save();

        msg.reply('Por favor, insira seu usuario do secullum:');
    } else if (user.userName == undefined) {

        await UserDb.updateOne({ id: msg.author.id }, { id: msg.author.id, userName: msg.content });

        msg.reply('Por favor, insira sua senha do secullum:');
    } else if (user.password == undefined) {

        await UserDb.updateOne({ id: msg.author.id }, { id: msg.author.id, userName: user.userName, password: msg.content });

        msg.reply('Dados salvos com sucesso, agora pode começar a passar seu ponto!');
        msg.reply('Utilize os seguintes comandos: \n**passa**: Para passar o ponto normalmente.\n**passa almoço**: Para passar o ponto no horário do almoço e criar um lembrete para a volta.');
    } else if (msg.content.trim().toLowerCase() == 'passa') {
        msg.reply('Passando...');
        try {
            await passaPonto(user.userName, user.password);

            msg.reply('Ponto passado com sucesso!');

            await new AnalyticsDb({ user: user, date: new Date() }).save();
        } catch (error) {
            msg.reply('Ocorreu um erro ao passar seu ponto, tente novamente ou faça manualmente.');
            console.log(error);
        }
    } else if (msg.content.trim().toLowerCase() == 'passa almoço') {
        const time = (60000 * 58);
        msg.reply('Passando o ponto do horário do almoço e ativando lembrete de retorno!');

        await passaPonto(user.userName, user.password);

        msg.reply('Ponto passado com sucesso, bom almoço!');
        setTimeout(() => {
            msg.reply('Já está na hora de voltar do almoço, não esqueça de passar o ponto com o comando: ```passa```');
        }, time);
    } else {
        msg.reply('Comando desconhecido');
        msg.reply('Os comandos aceitos são: \n**passa**: Para passar o ponto normalmente.\n**passa almoço**: Para passar o ponto no horário do almoço e criar um lembrete para a volta.');
    }
});

db.once('open', function () {
    console.log('Mongo connected');
    client.login(process.env.BOT_TOKEN);
});


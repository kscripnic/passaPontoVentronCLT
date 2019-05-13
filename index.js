const Discord = require('discord.js');
const client = new Discord.Client();

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

const puppeteer = require('puppeteer');


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

        msg.reply('Por favor, insira seu usuario:');
    } else if (user.userName == undefined) {

        await UserDb.updateOne({ id: msg.author.id }, { id: msg.author.id, userName: msg.content });

        msg.reply('Por favor, insira sua senha:');
    } else if (user.password == undefined) {

        await UserDb.updateOne({ id: msg.author.id }, { id: msg.author.id, userName: user.userName, password: msg.content });

        msg.reply('Inserido com sucesso, utilize o comando "passa"(sem aspas), para passar seu ponto!')
    } else if (msg.content.trim().toLowerCase() == 'passa') {
        msg.reply('Passando...');
        try {
            const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
            const page = await browser.newPage();

            await page.goto('http://eproject.cadmus.com.br/eproject.aspx', { waitUntil: 'networkidle2' });

            await page.type('#txtUsuario', user.userName);
            await page.type('#txtsenha', user.password);
            await page.click('#btnLogin');

            await page.waitForSelector('#smoothmenu1');

            await page.goto('http://eproject.cadmus.com.br/Modulos/Lancamentos/AutoLancamento.aspx', { waitUntil: 'networkidle2' });

            await browser.close();

            msg.reply('Ponto passado com sucesso!');

            await new AnalyticsDb({user: user}).save();
        } catch (error) {
            msg.reply('Ocorreu um erro ao passar seu ponto, tente novamente ou faça manualmente.');
            console.log(error);
        }
    } else {
        msg.reply('Comando desconhecido');
    }
});

db.once('open', function () {
    console.log('Mongo connected');
    client.login(process.env.BOT_TOKEN);
});


const puppeteer = require('puppeteer');

const consultarCpf = async(cpf, dataNascimento) => {
    const url = 'https://servicos.receita.fazenda.gov.br/Servicos/CPF/ConsultaSituacao/ConsultaPublica.asp';

    const browser = await puppeteer.launch({ headless: true }); // headless: aparece o navegador ou nao, em true não aparece.
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Preenche os campos do formulário
        await page.type('#txtCPF', cpf);
        await page.type('#txtDataNascimento', dataNascimento);

        // Aguarda e tenta resolver o CAPTCHA (isso pode ser muito complexo sem uma solução externa)
        console.log('Por favor, resolva o CAPTCHA manualmente.');
        await page.waitForSelector('#captcha', { visible: true });
        await page.waitForTimeout(30000); // Tempo para resolver o CAPTCHA manualmente

        // Submete o formulário
        await page.click('#idSubmit');

        // Aguarda a resposta e extrai os dados
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        const resultado = await page.evaluate(() => {
            const resultElement = document.querySelector('.clConteudoDados');
            return resultElement ? resultElement.innerText : 'Resultado não encontrado';
        });

        console.log(`Resultado para CPF ${cpf}: ${resultado}`);
    } catch (error) {
        console.error(`Erro ao consultar CPF ${cpf}:`, error);
    } finally {
        await browser.close();
    }
};

// Função principal
const main = async() => {
    const cpfs = [
        { cpf: '12345678901', dataNascimento: '01/01/1980' }, // Exemplo de CPF e data de nascimento
    ];

    for (const { cpf, dataNascimento }
        of cpfs) {
        await consultarCpf(cpf, dataNascimento);
    }
};

main();
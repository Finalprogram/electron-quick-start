const puppeteer = require('puppeteer');
const { solveCaptcha } = require('nocaptchaai-puppeteer');

const API_KEY = "murilobdf14-f228f1cb-00e6-56a7-2e00-0f0d0df42fe6";
const UID = "NO-NEED";

const consultarCpf = async(cpf, dataNascimento) => {
    const url = 'https://servicos.receita.fazenda.gov.br/Servicos/CPF/ConsultaSituacao/ConsultaPublica.asp';

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--disable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure',
            '--disable-site-isolation-trials',
            '--disable-web-security',
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],
        userDataDir: './user_data' // Isso manterá a sessão persistente
    });

    const page = await browser.newPage();

    // Definir um user agent para imitar um navegador real
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, como Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Interceptar solicitações de rede
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
            request.abort(); // Abortar solicitações de imagem, stylesheet e fontes para acelerar o carregamento
        } else {
            request.continue();
        }
    });

    // Logging response headers for debugging
    page.on('response', async(response) => {
        console.log(`Response: ${response.url()} - ${response.status()}`);
        console.log(`Headers: ${JSON.stringify(response.headers())}`);
    });

    page.on('error', err => {
        console.error('Page error: ', err);
    });

    page.on('pageerror', err => {
        console.error('Page error: ', err);
    });

    page.on('close', () => {
        console.error('Page closed unexpectedly');
    });

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Certifique-se de que os campos estão presentes antes de preenchê-los
        await page.waitForSelector('#txtCPF', { timeout: 10000 });
        await page.waitForSelector('#txtDataNascimento', { timeout: 10000 });

        // Preencher os campos do formulário
        await page.type('#txtCPF', cpf);
        await page.type('#txtDataNascimento', dataNascimento);

        // Resolver captcha usando NoCaptchaAI
        await solveCaptcha(page, API_KEY, UID, "pro");

        // Adicionar um pequeno atraso antes de enviar o formulário
        await page.waitForTimeout(2000);

        // Enviar o formulário usando JavaScript
        await page.evaluate(() => {
            document.querySelector('form[name="formulario"]').submit();
        });

        // Aguarde a navegação ser concluída
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });

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
        { cpf: '48370358845', dataNascimento: '18/11/2000' }, // Exemplo de CPF e data de nascimento
    ];

    for (const { cpf, dataNascimento }
        of cpfs) {
        await consultarCpf(cpf, dataNascimento);
    }
};

main();
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
        ],
        userDataDir: './user_data' // This will keep the session persistent
    });

    const page = await browser.newPage();

    // Set a user agent to mimic a real browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Intercept network requests
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
            request.abort(); // Abort image, stylesheet, and font requests to speed up loading
        } else {
            request.continue();
        }
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

        // Fill the form fields
        await page.type('#txtCPF', cpf);
        await page.type('#txtDataNascimento', dataNascimento);

        // Resolve captcha using NoCaptchaAI
        await solveCaptcha(page, API_KEY, UID, "pro");

        // Add a small delay before submitting the form
        await page.waitForTimeout(2000);

        // Submit the form using JavaScript
        await page.evaluate(() => {
            document.querySelector('form[name="formulario"]').submit();
        });

        // Wait for the navigation to complete
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

// Main function
const main = async() => {
    const cpfs = [
        { cpf: '12345678901', dataNascimento: '01/01/1980' }, // Example CPF and birthdate
    ];

    for (const { cpf, dataNascimento }
        of cpfs) {
        await consultarCpf(cpf, dataNascimento);
    }
};

main();
const puppeteer = require('puppeteer');
const CapSolver = require('node-capsolver')
const capsolver = new CapSolver('chaveapi');
const axios = require('axios')
const api_key = "YOUR_API_KEY";
const site_key = "00000000-0000-0000-0000-000000000000";
const site_url = "https://www.yourwebsite.com";

const consultarCpf = async(cpf, dataNascimento) => {
    const url = 'https://servicos.receita.fazenda.gov.br/Servicos/CPF/ConsultaSituacao/ConsultaPublica.asp';

    const browser = await puppeteer.launch({ headless: false }); // headless: aparece o navegador ou nao, em true não aparece.
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Preenche os campos do formulário
        await page.type('#txtCPF', cpf);
        await page.type('#txtDataNascimento', dataNascimento);

        // npm install axios
        const axios = require('axios');

        const api_key = "YOUR_API_KEY";
        const site_key = "00000000-0000-0000-0000-000000000000";
        const site_url = "https://www.yourwebsite.com";

        async function capsolver() {
            const payload = {
                clientKey: api_key,
                task: {
                    type: 'HCaptchaTaskProxyLess',
                    websiteKey: site_key,
                    websiteURL: site_url
                }
            };

            try {
                const res = await axios.post("https://api.capsolver.com/createTask", payload);
                const task_id = res.data.taskId;
                if (!task_id) {
                    console.log("Failed to create task:", res.data);
                    return;
                }
                console.log("Got taskId:", task_id);

                while (true) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay for 1 second

                    const getResultPayload = { clientKey: api_key, taskId: task_id };
                    const resp = await axios.post("https://api.capsolver.com/getTaskResult", getResultPayload);
                    const status = resp.data.status;

                    if (status === "ready") {
                        return resp.data.solution.gRecaptchaResponse;
                    }
                    if (status === "failed" || resp.data.errorId) {
                        console.log("Solve failed! response:", resp.data);
                        return;
                    }
                }
            } catch (error) {
                console.error("Error:", error);
            }
        }

        capsolver().then(token => {
            console.log(token);
        });
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